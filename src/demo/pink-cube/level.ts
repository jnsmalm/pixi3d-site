import gsap from "gsap"
import type { Howl } from "howler"
import { LoaderResource, Ticker } from "pixi.js"
import { Container3D, LightingEnvironment, Camera as Camera2 } from "pixi3d"
import { Animations } from "./animations"
import { Block } from "./block"
import { Button } from "./button"
import { Camera } from "./camera"
import { Floor } from "./floor"
import { Gate } from "./gate"
import { Goal } from "./goal"
import type { Map } from "./map"
import { Player } from "./player"
import type { Section } from "./section"

export class Level extends Container3D {
  private _camera: Camera
  private _stage: Container3D
  private _player: Player
  private _allowControl = true
  private _section?: Section
  private _buttons: { x: number, y: number, z: number, press: () => void, release: () => void }[] = []
  private _gates: { x: number, y: number, z: number, open: () => void, close: () => void }[] = []
  private _blocks: { x: number, y: number, z: number, move(dir: { x: number, y: number, z: number }): void, moveFall(dir: { x: number, y: number, z: number }, y: number): void }[] = []
  private _goals: { x: number, y: number, z: number }[] = []

  onScene?: () => void
  onGoal?: () => void
  onReset?: () => void

  constructor(private _resources: { [key: string]: LoaderResource }, view: HTMLElement, private _sounds: Howl, private _lightingEnvironment: LightingEnvironment) {
    super()

    this._camera = new Camera(view)
    this._stage = this.addChild(new Container3D())
    this._player = this.addChild(
      new Player(this._camera, this._resources["/models/crash.glb"].gltf, this._lightingEnvironment))
  }

  loadSection(map: Map, index: number) {
    this._section = map.createSection(index)

    this._player.position.set(this._section.player.x, this._section.player.y, this._section.player.z)
    this._player.reset()
    this._player.start()

    this._camera.lookAt({
      x: this._section.player.x, y: 0, z: this._section.player.z
    })
    this._camera.reset()

    this._allowControl = true
    this._stage.removeChildren()

    this._section.buttons.forEach(p => {
      this._buttons.push(this._stage.addChild(new Button(p.x, p.y, p.z)))
    })
    this._section.gates.forEach(p => {
      this._gates.push(this._stage.addChild(new Gate(p.x, p.y, p.z, p.angle)))
    })
    this._section.floor.forEach(p => {
      this._stage.addChild(new Floor(p.x, p.y, p.z))
    })
    this._section.goals.forEach(p => {
      this._goals.push(this._stage.addChild(
        new Goal(p.x, p.y, p.z, this._resources["/models/goal.glb"].gltf, this._lightingEnvironment)))
    })
    this._section.blocks.forEach(p => {
      this._blocks.push(this._stage.addChild(
        new Block(p.x, p.y, p.z, this._lightingEnvironment)))
    })
  }

  _pressButton(x: number, z: number) {
    let button = this._buttons.find(b => b.x === x && b.z === z)
    if (!button) {
      throw new Error("No button at " + x + "," + z)
    }
    button.press()
  }

  _releaseButton(x: number, z: number) {
    let button = this._buttons.find(b => b.x === x && b.z === z)
    if (!button) {
      throw new Error("No button at " + x + "," + z)
    }
    button.release()
  }

  _openGate(x: number, z: number) {
    let gate = this._gates.find(b => b.x === x && b.z === z)
    if (!gate) {
      throw new Error("No gate at " + x + "," + z)
    }
    gate.open()
  }

  _closeGate(x: number, z: number) {
    let gate = this._gates.find(b => b.x === x && b.z === z)
    if (!gate) {
      throw new Error("No gate at " + x + "," + z)
    }
    gate.close()
  }

  _moveBlock(x: number, z: number, dir: { x: number, y: number, z: number }) {
    let block = this._blocks.find(b => b.x === x && b.z === z)
    if (!block) {
      throw new Error("No block at " + x + "," + z)
    }
    block.move(dir)
  }

  _moveFallBlock(x: number, z: number, dir: { x: number, y: number, z: number }, y: number) {
    let block = this._blocks.find(b => b.x === x && b.z === z)
    if (!block) {
      throw new Error("No block at " + x + "," + z)
    }
    block.moveFall(dir, y)
  }

  _movePlayer(vector: ArrayLike<number>) {
    if (this._player.isMoving || !this._allowControl) {
      return
    }
    this._sounds.volume(0.3, this._sounds.play("tap"))
    let dir = { x: 0, y: 0, z: 0 }
    if (Math.abs(vector[0]) >= Math.abs(vector[2])) {
      dir.x = vector[0] > 0 ? 1 : -1
    } else {
      dir.z = vector[2] > 0 ? 1 : -1
    }
    let animations = this._section?.movePlayer(dir)
    if (animations) {
      this._playAnimations(animations)
    }
  }

  _crash() {
    this._allowControl = false

    if (this.onScene) {
      this.onScene()
    }

    const trackPlayer = () => {
      this._camera.track(this._player.worldPosition)
    }
    Ticker.shared.add(trackPlayer)

    setTimeout(() => {
      gsap.to(this._camera, {
        duration: 7.5, zoom: 4, ease: "power1.inOut"
      })
    }, 0)

    setTimeout(() => {
      this._player.moveJump({ x: 1, z: 0 }, this._player.y + 1, 0.7)
    }, 600)

    setTimeout(() => {
      gsap.to(this._camera.angles, {
        duration: 5.5, y: 45, ease: "power1.inOut"
      })
    }, 1600)

    setTimeout(() => {
      this._player.moveJump({ x: 1, z: 0 }, this._player.y + 1, 1.1)
    }, 2500)

    setTimeout(() => {
      gsap.to(this._camera.drag, { duration: 1, y: 0.2 })
      this._player.crash()
    }, 5500)

    setTimeout(() => {
      gsap.to(this._camera.drag, { duration: 1, y: 0.2 })
      this._player.crash()
    }, 5500)

    setTimeout(() => {
      this._sounds.play("sad")
    }, 6900)

    setTimeout(() => {
      Ticker.shared.remove(trackPlayer);
      if (this.onReset) {
        this.onReset()
      }
    }, 15000)
  }

  _playAnimations(animations: { animation: string, y?: number, position?: { x: number, z: number }, direction?: { x: number, y: number, z: number } }[]) {
    for (let anim of animations) {
      switch (anim.animation) {
        case Animations.PLAYER_MOVE: {
          if (anim.direction) {
            this._player.move({ x: -anim.direction.x, z: anim.direction.z })
          }
          break
        }
        case Animations.PLAYER_MOVE_BLOCKED: {
          if (anim.direction) {
            this._player.moveBlocked({ x: -anim.direction.x, z: anim.direction.z })
          }
          break
        }
        case Animations.PLAYER_MOVE_JUMP: {
          if (anim.direction) {
            this._player.moveJump({ x: -anim.direction.x, z: anim.direction.z }, anim.y || 0)
          }
          break
        }
        case Animations.PLAYER_MOVE_FALL: {
          if (anim.direction) {
            this._player.moveFall({ x: -anim.direction.x, z: anim.direction.z }, anim.y || 0)
          }
          break
        }
        case Animations.PLAYER_GOAL: {
          this._player.goal({
            x: -(anim.direction?.x || 0), z: anim.direction?.z || 0
          }, anim.y || 0, () => {
            if (this.onGoal) {
              this.onGoal()
              this._sounds.volume(0.3, this._sounds.play("win"))
            }
          })
          break
        }
        case Animations.BUTTON_PRESS: {
          this._pressButton(anim.position?.x || 0, anim.position?.z || 0)
          break
        }
        case Animations.BUTTON_RELEASE: {
          this._releaseButton(anim.position?.x || 0, anim.position?.z || 0)
          break
        }
        case Animations.GATE_OPEN: {
          this._openGate(anim.position?.x || 0, anim.position?.z || 0)
          break
        }
        case Animations.GATE_CLOSE: {
          this._closeGate(anim.position?.x || 0, anim.position?.z || 0)
          break
        }
        case Animations.BLOCK_MOVE: {
          this._moveBlock(anim.position?.x || 0, anim.position?.z || 0, anim.direction || { x: 0, y: 0, z: 0 })
          break
        }
        case Animations.BLOCK_MOVE_FALL: {
          this._moveFallBlock(anim.position?.x || 0, anim.position?.z || 0, anim.direction || { x: 0, y: 0, z: 0 }, anim.y || 0)
          break
        }
        case Animations.SCENE_CRASH: {
          this._crash()
          break
        }
      }
    }
  }

  movePlayerLeft() {
    this._movePlayer(Camera2.main.worldTransform.left)
  }

  movePlayerFoward() {
    this._movePlayer(Camera2.main.worldTransform.forward)
  }

  movePlayerBackward() {
    this._movePlayer(Camera2.main.worldTransform.backward)
  }

  movePlayerRight() {
    this._movePlayer(Camera2.main.worldTransform.right)
  }
}