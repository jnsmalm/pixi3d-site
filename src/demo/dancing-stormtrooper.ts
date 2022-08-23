import { Application, Renderer } from "pixi.js";
import { Camera, Color, glTFAsset, ImageBasedLighting, Light, LightingEnvironment, Mesh3D, Model, ShadowCastingLight, ShadowQuality, Sprite3D, StandardMaterial, StandardPipeline } from "pixi3d";

export class DancingStormtrooper {
  private _app: Application

  constructor(view: HTMLCanvasElement, resizeTo?: HTMLElement) {
    this._app = new Application({
      view,
      backgroundColor: 0xdddddd,
      antialias: false,
      autoDensity: true,
      resolution: Math.max(2, window.devicePixelRatio),
      resizeTo: resizeTo || window
    })
  }

  async load() {
    this._app.loader.add(
      "dancing-stormtrooper", "/models/dancing-stormtrooper.glb")
    this._app.loader.add(
      "photo-studio-diffuse", "/photo-studio/diffuse.cubemap")
    this._app.loader.add(
      "photo-studio-specular", "/photo-studio/specular.cubemap")

    return new Promise<void>(resolve => {
      this._app.loader.load(() => {
        resolve()
      })
    })
  }

  setupLighting() {
    let resources = this._app.loader.resources
    LightingEnvironment.main.imageBasedLighting = new ImageBasedLighting(
      resources["photo-studio-diffuse"].cubemap,
      resources["photo-studio-specular"].cubemap
    )
    let dirLight = Object.assign(new Light(), {
      type: "directional", intensity: 1.5, x: 0, y: 0, z: 5
    })
    dirLight.rotationQuaternion.setEulerAngles(10, 220, 0)
    LightingEnvironment.main.lights.push(dirLight)
    return dirLight
  }

  createStormtrooper(gltf: glTFAsset) {
    let model = this._app.stage.addChild(Model.from(gltf));
    model.scale.set(100)
    model.position.y = -2.3
    model.meshes.forEach(mesh => {
      (mesh.material as StandardMaterial).exposure = 1.1;
      (mesh.material as StandardMaterial).roughness = 0.6;
      (mesh.material as StandardMaterial).metallic = 0;
    });
    return model
  }

  createGreenScreen() {
    let greenScreen = this._app.stage.addChild(Mesh3D.createQuad())
    greenScreen.scale.set(3);

    let material = greenScreen.material as StandardMaterial
    material.baseColor = Color.fromBytes(0, 170, 25);
    material.exposure = 0.73;
    material.metallic = 0;
    material.roughness = 0.8;

    return greenScreen
  }

  setupShadows(stormtrooper: Model, greenScreen: Mesh3D, dirLight: Light) {
    let shadowCastingLight = new ShadowCastingLight(
      this._app.renderer as Renderer, dirLight, { shadowTextureSize: 1024, quality: ShadowQuality.medium })
    shadowCastingLight.softness = 1
    shadowCastingLight.shadowArea = 10

    let pipeline = this._app.renderer.plugins.pipeline as StandardPipeline
    pipeline.enableShadows(greenScreen, shadowCastingLight)
    pipeline.enableShadows(stormtrooper, shadowCastingLight)
  }

  startAnimation(model: Model) {
    model.animations[0].loop = true
    model.animations[0].play()
  }

  setupCamera() {
    Camera.main.position.z = 2.1
    Camera.main.rotationQuaternion.setEulerAngles(-10, 180, 0)

    this._app.ticker.add(() => {
      let aspectRatio = this._app.renderer.width / this._app.renderer.height
      if (aspectRatio > 0.8) {
        Camera.main.fieldOfView = 60
      } else {
        Camera.main.fieldOfView = 77
      }
    })
  }

  show() {
    let dirLight = this.setupLighting()
    let stormtrooper = this.createStormtrooper(this._app.loader.resources["dancing-stormtrooper"].gltf)
    let greenScreen = this.createGreenScreen()

    this.startAnimation(stormtrooper)
    this.setupCamera()
    this.setupShadows(stormtrooper, greenScreen, dirLight)
  }
}