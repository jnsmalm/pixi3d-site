import { Renderer, Sprite, Texture } from "pixi.js"
import { Section } from "./section"

export class Map {
  private _pixels: Uint8Array
  private _floor: { x: number, y: number, z: number }[] = []
  private _player = { x: 0, y: 0, z: 0 }
  private _buttons: { x: number, y: number, z: number, link: number, pressed: boolean }[] = []
  private _gates: { x: number, y: number, z: number, open: boolean, link: number, angle?: number, auto?: boolean }[] = []
  private _blocks: { x: number, y: number, z: number }[] = []
  private _goals: { x: number, y: number, z: number }[] = []
  private _starts: { x: number, y: number, z: number, level: number }[] = []
  private _scenes: { x: number, y: number, z: number, scene: string }[] = []
  private _height: (number | undefined)[][] = []

  constructor(renderer: Renderer, texture: Texture) {
    this._pixels = renderer.plugins.extract.pixels(Sprite.from(texture))

    for (let x = 0; x < texture.width; x++) {
      let column: (number | undefined)[] = []
      for (let y = 0; y < texture.height; y++) {
        column.push(undefined)
      }
      this._height.push(column)
    }

    for (let i = 0; i < this._pixels.length; i += 4) {
      let r = this._pixels[i + 0]
      let g = this._pixels[i + 1]
      let b = this._pixels[i + 2]
      let a = this._pixels[i + 3]

      if (a === 0) {
        continue
      }

      let x = (i / 4) % texture.width
      let z = ((i / 4) - x) / texture.width

      let tile = Map.getTileData(r, g, b)
      if (!tile) {
        continue
      }
      if (tile.type === "floor") {
        this._floor.push({ x, y: tile.y, z })
      }
      if (tile.type === "scene_crash") {
        this._floor.push({ x, y: tile.y, z })
        this._scenes.push({ x, y: tile.y, z, scene: "crash" })
      }
      if (tile.type === "start") {
        this._starts.push({ x, y: tile.y, z, level: b })
        this._floor.push({ x, y: tile.y, z })
      }
      if (tile.type === "button") {
        this._floor.push({ x, y: tile.y, z })
        this._buttons.push({ x, y: tile.y, z, link: b, pressed: false })
      }
      if (tile.type === "gate" || tile.type === "gate_90") {
        this._floor.push({ x, y: tile.y, z })
        this._gates.push({ x, y: tile.y, z, open: false, link: b, angle: tile.angle })
      }
      if (tile.type === "auto_gate" || tile.type === "auto_gate_90") {
        this._floor.push({ x, y: tile.y, z })
        this._gates.push({ x, y: tile.y, z, open: false, auto: true, link: b, angle: tile.angle })
      }
      if (tile.type === "block") {
        this._floor.push({ x, y: tile.y, z })
        this._blocks.push({ x, y: tile.y, z })
      }
      if (tile.type === "goal") {
        this._goals.push({ x, y: tile.y, z })
      }
      this._height[x][z] = tile.y
    }
    this._starts.sort((a, b) => a.level - b.level)
  }

  get levels() {
    return this._starts.length
  }

  createSection(index: number) {
    let start = this._starts[index]
    if (!start) {
      throw new Error(`Can load level ${index}, doesn't exist`)
    }
    let tiles: { x: number, z: number }[] = []
    let find = (x: number, z: number) => {
      if (tiles.some(p => p.x === x && p.z === z)) {
        return
      }
      if (this._height[x][z] !== undefined) {
        tiles.push({ x, z })
        find(x - 1, z - 0)
        find(x + 1, z - 0)
        find(x - 0, z - 1)
        find(x - 0, z + 1)
      }
    }
    find(start.x, start.z)
    return new Section(this, {
      floor: this._floor.filter(f =>
        tiles.some(t => t.x === f.x && t.z === f.z)),
      buttons: this._buttons.filter(f =>
        tiles.some(t => t.x === f.x && t.z === f.z)),
      gates: this._gates.filter(f =>
        tiles.some(t => t.x === f.x && t.z === f.z)),
      blocks: this._blocks.filter(f =>
        tiles.some(t => t.x === f.x && t.z === f.z)),
      goals: this._goals.filter(f =>
        tiles.some(t => t.x === f.x && t.z === f.z)),
      starts: this._starts.filter(f =>
        tiles.some(t => t.x === f.x && t.z === f.z)),
      scenes: this._scenes.filter(f =>
        tiles.some(t => t.x === f.x && t.z === f.z)),
    })
  }

  getHeight(x: number, z: number) {
    return this._height[x][z]
  }

  static getTileData(r: number, g: number, b: number) {
    if (r === 255) {
      return { type: "floor", y: g }
    }
    if (r === 230) {
      return { type: "scene_crash", y: g }
    }
    if (r === 200) {
      return { type: "start", y: g }
    }
    if (r === 150) {
      return { type: "button", y: g, connection: b }
    }
    if (r === 110) {
      return { type: "gate_90", y: g, connection: b, angle: 90 }
    }
    if (r === 100) {
      return { type: "gate", y: g, connection: b, angle: 0 }
    }
    if (r === 80) {
      return { type: "auto_gate_90", y: g, connection: b, angle: 90 }
    }
    if (r === 70) {
      return { type: "auto_gate", y: g, connection: b, angle: 0 }
    }
    if (r === 50) {
      return { type: "block", y: g }
    }
    if (r === 0) {
      return { type: "goal", y: g }
    }
  }
}