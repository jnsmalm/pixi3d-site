import { Color, Container3D, glTFAsset, LightingEnvironment, Model, StandardMaterial } from "pixi3d"

export class Goal extends Container3D {
  constructor(x = 0, y = 0, z = 0, gltf: glTFAsset, lightingEnvironment: LightingEnvironment) {
    super()

    this.position.set(x, y, z)

    let model = this.addChild(Model.from(gltf))
    model.scale.set(0.63)
    model.position.set(0, -0.5, 0)

    model.meshes.forEach(mesh => {
      let material = mesh.material as StandardMaterial
      material.lightingEnvironment = lightingEnvironment
      material.baseColor = new Color(0.0, 1.0, 0.0)
      material.metallic = 0
      material.roughness = 0.5
    })
  }
}