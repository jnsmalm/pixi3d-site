import { Application } from "pixi.js";
import { Mesh3D } from "pixi3d";

export class Cube {
  private _app: Application

  constructor(view: HTMLCanvasElement, resizeTo?: HTMLElement) {
    this._app = new Application({
      view,
      backgroundAlpha: 0,
      autoDensity: true,
      resolution: Math.max(2, window.devicePixelRatio),
      resizeTo: resizeTo || window
    })
  }

  async load() {
    return new Promise<void>(resolve => {
      resolve()
    })
  }

  show() {
    this._app.stage.addChild(Mesh3D.createCube());
  }
}