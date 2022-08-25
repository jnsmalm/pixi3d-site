import { Car } from "./car";
import type { Track } from "./track";

export class CpuCar extends Car {
  playerCarTotalDistance = 0

  easeIntoCurves(track: Track) {
    let currentCurve = track.getCurveAtDistance(this.lapDistance, { curveStartsAtDistance: 0 })
    if (currentCurve.slide === 0 && !this.accelerate) {
      this.accelerate = true
    } else if (currentCurve.slide > 0) {
      let percentOfCurve = track.getPercentOfCurve(this.lapDistance)
      if (percentOfCurve > 0.75) {
        this.accelerate = true
      }
    }
    let nextCurve = track.getNextCurveAtDistance(this.lapDistance)
    if (nextCurve.slide > 0) {
      let percentOfCurve = track.getPercentOfCurve(this.lapDistance)
      if (percentOfCurve > 0.9) {
        this.accelerate = false
      }
    }
  }

  update(track: Track, elapsedTime: number) {
    this.minSpeed = Car.MAX_SPEED * 0.5
    if (this.totalDistance - this.playerCarTotalDistance > 10) {
      this.accelerate = true
    } else {
      this.easeIntoCurves(track)
      this.minSpeed = Car.MAX_SPEED * 0.85
      this.maxSpeed = Car.MAX_SPEED * 0.90
    }
    super.update(track, elapsedTime)
  }
}