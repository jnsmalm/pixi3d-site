import gsap from "gsap";
import type { Howl } from "howler";
import { Texture } from "pixi.js";
import { Camera, Container3D, glTFAsset, Model, Point3D, StandardMaterial, Vec3 } from "pixi3d";
import { AudioPlayer } from "../../components/AudioPlayer";
import { Random } from "../../components/Random";
import type { Trail, TrailRenderer } from "../../components/TrailRenderer";
import { Config } from "./config";
import type { DustParticleSystem } from "./dust-particles";
import type { Track, TrackBezierCurve } from "./track";

export class Car extends Container3D {
  private model?: Model
  private modelContainer: Container3D
  private speed = 0
  private _laps = 0
  private currentDirection = Vec3.create()
  private currentCurve?: TrackBezierCurve
  private currentTrail1?: Trail
  private currentTrail2?: Trail
  private lastPositionWheel1?: Float32Array
  private lastPositionWheel2?: Float32Array
  private _accelerate = false
  private playingSkidSound?: string
  protected audioPlayer?: AudioPlayer

  static MIN_SPEED = 0.002
  static MAX_SPEED = 0.012

  maxSpeed = Car.MAX_SPEED
  minSpeed = Car.MIN_SPEED
  speedPercent = 0
  lapDistance = 0
  totalDistance = 0

  constructor(private trailRenderer: TrailRenderer, public offset = 0.75, private particleSystem: DustParticleSystem, private onLapComplete: (laps: number) => void, howl?: Howl) {
    super()
    this.modelContainer = this.addChild(new Container3D())
    this.scale.set(0.42)

    if (howl) {
      this.audioPlayer = new AudioPlayer(howl)
      this.audioPlayer.play("car_skid_loop_3", { loop: true, volume: 0, muteOnBlur: true })
      this.audioPlayer.play("car_skid_loop_4", { loop: true, volume: 0, muteOnBlur: true })
      this.audioPlayer.play("car_skid_loop_5", { loop: true, volume: 0, muteOnBlur: true })
      this.audioPlayer.play("engine_loop", { loop: true, volume: 0.5, muteOnBlur: true })
      this.audioPlayer.masterVolume = 0
    }
  }

  get accelerate() {
    return this._accelerate
  }

  set accelerate(value: boolean) {
    this._accelerate = value
  }

  createModel(gltf: glTFAsset) {
    this.model = this.modelContainer.addChild(Model.from(gltf))
    this.model.meshes.forEach(mesh => {
      (mesh.material as StandardMaterial).baseColorTexture = Texture.from("/textures/desert-racing-cars.png")
    })
    this.model.meshes.forEach(mesh => {
      mesh.renderSortOrder = 4
      mesh.enableRenderPass("planar-shadows")
    })
  }

  get laps() {
    return this._laps
  }

  resetLaps() {
    this._laps = 0
  }

  setPositionAtTrackDistance(track: Track) {
    let position = track.getPositionAtDistance(
      this.totalDistance, new Float32Array([this.offset, 0, 0]))
    let curve = track.getCurveAtDistance(this.totalDistance, { curveStartsAtDistance: 0 })
    let direction = Vec3.normalize(
      Vec3.subtract(this.position.array, position))

    if (this.currentCurve !== curve) {
      this.currentCurve = curve
      this.currentDirection = Vec3.copy(direction, this.currentDirection)
    }
    this.position.array = position
  }

  getPerfectPositionDiff(track: Track) {
    let perfectPosition = track.getPositionAtDistance(this.totalDistance)
    return Vec3.magnitude(Vec3.subtract(
      this.modelContainer.worldTransform.position.array, perfectPosition))
  }

  setRotationAtTrackDistance(track: Track) {
    let distance = this.totalDistance + 2 * Config.skid
    let position = track.getPositionAtDistance(distance, new Float32Array([this.offset, 0, 0]))
    this.modelContainer.transform.lookAt(new Point3D(
      position[0], position[1], position[2]))
  }

  spawnDustParticles(slide: number, position1: Float32Array, position2: Float32Array) {
    let colors = [0x777777, 0x999999]
    if (!this.lastPositionWheel1 || !this.lastPositionWheel2 || !this.currentDirection) {
      return
    }
    let distance1 = Vec3.distance(this.lastPositionWheel1, position1)
    let distance2 = Vec3.distance(this.lastPositionWheel2, position2)

    let particleCount1 = Math.max(1, Math.ceil(distance1 / 0.1))
    for (let i = 0; i < particleCount1; i++) {
      let position = Vec3.lerp(this.lastPositionWheel1, position1, i / particleCount1)
      let scale = (slide * this.speedPercent * 0.2) * 0.7
      let spawnRadius = slide * 0.2
      this.particleSystem.spawn(1, position,
        Vec3.negate(this.currentDirection), scale, spawnRadius, colors)
    }

    let particleCount2 = Math.max(1, Math.ceil(distance2 / 0.1))
    for (let i = 0; i < particleCount2; i++) {
      let position = Vec3.lerp(this.lastPositionWheel2, position2, i / particleCount1)
      let scale = (slide * this.speedPercent * 0.2) * 0.7
      let spawnRadius = slide * 0.2
      this.particleSystem.spawn(1, position,
        Vec3.negate(this.currentDirection), scale, spawnRadius, colors)
    }
  }

  update(track: Track, elapsedTime: number) {
    this.totalDistance += this.speed * elapsedTime
    this.lapDistance += this.speed * elapsedTime
    if (this.lapDistance > track.totalDistance) {
      this._laps++
      this.lapDistance -= track.totalDistance
      this.onLapComplete(this._laps)
    }
    this.setPositionAtTrackDistance(track)
    this.setRotationAtTrackDistance(track)
    this.setSpeed(track)
    let slideValue = this.setSlideOffset(track)

    this.updateTransform()

    let behindWheel1 = Vec3.add(this.modelContainer.worldTransform.position.array,
      Vec3.scale(this.modelContainer.worldTransform.backward.array, 0.2))
    Vec3.add(behindWheel1,
      Vec3.scale(this.modelContainer.worldTransform.left.array, 0.2),
      behindWheel1)

    let behindWheel2 = Vec3.add(this.modelContainer.worldTransform.position.array,
      Vec3.scale(this.modelContainer.worldTransform.backward.array, 0.2))
    Vec3.add(behindWheel2,
      Vec3.scale(this.modelContainer.worldTransform.right.array, 0.2),
      behindWheel2)

    if (Math.abs(slideValue) > 0.5) {
      this.spawnDustParticles(slideValue, behindWheel1, behindWheel2)
    }

    this.lastPositionWheel1 = Vec3.copy(behindWheel1)
    this.lastPositionWheel2 = Vec3.copy(behindWheel2)

    // this.audioPlayer?.setVolume("car_skid_loop_1", Math.abs(slideValue) * 0.3)
    // this.audioPlayer?.setVolume("car_skid_loop_2", Math.abs(slideValue) * 0.3)

    if (this.playingSkidSound === undefined) {
      this.playingSkidSound = [
        "car_skid_loop_3",
        "car_skid_loop_4",
        "car_skid_loop_5"
      ][Random.integer(0, 2)]
    }
    if (this.playingSkidSound) {
      this.audioPlayer?.play(this.playingSkidSound, { loop: true, volume: 0, muteOnBlur: true })
      this.audioPlayer?.setVolume(this.playingSkidSound, Math.abs(slideValue) * 1)
    }
    if (Math.abs(slideValue) < 0.1) {
      this.playingSkidSound = undefined
    }

    if (Math.abs(slideValue) > 0.3) {
      if (!this.currentTrail1 || !this.currentTrail2) {
        this.currentTrail1 = this.trailRenderer.startTrail(
          0.1, behindWheel1, new Float32Array([0, 1, 0]), Math.abs(slideValue * 0.8))
        this.currentTrail2 = this.trailRenderer.startTrail(
          0.1, behindWheel2, new Float32Array([0, 1, 0]), Math.abs(slideValue * 0.8))
      } else {
        this.currentTrail1.addPoint(
          behindWheel1, new Float32Array([0, 1, 0]), Math.abs(slideValue * 0.8))
        this.currentTrail2.addPoint(
          behindWheel2, new Float32Array([0, 1, 0]), Math.abs(slideValue * 0.8))
      }
    } else if (this.currentTrail1 && this.currentTrail2) {
      let trail1 = this.currentTrail1
      let trail2 = this.currentTrail2
      setTimeout(() => {
        gsap.to([trail1, trail2], {
          opacity: 0, duration: 3, onComplete: () => {
            this.trailRenderer.removeTrail(trail1)
            this.trailRenderer.removeTrail(trail2)
          }
        })
      }, 2000)
      this.currentTrail1 = undefined
      this.currentTrail2 = undefined
    }
    this.setMasterVolume()
  }

  setSpeed(track: Track) {
    let perfectPositionDiff = this.getPerfectPositionDiff(track)
    if (perfectPositionDiff > 1) {
      if (this.model) {
        // (this._model.meshes[0].material as StandardMaterial).baseColor = new Color(1, 0, 0)
      }
      this.maxSpeed *= 0.95
      if (this._accelerate) {
        this.maxSpeed = Math.max(Car.MAX_SPEED * 0.25, this.maxSpeed)
      }
    } else {
      if (this.model) {
        // (this._model.meshes[0].material as StandardMaterial).baseColor = new Color(1, 1, 1)
      }
      this.maxSpeed *= 1.02
    }
    this.maxSpeed = Math.max(Car.MIN_SPEED, this.maxSpeed)
    this.maxSpeed = Math.min(Car.MAX_SPEED, this.maxSpeed)
    if (this._accelerate) {
      this.speedPercent = Math.min(1, this.speedPercent += 0.02)
    } else {
      this.speedPercent *= 0.97
    }
    const lerp = (v0: number, v1: number, t: number) => {
      return v0 * (1 - t) + v1 * t
    }
    this.speed = lerp(this.minSpeed, this.maxSpeed, this.speedPercent)

    this.audioPlayer?.play("engine_loop", { loop: true, volume: 0.5, muteOnBlur: true })
    this.audioPlayer?.setRate("engine_loop", 1 + this.speedPercent * 0.3)
    this.audioPlayer?.setVolume("engine_loop", 0.5 - this.speedPercent * 0.25)
  }

  setSlideOffset(track: Track) {
    let curve = track.getCurveAtDistance(this.totalDistance, { curveStartsAtDistance: 0 })
    let percentOfCurve = track.getPercentOfCurve(this.totalDistance)
    let slideStrength = 0

    const quadraticEaseOut = (p: number) => -(p * (p - 2))
    if (percentOfCurve <= 0.5) {
      slideStrength = quadraticEaseOut(percentOfCurve * 2)
    } else {
      slideStrength = quadraticEaseOut(1 - (percentOfCurve - 0.5) * 2)
    }
    slideStrength *= 5 * (this.speedPercent * this.speedPercent)

    let slideValue = slideStrength * -curve.slide * Config.slide * this.speedPercent
    let slideOffset = Vec3.scale(this.currentDirection!, slideValue)

    this.modelContainer.position.array = slideOffset

    return slideValue
  }

  setMasterVolume() {
    if (!this.audioPlayer) {
      return
    }
    let screen = Camera.main.worldToScreen(this.x, this.y, this.z)

    let a = screen.x - Camera.main.renderer.screen.width / 2;
    let b = screen.y - Camera.main.renderer.screen.height / 2;
    let c = Math.hypot(
      a / Camera.main.renderer.screen.width, b / Camera.main.renderer.screen.height)

    this.audioPlayer.masterVolume = 1 - (Math.max(Math.min(c, 1), 0) * 2)
  }
}