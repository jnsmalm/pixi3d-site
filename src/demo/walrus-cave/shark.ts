import { Ticker } from "pixi.js"
import { Container3D, glTFAsset, Model } from "pixi3d"
import { SwimMatrial } from "./swim-material"

export class Shark extends Container3D {
  constructor(gltf: glTFAsset, distanceFromCenter: number, startRotation: number, public speed: number, scale = 1) {
    super()

    this.rotation = startRotation

    let ticker = new Ticker()
    ticker.add(() => {
      this.rotationQuaternion.setEulerAngles(0, this.rotation -= this.speed, 0)
    })
    ticker.start()

    let model = this.addChild(Model.from(gltf))
    model.z = distanceFromCenter
    model.y = -0.7
    model.scale.set(scale)
    model.meshes.forEach(mesh => {
      mesh.material = new SwimMatrial()
      mesh.enableRenderPass("color")
    })
  }
}