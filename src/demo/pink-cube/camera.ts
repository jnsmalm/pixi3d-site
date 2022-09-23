import { Ticker } from "pixi.js"
import { Camera as Camera2, CameraOrbitControl } from "pixi3d"

export class Camera {
  drag = { x: 0.5, y: 0.01, z: 0.5 }
  private _track = { x: 0, y: 0, z: 0 }
  private control: CameraOrbitControl

  constructor(view: HTMLElement) {
    Camera2.main.orthographic = true
    Camera2.main.orthographicSize = 7

    this.control = new CameraOrbitControl(view)
    this.control.angles.set(25, -20)
    this.control.distance = 100
    this.control.allowControl = false

    const lerp = (a: number, b: number, t: number) => {
      return a + (b - a) * t
    }

    Ticker.shared.add(() => {
      this.control.target = {
        x: lerp(this.control.target.x, this._track.x, this.drag.x),
        y: lerp(this.control.target.y, this._track.y, this.drag.y),
        z: lerp(this.control.target.z, this._track.z, this.drag.z),
      }
    })
  }

  get zoom() {
    return Camera2.main.orthographicSize
  }

  set zoom(value) {
    Camera2.main.orthographicSize = value
  }

  get angles() {
    return this.control.angles
  }

  reset() {
    Camera2.main.orthographicSize = 7
    this.control.angles.set(25, -20)
    this.drag = { x: 0.5, y: 0.01, z: 0.5 }
  }

  track(position: { x: number, y: number, z: number }) {
    this._track = position
  }

  lookAt(position: { x: number, y: number, z: number }) {
    this._track = position
    this.control.target = position
  }
}