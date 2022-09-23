import gsap from "gsap"
import { Color, Container3D, Mesh3D } from "pixi3d"
import { TileMaterial } from "./tile-material"

export class Gate extends Container3D {
  private mesh: Mesh3D

  constructor(x = 0, y = 0, z = 0, angle = 0) {
    super()

    this.position.set(x, y, z)

    this.mesh = this.addChild(Mesh3D.createCube(new TileMaterial()))
    this.mesh.scale.set(0.5, 1, 0.1);
    (this.mesh.material as TileMaterial).color = Color.fromBytes(200, 255, 200)
    if (angle === 90) {
      this.mesh.rotationQuaternion.setEulerAngles(0, 90, 0)
    }
  }

  open() {
    gsap.to(this.mesh, { y: -1.49, duration: 1, ease: "power2.out", delay: 0.2 })
  }

  close() {
    gsap.to(this.mesh, { y: 0, duration: 1, ease: "power2.out", delay: 0.2 })
  }
}