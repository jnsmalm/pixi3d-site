import Hammer from "hammerjs"
import gsap from "gsap";

import { Application, Renderer, RenderTexture, Texture } from "pixi.js";
import { Camera, CameraOrbitControl, Container3D, ImageBasedLighting, Light, LightingEnvironment, MaterialRenderPass, Model, StandardPipeline } from "pixi3d";
import { Crate } from "./walrus-cave/crate";
import { Shark } from "./walrus-cave/shark";
import { Sky } from "./walrus-cave/sky";
import { Water } from "./walrus-cave/water";

export class WalrusCave {
  private touch: gsap.core.Tween | undefined
  private app: Application
  private control: CameraOrbitControl

  constructor(view: HTMLCanvasElement, resizeTo?: HTMLElement) {
    this.app = new Application({
      view,
      backgroundColor: 0xdddddd,
      antialias: false,
      autoDensity: true,
      resolution: Math.max(2, window.devicePixelRatio),
      resizeTo: resizeTo || window
    })
    this.control = new CameraOrbitControl(this.app.view)
  }

  get resources() {
    return this.app.loader.resources
  }

  async load() {
    this.app.loader.add("/models/cave.glb")
    this.app.loader.add("/models/surface.glb")
    this.app.loader.add("/models/shark.glb")
    this.app.loader.add("/models/crate.glb")
    this.app.loader.add("/models/sky.glb")
    this.app.loader.add("/textures/water-height.png")
    this.app.loader.add("/textures/water-normal.png")
    this.app.loader.add("/textures/sky.jpg")
    this.app.loader.add("/environments/photo-studio/diffuse.cubemap")
    this.app.loader.add("/environments/photo-studio/specular.cubemap")

    return new Promise<void>(resolve => {
      this.app.loader.load(() => {
        resolve()
      })
    })
  }

  setupLighting() {
    let lightContainer = this.app.stage.addChild(new Container3D())
    lightContainer.rotationQuaternion.setEulerAngles(0, 270, 0)

    let directionalLight = lightContainer.addChild(Object.assign(new Light(), {
      intensity: 1,
      type: "directional",
      enabled: false
    }))
    directionalLight.rotationQuaternion.setEulerAngles(25, 0, 0)
    directionalLight.position.set(0, 10, 10)
    LightingEnvironment.main.lights.push(directionalLight)

    let imageBasedLighting = new ImageBasedLighting(
      this.resources["/environments/photo-studio/diffuse.cubemap"].cubemap,
      this.resources["/environments/photo-studio/specular.cubemap"].cubemap)
    LightingEnvironment.main.imageBasedLighting = imageBasedLighting

    return { directionalLight }
  }

  setupRenderPasses() {
    let colorRenderTexture = RenderTexture.create({
      width: this.app.renderer.width,
      height: this.app.renderer.height
    })
    colorRenderTexture.rotate = 8
    colorRenderTexture.framebuffer.addDepthTexture()

    this.app.ticker.add(() => {
      colorRenderTexture.resize(this.app.renderer.width, this.app.renderer.height)
    })
    let colorPass = new MaterialRenderPass(this.app.renderer as Renderer, "color")
    colorPass.renderTexture = colorRenderTexture

    let pipeline = this.app.renderer.plugins.pipeline as StandardPipeline
    pipeline.renderPasses.unshift(colorPass)

    return {
      colorPass,
      depthTexture: new Texture(colorRenderTexture.framebuffer.depthTexture)
    }
  }

  setupCamera() {
    this.control.allowControl = false
    this.control.angles.x = 15
    this.control.angles.y = -105
    this.control.target = { x: 0, y: 0, z: 1.8 }
    this.control.distance = 20

    this.app.ticker.add(() => {
      let aspectRatio = this.app.renderer.width / this.app.renderer.height
      if (aspectRatio > 0.8) {
        Camera.main.fieldOfView = 60
      } else {
        Camera.main.fieldOfView = 90
      }
    })
  }

  setupTouchControl() {
    let hammertime = new Hammer(document.getElementById("demo")!, {})
    hammertime.on("pan", (e) => {
      if (this.control) {
        this.control.angles.y += e.velocityX * 2
      }
      if (this.touch) {
        this.touch.kill()
      }
    })
    hammertime.on("panend", (e) => {
      if (this.control) {
        this.touch = gsap.to(this.control.angles, {
          duration: 1, y: -105, ease: "power2.out"
        })
      }
    })
  }

  show() {
    let { colorPass, depthTexture } = this.setupRenderPasses()
    let { directionalLight } = this.setupLighting()

    this.setupCamera()
    this.setupTouchControl()

    let cave = this.app.stage.addChild(Model.from(this.resources["/models/cave.glb"].gltf))
    cave.meshes.forEach(mesh => {
      mesh.enableRenderPass("color")
    })

    this.app.stage.addChild(new Shark(
      this.resources["/models/shark.glb"].gltf, -13, -40, 0.25, 0.4))
    this.app.stage.addChild(new Shark(
      this.resources["/models/shark.glb"].gltf, -15, -70, 0.25, 0.3))
    this.app.stage.addChild(new Shark(
      this.resources["/models/shark.glb"].gltf, -14, 170, 0.25, 0.45))

    let water = this.app.stage.addChild(new Water(this.app.renderer as Renderer,
      this.resources["/models/surface.glb"].gltf, depthTexture, colorPass, directionalLight))
    water.y = 1.4

    this.app.stage.addChild(new Sky(
      this.resources["/models/sky.glb"].gltf))

    let crate1 = this.app.stage.addChild(
      new Crate(this.resources["/models/crate.glb"].gltf, 0.3, 3))
    crate1.position.set(7, 0.8, 0)
    crate1.rotationQuaternion.setEulerAngles(-10, -10, 0)

    let crate2 = this.app.stage.addChild(
      new Crate(this.resources["/models/crate.glb"].gltf, -0.3, 4))
    crate2.position.set(9, 1, 2)
    crate2.rotationQuaternion.setEulerAngles(8, 25, 0)
  }
}