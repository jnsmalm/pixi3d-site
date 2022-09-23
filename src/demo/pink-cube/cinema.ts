import { Container, Graphics, Renderer, Ticker } from "pixi.js";

export class Cinema extends Container {
  value = 0

  constructor(renderer: Renderer) {
    super()

    let top = this.addChild(new Graphics())
    top.beginFill(0x000000)
    top.drawRect(0, 0, 100, 100)
    top.endFill()

    let bottom = this.addChild(new Graphics())
    bottom.beginFill(0x000000)
    bottom.drawRect(0, 0, 100, 100)
    bottom.endFill()

    let ticker = new Ticker()
    ticker.add(() => {
      top.position.set(0, 0)
      top.width = renderer.screen.width
      top.height = renderer.screen.height * 0.15 * this.value

      bottom.position.set(0,
        renderer.screen.height - (renderer.screen.height * 0.15) * this.value)
      bottom.width = renderer.screen.width
      bottom.height = renderer.screen.height * 0.15
    })
    ticker.start()
  }
}