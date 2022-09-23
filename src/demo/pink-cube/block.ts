import gsap from "gsap"
import { Color, Container3D, LightingEnvironment, Mesh3D, StandardMaterial } from "pixi3d"

export class Block extends Container3D {
  constructor(x = 0, y = 0, z = 0, lightingEnvironment: LightingEnvironment) {
    super()

    this.position.set(x, y, z)

    let mesh = this.addChild(Mesh3D.createCube())
    mesh.scale.set(0.5, 0.5, 0.5)
    mesh.position.set(0, 0, 0)

    let material = mesh.material as StandardMaterial
    material.lightingEnvironment = lightingEnvironment
    material.metallic = 0
    material.roughness = 0.2
    material.unlit = false
    material.baseColor = new Color(0.1, 0.1, 0.1)
  }

  move(dir: { x: number, y: number, z: number }) {
    gsap.to(this, {
      x: this.x + dir.x, z: this.z + dir.z, duration: 0.2, ease: "power1.out"
    })
  }

  moveFall(dir: { x: number, y: number, z: number }, y: number) {
    gsap.to(this, { x: this.x + dir.x, z: this.z + dir.z, duration: 0.2 })
    gsap.to(this, { y, duration: 0.3, delay: 0, ease: "back.in" })
  }
}