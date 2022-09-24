import gsap from "gsap";
import { Howl } from "howler";
import { Application, Graphics, Renderer, Sprite, Texture } from "pixi.js";
import { Camera, Color, Cubemap, ImageBasedLighting, LightingEnvironment } from "pixi3d";
import { Cinema } from "./pink-cube/cinema";
import { Level } from "./pink-cube/level";
import { Map } from "./pink-cube/map";

export class PinkCube {
  private app: Application
  private levelIndex = 0
  private level?: Level
  private screenFlash: Sprite
  private screenCinema: Cinema
  private sounds: Howl

  constructor(view: HTMLCanvasElement, resizeTo?: HTMLElement) {
    this.app = new Application({
      view,
      backgroundColor: 0xFFB4F8,
      antialias: false,
      autoDensity: true,
      resolution: Math.max(2, window.devicePixelRatio),
      resizeTo: resizeTo || window
    })
    this.app.stage.sortableChildren = true
    this.screenFlash = this.createScreenFlash()
    this.screenCinema = this.createScreenCinema()
    this.sounds = this.createSounds()
  }

  get resources() {
    return this.app.loader.resources
  }

  async load() {
    this.app.loader.add("/models/crash.glb")
    this.app.loader.add("/models/goal.glb")
    this.app.loader.add("/textures/map.png")

    return new Promise<void>(resolve => {
      this.app.loader.load(() => {
        resolve()
      })
    })
  }

  createScreenCinema() {
    let cinema = this.app.stage.addChild(new Cinema(this.app.renderer as Renderer))
    cinema.zIndex = 1
    return cinema
  }

  createScreenFlash() {
    let flash = this.app.stage.addChild(new Sprite(Texture.WHITE))
    flash.zIndex = 2
    flash.alpha = 0
    this.app.ticker.add(() => {
      flash.width = this.app.renderer.width
      flash.height = this.app.renderer.height
    })
    return flash
  }

  setupLighting() {
    let ibl = new ImageBasedLighting(Cubemap.fromColors(
      Color.fromBytes(140, 140, 140),
      Color.fromBytes(140, 140, 140),
      Color.fromBytes(230, 230, 230),
      Color.fromBytes(120, 120, 120),
      Color.fromBytes(160, 160, 160),
      Color.fromBytes(160, 160, 160),
    ), Cubemap.fromColors(
      Color.fromBytes(255, 255, 255)
    ))
    LightingEnvironment.main.imageBasedLighting = ibl
  }

  setupCamera() {
    Camera.main.position.z = 2.1
    Camera.main.rotationQuaternion.setEulerAngles(-10, 180, 0)

    this.app.ticker.add(() => {
      let aspectRatio = this.app.renderer.width / this.app.renderer.height
      if (aspectRatio > 0.8) {
        Camera.main.fieldOfView = 60
      } else {
        Camera.main.fieldOfView = 77
      }
    })
  }

  createSounds() {
    return new Howl({
      "src": [
        "/sounds/pink-cube.ogg",
        "/sounds/pink-cube.m4a"
      ],
      "sprite": {
        "sad": [
          0,
          9366.666666666668
        ],
        "tap": [
          11000,
          291.65532879818556
        ],
        "win": [
          13000,
          1025.1700680272115
        ]
      }
    })
  }

  setupControls() {
    document.getElementById("left")?.addEventListener("click", () => {
      this.level?.movePlayerLeft()
    })
    document.getElementById("up")?.addEventListener("click", () => {
      this.level?.movePlayerFoward()
    })
    document.getElementById("down")?.addEventListener("click", () => {
      this.level?.movePlayerBackward()
    })
    document.getElementById("right")?.addEventListener("click", () => {
      this.level?.movePlayerRight()
    })
    document.getElementById("refresh")?.addEventListener("click", () => {
      if (this.level?.onReset) {
        this.level?.onReset()
      }
    })
    document.addEventListener("keydown", e => {
      switch (e.key) {
        case "a":
        case "ArrowLeft": {
          this.level?.movePlayerLeft()
          break
        }
        case "w":
        case "ArrowUp": {
          this.level?.movePlayerFoward()
          break
        }
        case "s":
        case "ArrowDown": {
          this.level?.movePlayerBackward()
          break
        }
        case "d":
        case "ArrowRight": {
          this.level?.movePlayerRight()
          break
        }
      }
    })
  }

  hideUI() {
    document.getElementById("controls")?.classList.add("opacity-0")
  }

  showUI() {
    document.getElementById("controls")?.classList.remove("opacity-0")
  }

  show() {
    this.setupLighting()
    this.setupCamera()
    this.setupControls()

    const map = new Map(this.app.renderer as Renderer,
      this.resources["/textures/map.png"].texture!)

    this.level = this.app.stage.addChild(
      new Level(this.resources, this.app.view, this.sounds, LightingEnvironment.main))
    this.level.loadSection(map, this.levelIndex)

    this.level.onGoal = () => {
      gsap.to(this.screenFlash, {
        duration: 0.1, alpha: 1, ease: "power3.out", onComplete: () => {
          this.levelIndex = (this.levelIndex + 1) % map.levels
          this.level?.loadSection(map, this.levelIndex)
          gsap.to(this.screenFlash, {
            duration: 0.7, alpha: 0, ease: "power1.out", delay: 0.05
          })
        }
      })
    }
    this.level.onReset = () => {
      this.showUI()
      gsap.to(this.screenFlash, {
        duration: 0.1, alpha: 1, ease: "power3.out", onComplete: () => {
          this.screenCinema.value = 0
          this.level?.loadSection(map, this.levelIndex)
          gsap.to(this.screenFlash, {
            duration: 0.7, alpha: 0, ease: "power1.out", delay: 0.05
          })
        }
      })
    }
    this.level.onScene = () => {
      setTimeout(() => {
        this.hideUI()
      }, 200)
      gsap.to(this.screenCinema, { duration: 5, value: 1, ease: "power2.inOut" })
    }

  }
}