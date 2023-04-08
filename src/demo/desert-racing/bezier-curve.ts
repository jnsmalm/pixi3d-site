import { Container3D, Point3D, Vec3 } from "pixi3d"
import { OrientedPoint } from "./oriented-point"

export interface BezierCurveSample {
  distance: number,
  position: Float32Array
  point: OrientedPoint
}

export class BezierCurve extends Container3D {
  private controlPoints: Container3D[] = []
  private _totalDistance = 0
  private samples: BezierCurveSample[] = []

  constructor(localControlPoints: Point3D[]) {
    super()

    this.controlPoints = localControlPoints.map(p => {
      let container = this.addChild(new Container3D())
      container.position = p
      return container
    })
  }

  get totalDistance() {
    return this._totalDistance
  }

  updateTransform() {
    super.updateTransform()
    if (this.samples.length === 0) {
      const numberOfSamples = 30
      this._totalDistance = this.calculateTotalDistance(numberOfSamples)
      this.samples = this.createSamples(numberOfSamples)
    }
  }

  calculateTotalDistance(numberOfSamples: number) {
    let totalDistance = 0
    let previousPosition = this.controlPoints[0].worldTransform.position.array
    for (let i = 1; i < numberOfSamples; i++) {
      let t = i / (numberOfSamples - 1)
      let point = this.getPoint(t)
      let distance = Vec3.magnitude(Vec3.subtract(point.position, previousPosition))
      totalDistance += distance
      previousPosition = point.position
    }
    return totalDistance
  }

  createSamples(numberOfSamples: number) {
    let point = this.getPoint(0)
    let samples: BezierCurveSample[] = [{
      distance: 0,
      position: this.controlPoints[0].worldTransform.position.array,
      point: point
    }]
    let totalDistance = 0
    let previousPosition = this.controlPoints[0].worldTransform.position.array
    for (let i = 1; i < numberOfSamples; i++) {
      let t = i / (numberOfSamples - 1)
      let point = this.getPoint(t)
      let distance = Vec3.magnitude(Vec3.subtract(point.position, previousPosition))
      totalDistance += distance
      samples[i] = {
        distance: totalDistance,
        point: point,
        position: point.position,
      }
      previousPosition = point.position
    }
    return samples
  }

  samplePointAtDistance(distance: number) {
    if (distance === 0) {
      return this.samples[0].point
    }
    if (distance === this._totalDistance) {
      return this.samples[this.samples.length - 1].point
    }
    let a: BezierCurveSample | undefined = undefined
    let b: BezierCurveSample | undefined = undefined
    for (let i = 0; i < this.samples.length; i++) {
      if (distance >= this.samples[i].distance) {
        a = this.samples[i]
      }
      if (distance < this.samples[i].distance) {
        b = this.samples[i]
        break
      }
    }
    if (!b) {
      return a!.point
    }
    distance -= a!.distance
    return a!.point.lerpTo(b.point, distance / (b.distance - a!.distance))
  }

  samplePositionAtDistance(distance: number, offset: Float32Array) {
    let point = this.samplePointAtDistance(distance)
    let position = point.position
    if (offset) {
      return point.localToWorld(offset)
    }
    return position
  }

  getPoint(t: number) {
    let p0 = this.controlPoints[0].worldTransform.position.array
    let p1 = this.controlPoints[1].worldTransform.position.array
    let p2 = this.controlPoints[2].worldTransform.position.array
    let p3 = this.controlPoints[3].worldTransform.position.array

    let a = Vec3.lerp(p0, p1, t)
    let b = Vec3.lerp(p1, p2, t)
    let c = Vec3.lerp(p2, p3, t)
    let d = Vec3.lerp(a, b, t)
    let e = Vec3.lerp(b, c, t)

    let tangent = Vec3.normalize(Vec3.subtract(e, d))
    return new OrientedPoint(Vec3.lerp(d, e, t), tangent)
  }
}