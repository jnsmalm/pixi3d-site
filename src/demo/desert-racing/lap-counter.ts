import { Container, Text } from "pixi.js";

export class LapCounter extends Container {
  private counterText: Text
  private lap = 1

  constructor(private maxLaps = 3) {
    super()

    this.zIndex = 1

    this.counterText = this.addChild(new Text("", {
      fontFamily: "contrailone",
      fontSize: 37,
      fill: 0xffffff,
      stroke: 0,
      strokeThickness: 4,
      padding: 20,
      letterSpacing: 3
    }))
    this.counterText.position.set(10, 10)
    this.visible = false
  }

  reset() {
    this.lap = 1
    this.counterText.text = this.lap + "/" + this.maxLaps
  }

  increase() {
    this.counterText.text = ++this.lap + "/" + this.maxLaps
  }
}