import { Container3D, Mesh3D, ObservablePoint3D, Quat, Vec3 } from "pixi3d";
import { BezierCurve } from "./bezier-curve";
import { TrackGeometry } from "./track-geometry";
import { TrackMaterial } from "./track-material";

export class TrackBezierCurve extends BezierCurve {
  slide = 0
}

export class Track extends Container3D {
  private parts: TrackBezierCurve[] = []
  private lastCurve?: TrackBezierCurve

  constructor() {
    super()
  }

  buildMesh() {
    let mesh = this.addChild(new Mesh3D(
      TrackGeometry.create(this, 1.5), new TrackMaterial(this)))
    mesh.material!.state.depthTest = false
    mesh.renderSortOrder = 1
    mesh.disableRenderPass("material")
    mesh.enableRenderPass("ground")
  }

  get numberOfParts() {
    return this.parts.length
  }

  get totalDistance() {
    let sum = 0
    for (let p of this.parts) {
      sum += p.totalDistance
    }
    return sum
  }

  getPoint(t: number) {
    let curve = this.parts[Math.floor(t)] || this.parts[this.parts.length - 1]
    return curve.getPoint(t % 1)
  }

  getPercentOfCurve(distance: number) {
    while (distance > this.totalDistance) {
      distance -= this.totalDistance
    }
    let data: { curveStartsAtDistance: number } = { curveStartsAtDistance: 0 }
    let curve = this.getCurveAtDistance(distance, data)
    let distanceInCurve = distance - data.curveStartsAtDistance
    return distanceInCurve / curve.totalDistance
  }

  getNextCurveAtDistance(distance: number) {
    let curve = this.getCurveAtDistance(distance, { curveStartsAtDistance: 0 })
    let index = this.parts.indexOf(curve)
    if (index === this.parts.length - 1) {
      return this.parts[0]
    }
    return this.parts[index + 1]
  }

  getCurveAtDistance(distance: number, out: { curveStartsAtDistance: number }) {
    out.curveStartsAtDistance = 0
    if (distance === 0) {
      return this.parts[0]
    }
    while (distance > this.totalDistance) {
      distance -= this.totalDistance
    }
    let totalTrackDistance = 0
    for (let c of this.parts) {
      totalTrackDistance += c.totalDistance
      if (distance <= totalTrackDistance) {
        return c
      }
      out.curveStartsAtDistance += c.totalDistance
    }
    throw new Error("Something went wrong")
  }

  getPositionAtDistance(distance: number, offset = new Float32Array([0, 0, 0])) {
    while (distance > this.totalDistance) {
      distance -= this.totalDistance
    }
    let data: { curveStartsAtDistance: number } = { curveStartsAtDistance: 0 }
    let curve = this.getCurveAtDistance(distance, data)
    let distanceInCurve = distance - data.curveStartsAtDistance
    let position = curve.samplePositionAtDistance(distanceInCurve, offset)
    return position
  }

  addStraight(degrees = 0, length = 12) {
    let rotation = Quat.fromEuler(0, degrees, 0)
    let translation = Vec3.fromValues(0, 0, -length)

    let points = [
      { x: 0, y: 0, z: length },
      { x: 0, y: 0, z: (length / 3) * 2 },
      { x: 0, y: 0, z: (length / 3) * 1 },
      { x: 0, y: 0, z: 0 },
    ]

    let controlPoints = points.map(p => {
      let point = new ObservablePoint3D(() => { }, undefined, p.x, p.y, p.z)
      point.array = Vec3.transformQuat(point.array, rotation)
      return point
    })
    let curve = (this.lastCurve || this).addChild(new TrackBezierCurve(controlPoints))

    curve.position.array = Vec3.transformQuat(translation, rotation)

    this.parts.push(curve)
    this.lastCurve = curve
    return curve
  }

  addCurve90(degrees = 0, scale = { x: 1, z: 1 }) {
    let rotation = Quat.fromEuler(0, degrees, 0)
    let scaling = Vec3.fromValues(scale.x, 1, scale.z)
    let translation = Vec3.fromValues(-5 * scale.x, 0, -5 * scale.z)

    let points = [
      { x: 5, y: 0, z: 5 },
      { x: 5, y: 0, z: 1 },
      { x: 2, y: 0, z: 0 },
      { x: 0, y: 0, z: 0 },
    ]

    let controlPoints = points.map(p => {
      let point = new ObservablePoint3D(() => { }, undefined, p.x, p.y, p.z)
      point.array = Vec3.multiply(point.array, scaling)
      return point
    })
    let curve = (this.lastCurve || this).addChild(new TrackBezierCurve(controlPoints))

    curve.rotationQuaternion.array = rotation
    curve.position.array = Vec3.transformQuat(translation, rotation)

    curve.slide = 1
    this.parts.push(curve)
    this.lastCurve = curve
    return curve
  }

  addCurve180(degrees = 0, scale = { x: 1, z: 1 }) {
    let rotation = Quat.fromEuler(0, degrees, 0)
    let scaling = Vec3.fromValues(scale.x, 1, scale.z)
    let translation = Vec3.fromValues(-5 * scale.x, 0, 0)

    let points = [
      { x: 5, y: 0, z: 0 },
      { x: 5, y: 0, z: -5 },
      { x: 0, y: 0, z: -5 },
      { x: 0, y: 0, z: 0 },
    ]

    let controlPoints = points.map(p => {
      let point = new ObservablePoint3D(() => { }, undefined, p.x, p.y, p.z)
      point.array = Vec3.multiply(point.array, scaling)
      return point
    })
    let curve = (this.lastCurve || this).addChild(new TrackBezierCurve(controlPoints))

    curve.rotationQuaternion.array = rotation
    curve.position.array = Vec3.transformQuat(translation, rotation)

    curve.slide = 1
    this.parts.push(curve)
    this.lastCurve = curve
    return curve
  }
}