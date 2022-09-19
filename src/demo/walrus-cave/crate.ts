import gsap from "gsap"
import { Container3D, glTFAsset, Model, StandardMaterial } from "pixi3d"

export class Crate extends Container3D {
  constructor(gltf :glTFAsset, bouancyPosition: number, exposure: number) {
    super()

    let model = this.addChild(Model.from(gltf))
    model.scale.set(1.9)
    model.meshes.forEach(mesh => {
      mesh.enableRenderPass("color");
      (mesh.material as StandardMaterial).exposure = exposure
    })
  
    gsap.to(model, {
      duration: 1, y: bouancyPosition, yoyo: true, repeat: -1, ease: "sine.inOut"
    })
  }
}