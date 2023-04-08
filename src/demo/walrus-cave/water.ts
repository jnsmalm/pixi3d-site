import { Renderer, Texture, Ticker, WRAP_MODES } from "pixi.js";
import { Container3D, glTFAsset, Light, MaterialRenderPass, Model } from "pixi3d";
import { WaterMatrial } from "./water-material";

export class Water extends Container3D {
  constructor(renderer: Renderer, gltf: glTFAsset, depthTexture: Texture, colorPass: MaterialRenderPass, directionalLight: Light) {
    super()

    let heightTexture = Texture.from("/textures/water-height.png")
    heightTexture.baseTexture.wrapMode = WRAP_MODES.REPEAT

    let normalTexture = Texture.from("/textures/water-normal.png")
    normalTexture.baseTexture.wrapMode = WRAP_MODES.REPEAT

    let waterMaterial = new WaterMatrial(
      renderer, heightTexture, normalTexture, depthTexture, colorPass)

    let model = this.addChild(Model.from(gltf))
    model.scale.set(0.9)
    model.meshes[0].material = waterMaterial

    Ticker.shared.add(() => {
      waterMaterial.time += Ticker.shared.elapsedMS / 1000
      waterMaterial.lightDirection = directionalLight.worldTransform.forward.array
    })
  }
}