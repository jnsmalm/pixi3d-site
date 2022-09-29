import gsap from "gsap";
import { Container, Graphics, Renderer, Text, Ticker } from "pixi.js";

export class InfoScreen extends Container {
  private overlay: Graphics
  private infoTextContainer: Container
  private infoText: Text

  constructor(private renderer: Renderer, private onStart: () => void) {
    super()

    this.zIndex = 1

    this.overlay = this.addChild(new Graphics())
    this.overlay.beginFill(0x000000)
    this.overlay.drawRect(0, 0, 100, 100)
    this.overlay.endFill()
    this.overlay.alpha = 0
    this.overlay.buttonMode = true
    this.overlay.on("pointerdown", () => {
      this.overlay.interactive = false
      this.onStart()
    })

    this.infoTextContainer = this.addChild(new Container())

    this.infoText = this.infoTextContainer.addChild(new Text(
      "PRESS ANYWHERE OR ANY KEY TO ACCELERATE. STEERING IS AUTOMATIC.",
      {
        fontFamily: "contrailone",
        fontSize: 40,
        fill: 0xffffff,
        dropShadow: true,
        dropShadowBlur: 15,
        dropShadowAlpha: 0.5,
        align: "center",
        stroke: 0,
        strokeThickness: 4,
        padding: 30,
        wordWrap: true,
        wordWrapWidth: 700
      }))
    this.infoText.anchor.set(0.5, 0)
    this.infoText.alpha = 0

    let ticker = new Ticker()
    ticker.add(() => {
      this.overlay.width = this.renderer.screen.width
      this.overlay.height = this.renderer.screen.height
      this.infoTextContainer.position.set(
        this.renderer.screen.width * 0.5, this.renderer.screen.height * 0.12)

      let aspect = this.renderer.screen.width / this.renderer.screen.height
      if (aspect > 1) {
        this.infoTextContainer.scale.set(this.renderer.screen.width / 1200)
      } else {
        this.infoTextContainer.scale.set(this.renderer.screen.height / 1350)
      }
    })
    ticker.start()
  }

  show() {
    this.overlay.alpha = 0.5
    this.infoText.alpha = 0
    gsap.fromTo(this.infoText, { y: -50 }, { duration: 0.2, y: 0, alpha: 1, delay: 1, ease: "back.out" })
    setTimeout(() => {
      this.overlay.interactive = true
    }, 1500)
  }

  hide() {
    gsap.to(this.overlay, { duration: 0.5, alpha: 0 })
    gsap.to(this.infoText, { duration: 0.2, y: - 50, alpha: 0, ease: "back.in" })
  }
}