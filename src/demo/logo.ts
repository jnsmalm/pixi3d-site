import { Application } from "pixi.js";
import { Camera, Color, Container3D, Cubemap, glTFAsset, ImageBasedLighting, Light, LightingEnvironment, LightType, Mesh3D, Model, StandardMaterial, Vec3 } from "pixi3d";
import { Trail, TrailRenderer } from "../components/TrailRenderer";

export class Logo {
  private _app: Application

  constructor(view: HTMLCanvasElement, resizeTo?: HTMLElement) {
    this._app = new Application({
      view,
      backgroundAlpha: 0,
      antialias: false,
      autoDensity: true,
      resolution: Math.max(2, window.devicePixelRatio),
      resizeTo: resizeTo || window
    })
  }

  async load() {
    this._app.loader.add("logo", "/models/logo.glb")
    return new Promise<void>(resolve => {
      this._app.loader.load(() => {
        resolve()
      })
    })
  }

  setupLighting() {
    LightingEnvironment.main.imageBasedLighting = new ImageBasedLighting(
      Cubemap.fromColors(Color.fromHex(0x111111)),
      Cubemap.fromColors(Color.fromHex(0x555555))
    )
    let dirLight = Object.assign(new Light(), {
      type: "directional", intensity: 1.5
    })
    dirLight.rotationQuaternion.setEulerAngles(0, 180, 0)
    LightingEnvironment.main.lights.push(dirLight)
  }

  createLogo(gltf: glTFAsset) {
    let model = this._app.stage.addChild(Model.from(gltf));
    model.scale.set(1)
    model.rotationQuaternion.setEulerAngles(0, 25, 0)
    model.position.y = 0
    model.meshes.forEach(mesh => {
      (mesh.material as StandardMaterial).exposure = 1.1;
      (mesh.material as StandardMaterial).roughness = 0.9;
      (mesh.material as StandardMaterial).metallic = 0;
    });
  }

  createRibbon() {
    let container = this._app.stage.addChild(new Container3D())
    let tracker = container.addChild(new Container3D())
    tracker.z = 0.8

    let light = Object.assign(new Light(), {
      intensity: 1,
      type: LightType.point,
      range: 10,
      color: Color.fromBytes(170, 122, 254)
    })
    LightingEnvironment.main.lights.push(light)

    tracker.addChild(light)

    let trailRenderer = this._app.stage.addChild(new TrailRenderer())
    trailRenderer.material.colorA = Color.fromBytes(254, 150, 141)
    trailRenderer.material.colorB = Color.fromBytes(170, 122, 254)

    let trail: Trail | undefined
    let rotation = 0

    this._app.ticker.add(() => {
      let transform = tracker.worldTransform
      container.rotationQuaternion.setEulerAngles(rotation += 3, 0, 0)
      container.x = Math.sin(rotation * 0.01) * 2
      if (!trail) {
        trail = trailRenderer.startTrail(0.15,
          transform.position, transform.forward)
      } else {
        trail.addPoint(transform.position, transform.forward)
      }

    })
  }

  setupCamera() {
    Camera.main.orthographic = true
    Camera.main.orthographicSize = 1.5
  }

  show() {
    this.setupLighting()
    this.createLogo(this._app.loader.resources["logo"].gltf)
    this.setupCamera()
    this.createRibbon()
  }
}