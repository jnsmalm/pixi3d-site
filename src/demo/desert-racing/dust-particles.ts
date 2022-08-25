import { Texture } from "pixi.js";
import gsap from "gsap";
import { Container3D, Sprite3D, SpriteBillboardType, Vec3 } from "pixi3d";

export class DustParticleSystem extends Container3D {
  private particlePool: DustParticle[] = []

  constructor(public texture?: Texture) {
    super()
  }

  spawn(particleCount: number, position: Float32Array, direction: Float32Array, scale: number, spawnRadius: number, colors: number[]) {
    for (let i = 0; i < particleCount; i++) {
      let x = position[0] - spawnRadius + Math.random() * (spawnRadius * 2)
      let y = position[1] - spawnRadius + Math.random() * (spawnRadius * 2)
      let z = position[2] - spawnRadius + Math.random() * (spawnRadius * 2)
      let particle = this.getParticle()
      particle.spawn(x, y, z, direction, scale, colors)
    }
  }

  addParticleToPool(particle: DustParticle) {
    this.particlePool.push(particle)
  }

  getParticle() {
    let particle: DustParticle | undefined
    if (this.particlePool.length === 0) {
      particle = this.addChild(new DustParticle(this.texture || Texture.WHITE, this))
    } else {
      particle = this.particlePool.splice(0, 1)[0]
      particle.visible = true
    }
    return particle
  }
}

class DustParticle extends Container3D {
  private sprite: Sprite3D

  constructor(texture: Texture, private particleSystem: DustParticleSystem) {
    super()
    this.sprite = this.addChild(new Sprite3D(texture))
    this.sprite.billboardType = SpriteBillboardType.spherical
  }

  spawn(x: number, y: number, z: number, direction: Float32Array, scale: number, colors: number[]) {
    this.position.set(x, y, z)
    this.alpha = 0
    this.scale.set(scale)

    this.sprite.tint = Math.random() < 0.5 ? colors[0] : colors[1]

    let endPosition = Vec3.add(
      Vec3.set(x, y, z),
      Vec3.scale(
        Vec3.normalize(direction), 2))
    let randomScale = scale + scale * 0.7

    gsap.to(this, { alpha: 0.15 + Math.random() * 0.1, duration: 0.1 })
    gsap.to(this, {
      x: endPosition[0], y: 0, z: endPosition[2],
      duration: 1 + Math.random() * 3, ease: "power2.out"
    })
    gsap.to(this.scale, { x: randomScale, y: randomScale, duration: 0.9 })
    gsap.to(this, {
      alpha: 0, duration: 4, delay: 0.3, onComplete: () => {
        this.particleSystem.addParticleToPool(this)
        this.visible = false
      }
    })
  }
}