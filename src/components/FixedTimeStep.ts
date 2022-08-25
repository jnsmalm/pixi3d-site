import { Ticker } from "pixi.js"

export class FixedTimeStep {
  ticker = new Ticker()
  targetElapsedTime = 1000 / 60
  updateHandlers: ((elapsedTime: number) => void)[] = []
  renderHandlers: ((elapsedTime: number) => void)[] = []
  maxUpdates = 20

  addUpdate(fn: (elapsedTime: number) => void) {
    this.updateHandlers.push(fn)
  }

  addRender(fn: (elapsedTime: number) => void) {
    this.renderHandlers.push(fn)
  }

  start() {
    let elapsedTime = 0
    this.ticker.add(() => {
      elapsedTime += this.ticker.elapsedMS
      let updates = 0
      while (elapsedTime >= this.targetElapsedTime) {
        for (let handler of this.updateHandlers) {
          handler(this.targetElapsedTime)
        }
        elapsedTime -= this.targetElapsedTime
        if (++updates >= this.maxUpdates) {
          elapsedTime = 0
          break
        }
      }
      for (let handler of this.renderHandlers) {
        handler(this.targetElapsedTime)
      }
    })
    this.ticker.start()
  }
}