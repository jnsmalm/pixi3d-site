import { Color, Container3D, Mesh3D } from "pixi3d"
import { TileMaterial } from "./tile-material"

export class Floor extends Container3D {
  constructor(x = 0, y = 0, z = 0) {
    super()

    this.position.set(x, y, z)

    let tone = ((x % 2 === 0) ? (z % 2 === 1) : (z % 2 === 0)) ? 1.0 : 0.95

    let mesh = this.addChild(Mesh3D.createCube(new TileMaterial()))
    mesh.scale.set(0.5, 20, 0.5);
    (mesh.material as TileMaterial).color = new Color(0.1 * tone, 0.9 * tone, 0.3 * tone)
    mesh.position.set(0, - mesh.scale.y - 0.5, 0)
  }
}