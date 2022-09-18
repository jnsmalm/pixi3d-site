import gsap from "gsap";
import { Application } from "pixi.js";
import { Camera, Color, glTFAsset, ImageBasedLighting, Light, LightingEnvironment, LightType, Model, PickingHitArea } from "pixi3d";

export class ShatteringStatue {
  private app: Application

  constructor(view: HTMLCanvasElement, resizeTo?: HTMLElement) {
    this.app = new Application({
      view,
      backgroundColor: 0x87bbc9,
      antialias: false,
      autoDensity: true,
      resolution: Math.max(2, window.devicePixelRatio),
      resizeTo: resizeTo || window
    })
  }

  async load() {
    this.app.loader.add("/models/statue-shatter.glb")
    this.app.loader.add("/models/statue.glb")
    this.app.loader.add("/environments/photo-studio/diffuse.cubemap")
    this.app.loader.add("/environments/photo-studio/specular.cubemap")

    return new Promise<void>(resolve => {
      this.app.loader.load(() => {
        resolve()
      })
    })
  }

  setupLighting() {
    let resources = this.app.loader.resources
    LightingEnvironment.main.imageBasedLighting = new ImageBasedLighting(
      resources["/environments/photo-studio/diffuse.cubemap"].cubemap,
      resources["/environments/photo-studio/specular.cubemap"].cubemap
    )
    let spotLight = new Light()
    spotLight.type = LightType.spot
    spotLight.intensity = 100
    spotLight.position.set(0, 2, 5)
    spotLight.color = new Color(1, 1, 1)
    spotLight.range = 30
    spotLight.rotationQuaternion.setEulerAngles(0, 180, 0)
    LightingEnvironment.main.lights.push(spotLight)
  }

  createStatue(gltf: glTFAsset) {
    let model = this.app.stage.addChild(Model.from(gltf));
    model.position.y = -5.5
    return model
  }

  setupCamera() {
    Camera.main.position.z = 5
    this.app.ticker.add(() => {
      let aspectRatio = this.app.renderer.width / this.app.renderer.height
      if (aspectRatio > 0.8) {
        Camera.main.fieldOfView = 60
      } else {
        Camera.main.fieldOfView = 60
      }
    })
  }

  playShatterAnimation(statue: Model, shatterStatue: Model) {
    statue.visible = false
    shatterStatue.animations[0].speed = 1.5
    shatterStatue.animations[0].play()
    shatterStatue.animations[0].position = 0.6
    shatterStatue.animations[0].once("complete", () => {
      statue.rotationQuaternion.setEulerAngles(-90, 0, 0)
      statue.visible = true
      shatterStatue.scale.set(0)
      let target = { x: -90 }
      gsap.to(target, {
        x: 0, ease: "elastic", duration: 2, onUpdate: () => {
          statue.rotationQuaternion.setEulerAngles(0, 0, target.x)
        }
      })
    })
    shatterStatue.scale.set(1)
  }

  show() {
    this.setupLighting()
    this.setupCamera()

    let statue = this.createStatue(
      this.app.loader.resources["/models/statue.glb"].gltf)
    statue.interactive = true
    statue.hitArea = PickingHitArea.fromObject(statue)
    statue.on("pointerdown", () => {
      let pointer = document.getElementById("pointer")
      if (pointer) {
        pointer.style.display = "none"
      }
      this.playShatterAnimation(statue, shatterStatue)
    })
    statue.buttonMode = true

    let shatterStatue = this.createStatue(
      this.app.loader.resources["/models/statue-shatter.glb"].gltf)
    shatterStatue.scale.set(0)
  }
}