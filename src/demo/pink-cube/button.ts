import gsap from "gsap"
import { Color, Container3D, Mesh3D } from "pixi3d"
import { TileMaterial } from "./tile-material"

export class Button extends Container3D {
  private mesh: Mesh3D

  constructor(x = 0, y = 0, z = 0) {
    super()

    this.position.set(x, y, z)

    const tone = ((x % 2 === 0) ? (z % 2 === 1) : (z % 2 === 0)) ? 1.0 : 0.95

    this.mesh = this.addChild(Mesh3D.createCube(new TileMaterial()))
    this.mesh.scale.set(0.5, 0.5, 0.5);
    (this.mesh.material as TileMaterial).color = new Color(0.2 * tone, 1.0 * tone, 0.4 * tone)
    this.mesh.position.set(0, -0.90, 0)
  }

  press() {
    gsap.to(this.mesh, { y: -1.0, duration: 0.2 })
  }

  release() {
    gsap.to(this.mesh, { y: -0.93, duration: 0.2 })
  }
}