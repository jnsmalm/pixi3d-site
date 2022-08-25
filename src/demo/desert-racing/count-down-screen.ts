import gsap from "gsap";
import { Container, Renderer, Text, Ticker } from "pixi.js";

export class CountDownScreen extends Container {
  private numberText: Text
  private positionContainer: Container

  constructor(private renderer: Renderer) {
    super()

    this.zIndex = 1

    this.positionContainer = this.addChild(new Container())

    this.numberText = this.positionContainer.addChild(new Text("", {
      fontFamily: "contrailone",
      fontSize: 100,
      fill: 0xffffff,
      dropShadow: true,
      dropShadowBlur: 15,
      dropShadowAlpha: 0.5,
      align: "center",
      stroke: 0,
      strokeThickness: 7,
      padding: 30
    }))
    this.numberText.anchor.set(0.5)

    let ticker = new Ticker()
    ticker.add(() => {
      let scale = this.renderer.screen.height / 700
      this.positionContainer.x = this.renderer.screen.width / 2
      this.positionContainer.y = this.renderer.screen.height / 2
      this.positionContainer.scale.set(scale)
    })
    ticker.start()
  }

  show(onComplete: () => void) {
    let number = 3
    let timeline = gsap.timeline({ repeat: 2 })
    timeline.eventCallback("onComplete", () => {
      onComplete()
      this.numberText.alpha = 0
    })
    timeline.call(() => {
      this.numberText.text = number.toString()
      this.numberText.scale.set(2)
      this.numberText.alpha = 1
    })
    timeline.to(this.numberText.scale, {
      x: 1, y: 1, duration: 1, delay: 0, ease: "power4.in"
    })
    timeline.call(() => {
      number--
    }).delay(1)
  }
}