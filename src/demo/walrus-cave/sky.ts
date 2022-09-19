import { Texture, Ticker } from "pixi.js"
import { Container3D, glTFAsset, Model } from "pixi3d"
import { SkyMaterial } from "./sky-material"

export class Sky extends Container3D {
  constructor(gltf: glTFAsset) {
    super()

    let model = this.addChild(Model.from(gltf, {
      create: () => new SkyMaterial(Texture.from("/textures/sky.jpg"))
    }))
    model.y = 1.6
    model.scale.set(0.03)

    let ticker = new Ticker()
    ticker.start()

    let rotation = 0
    ticker.add(() => {
      model.rotationQuaternion.setEulerAngles(0, rotation += 0.01, 0);
    })
  }
}