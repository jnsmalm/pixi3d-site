import { Mat4, Vec3 } from "pixi3d"

export class OrientedPoint {
  position: Float32Array
  forward: Float32Array
  rotation: Float32Array

  constructor(position: Float32Array, forward: Float32Array) {
    this.position = position
    this.forward = forward
    this.rotation = Mat4.getRotation(
      Mat4.targetTo(
        Vec3.create(), forward, Vec3.fromValues(0, 1, 0)))
  }

  lerpTo(otherPoint: OrientedPoint, t: number) {
    let position = Vec3.lerp(this.position, otherPoint.position, t)
    let forward = Vec3.normalize(
      Vec3.lerp(this.forward, otherPoint.forward, t))
    return new OrientedPoint(position, forward)
  }

  localToWorld(localPosition: Float32Array) {
    return Vec3.add(this.position, 
      Vec3.transformQuat(localPosition, this.rotation))
  }
}