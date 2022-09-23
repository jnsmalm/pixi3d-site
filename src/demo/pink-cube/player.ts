import gsap from "gsap"
import { DEG_TO_RAD } from "pixi.js"
import { Color, Container3D, glTFAsset, LightingEnvironment, Mat4, Matrix4, Mesh3D, Model, StandardMaterial, Vec3 } from "pixi3d"
import type { Camera } from "./camera"

export class Player extends Container3D {
  private _isMoving = false
  private _mesh: Mesh3D
  private _model: Model

  constructor(private _camera: Camera, gltf: glTFAsset, lightingEnvironment: LightingEnvironment) {
    super()

    this._mesh = this.addChild(Mesh3D.createCube())
    this._mesh.scale.set(0.5)

    let material = this._mesh.material as StandardMaterial
    material.lightingEnvironment = lightingEnvironment
    material.metallic = 0
    material.roughness = 0.5
    material.baseColor = new Color(0.8, 0.2, 0.6)
    material.exposure = 3

    this._model = this.addChild(Model.from(gltf))
    this._model.scale.set(0)
    this._model.rotationQuaternion.setEulerAngles(0, 180, 0)
    this._model.meshes.forEach(mesh => {
      let material = mesh.material as StandardMaterial
      material.lightingEnvironment = lightingEnvironment
      material.metallic = 0
      material.roughness = 0.5
      material.baseColor = new Color(0.8, 0.2, 0.6)
      material.exposure = 3
    })
  }

  get isMoving() {
    return this._isMoving
  }

  get worldPosition() {
    return {
      x: this._mesh.worldTransform.position[0],
      y: this._mesh.worldTransform.position[1],
      z: this._mesh.worldTransform.position[2],
    }
  }

  reset() {
    this._model.scale.set(0)
    this._mesh.visible = true
    this._mesh.rotationQuaternion.set(0, 0, 0, 1)
    this._mesh.position.set(0, 0, 0)
  }

  start() {
    this._mesh.y = 2
    gsap.to(this._mesh, {
      delay: 0, duration: 0.5, y: 0, ease: "bounce.out"
    })
  }

  crash() {
    const target = { angle: 0 }
    gsap.to(target, {
      delay: 0, duration: 1.7, angle: 270, ease: "power2.out", onUpdate: () => {
        this._mesh.rotationQuaternion.setEulerAngles(0, 0, target.angle)
      }
    })
    gsap.to(this, {
      duration: 0.9, y: this.y + 2, ease: "power1.out"
    })
    gsap.to(this, {
      duration: 0.4, y: 0, ease: "power1.in", delay: 1, onComplete: () => {
        gsap.to(this._model.animations[0], {
          duration: 0.4, speed: 0.2, ease: "slow(0.7, 0.7)"
        })
        this._model.animations[0].speed = 1
        this._model.animations[0].play()
        this._model.animations[0].position = 1.65
        this._mesh.visible = false
        this._model.scale.set(0.5)
      }
    })
    gsap.to(this, {
      delay: 0.1, duration: 1.7, x: this.x - 2.6, ease: "power1.out"
    })
  }

  move(dir: { x: number, y?: number, z: number }) {
    this._roll(dir, 90 * DEG_TO_RAD, 0.30, false, true, true)
  }

  moveBlocked(dir: { x: number, y?: number, z: number }) {
    this._roll(dir, 10 * DEG_TO_RAD, 0.12, true, false, false)
  }

  moveJump(dir: { x: number, y?: number, z: number }, y: number, duration = 0.3) {
    this._roll(dir, 90 * DEG_TO_RAD, duration, false, true, true)
    gsap.to(this, { y, duration, ease: "back.out" })
  }

  moveFall(dir: { x: number, y?: number, z: number }, y: number) {
    this._roll(dir, 90 * DEG_TO_RAD, 0.30, false, true, true)
    gsap.to(this, { y, duration: 0.3, ease: "back.in" })
  }

  goal(dir: { x: number, y?: number, z: number }, y: number, complete: () => void) {
    this._roll(dir, 90 * DEG_TO_RAD, 0.30, false, true, true)
    gsap.to(this, {
      y, duration: 0.3, ease: "back.in", onComplete: () => {
        if (complete) {
          complete()
        }
      }
    })
  }

  _roll(dir: { x: number, y?: number, z: number }, angle: number, duration: number, yoyo: boolean, cameraTrack: boolean, completeMovement: boolean) {
    if (this._isMoving) {
      return
    }
    this._isMoving = true

    const target = { value: 0 }
    const transformMatrix = Mat4.copy(this._mesh.localTransform.array)
    const repeat = yoyo ? 1 : 0

    gsap.to(target, {
      duration, value: angle, yoyo, repeat, onUpdate: () => {
        let matrix = Mat4.create()
        Mat4.translate(matrix, Vec3.fromValues(-dir.x, -1, +dir.z), matrix)
        if (dir.x !== 0) {
          Mat4.rotateZ(matrix, target.value * dir.x, matrix)
        } else {
          Mat4.rotateX(matrix, target.value * dir.z, matrix)
        }
        Mat4.translate(matrix, Vec3.fromValues(dir.x, 1, -dir.z), matrix)
        Mat4.multiply(transformMatrix, matrix, matrix)
        this._mesh.transform.setFromMatrix(new Matrix4(matrix))
        if (cameraTrack) {
          this._camera.track(this.worldPosition)
        }
      }, onComplete: () => {
        if (completeMovement) {
          this.x -= dir.x
          this.z += dir.z
        }
        this._mesh.scale.set(0.5)
        this._mesh.rotationQuaternion.set(0, 0, 0, 1)
        this._mesh.position.set(0)
        this._mesh.transform.updateLocalTransform()
        this._isMoving = false
      }
    })
  }
}