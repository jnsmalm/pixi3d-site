import { Application, ENV, LoaderResource, Renderer, settings, Texture } from "pixi.js";
import { Camera, CameraOrbitControl, ImageBasedLighting, Light, LightingEnvironment, LightType, MaterialRenderPass, Mesh3D, Model, ShadowCastingLight, ShadowQuality, Sprite3D, StandardMaterial, StandardPipeline } from "pixi3d";
import { Car } from "./desert-racing/car";
import { CpuCar } from "./desert-racing/cpu-car";
import { DustParticleSystem } from "./desert-racing/dust-particles";
import { Editor } from "./desert-racing/editor";
import { StartScreen } from "./desert-racing/start-screen";
import { Grid } from "./desert-racing/grid";
import { GroundMaterial } from "./desert-racing/ground-material";
import { PlanarShadowsRenderPass } from "./desert-racing/planar-shadows";
import { StartLine } from "./desert-racing/start-line";
import { Track } from "./desert-racing/track";
import { TrailRenderer } from "../components/TrailRenderer";
import { CountDownScreen } from "./desert-racing/count-down-screen";
import { LapCounter } from "./desert-racing/lap-counter";
import { FixedTimeStep } from "../components/FixedTimeStep";
import { AudioPlayer } from "../components/AudioPlayer";
import { Howl } from "howler";
import { InfoScreen } from "./desert-racing/info-screen";

enum GameState { startScreen, countDown, info, playing, finished }

export class RetroRacing {
  private app: Application
  private resources: { [key: string]: LoaderResource };
  private track: Track
  private trailRenderer: TrailRenderer
  private particleSystem: DustParticleSystem
  private playerCar: Car
  private cpuCar: CpuCar
  private editor: Editor
  private control: CameraOrbitControl
  private infoScreen: InfoScreen
  private startScreen: StartScreen
  private countDownScreen: CountDownScreen
  private lapCounter: LapCounter
  private gameState = GameState.startScreen
  private timeStep = new FixedTimeStep()
  private howl: Howl
  private audioPlayer: AudioPlayer

  constructor(view: HTMLCanvasElement, resizeTo?: HTMLElement) {
    settings.PREFER_ENV = ENV.WEBGL2

    this.app = new Application({
      view,
      backgroundColor: 0x888888,
      antialias: false,
      autoDensity: true,
      resolution: Math.min(2, window.devicePixelRatio),
      resizeTo: resizeTo || window,
      autoStart: false,
    })
    this.resources = this.app.loader.resources

    document.addEventListener("keydown", e => {
      this.playerCar.accelerate = true
    })
    document.addEventListener("keyup", e => {
      this.playerCar.accelerate = false
    })
    document.addEventListener("pointerdown", e => {
      this.playerCar.accelerate = true
    })
    document.addEventListener("pointerup", e => {
      this.playerCar.accelerate = false
    })

    this.howl = new Howl({
      "src": [
        "/sounds/desert-racing.ogg",
        "/sounds/desert-racing.m4a"
      ],
      "sprite": {
        "car_acc_1": [
          0,
          1874.9886621315193
        ],
        "car_acc_2": [
          3000,
          3187.5056689342405
        ],
        "car_rev_1": [
          8000,
          1437.5283446712021
        ],
        "car_skid_loop_1": [
          11000,
          1000
        ],
        "car_skid_loop_2": [
          13000,
          529.1609977324256
        ],
        "car_skid_loop_3": [
          15000,
          1000
        ],
        "car_skid_loop_4": [
          17000,
          1000
        ],
        "car_skid_loop_5": [
          19000,
          529.1836734693867
        ],
        "engine_loop": [
          21000,
          2500
        ],
        "music": [
          25000,
          47407.39229024943
        ]
      }
    })

    this.audioPlayer = new AudioPlayer(this.howl)
    this.track = this.app.stage.addChild(new Track())
    this.trailRenderer = this.app.stage.addChild(new TrailRenderer())
    this.particleSystem = this.app.stage.addChild(new DustParticleSystem())
    this.playerCar = this.app.stage.addChild(new Car(this.trailRenderer, +0.75,
      this.particleSystem, (lap) => { this.onLapComplete(lap) }, this.howl))
    this.cpuCar = this.app.stage.addChild(new CpuCar(
      this.trailRenderer, -0.75, this.particleSystem, this.howl))
    this.control = new CameraOrbitControl(this.app.renderer.view)
    this.editor = this.app.stage.addChild(new Editor(this.control))

    this.app.stage.sortableChildren = true

    this.startScreen = this.app.stage.addChild(new StartScreen(
      this.app.renderer as Renderer, () => { this.showInfo() }))
    this.countDownScreen = this.app.stage
      .addChild(new CountDownScreen(this.app.renderer as Renderer))
    this.lapCounter = this.app.stage.addChild(new LapCounter())
    this.infoScreen = this.app.stage.addChild(new InfoScreen(
      this.app.renderer as Renderer, () => { this.startCountDown() }))
  }

  async load() {
    this.app.loader.add("/models/rally-car-blue.glb")
    this.app.loader.add("/models/rally-car-yellow.glb")
    this.app.loader.add("/models/flag.glb")
    this.app.loader.add("/models/small-rock.glb")
    this.app.loader.add("/models/huge-rock.glb")
    this.app.loader.add("/models/medium-rock.glb")
    this.app.loader.add("/models/cactus1.glb")
    this.app.loader.add("/models/bus.glb")
    this.app.loader.add("/models/powerlines.glb")
    this.app.loader.add("/models/truck.glb")
    this.app.loader.add("/models/pickup.glb")
    this.app.loader.add("/environments/pink-sunrise/diffuse.cubemap")
    this.app.loader.add("/environments/pink-sunrise/specular.cubemap")
    this.app.loader.add("/textures/desert-racing-cars.png")
    this.app.loader.add("/textures/desert-racing-environments.png")
    this.app.loader.add("/textures/tracks.png")
    this.app.loader.add("/textures/smoke.png")

    return new Promise<void>(resolve => {
      this.app.loader.load(() => {
        resolve()
      })
    })
  }

  setupLighting() {
    LightingEnvironment.main.imageBasedLighting = new ImageBasedLighting(
      this.resources["/environments/pink-sunrise/diffuse.cubemap"].cubemap,
      this.resources["/environments/pink-sunrise/specular.cubemap"].cubemap
    )
    let directionalLight = new Light()
    directionalLight.type = LightType.directional
    directionalLight.intensity = 7
    directionalLight.rotationQuaternion.setEulerAngles(25, -65, 0)
    LightingEnvironment.main.lights.push(directionalLight)
  }

  setupCamera() {
    Camera.main.orthographic = true
    this.control.angles.x = 35
    this.control.angles.y = -35
    this.control.distance = 25
  }

  setupRenderPasses() {
    const pipeline = this.app.renderer.plugins.pipeline as StandardPipeline

    pipeline.renderPasses = [
      new MaterialRenderPass(this.app.renderer as Renderer, "ground"),
      new PlanarShadowsRenderPass(this.app.renderer as Renderer),
      ...pipeline.renderPasses
    ]
  }

  createGround() {
    let ground = this.app.stage.addChild(Mesh3D.createPlane(new GroundMaterial()))
    ground.scale.set(100)
    ground.renderSortOrder = 0
    ground.disableRenderPass("material")
    ground.enableRenderPass("ground")
    return ground
  }

  buildTrack(track: Track) {
    track.addStraight(0, 25)
    track.addCurve90(0, { x: -3, z: 3 })
    track.addStraight(-90, 4)
    track.addCurve180(-90, { x: -3, z: 3 })
    track.addCurve180(180, { x: 1, z: 1 })
    track.addCurve180(0, { x: 1, z: -1 })
    track.addCurve180(180, { x: -3, z: -3 })
    track.addCurve90(0, { x: -2, z: 2 })
    track.addStraight(-90)
    track.addCurve180(90, { x: 2, z: -2 })
    track.addStraight(0, 5)
    track.addCurve90(0)
    track.addStraight(90, 5)
    track.addCurve90(90)
    track.addStraight(90)
    track.addCurve90(90, { x: -1, z: 1 })
    track.addStraight(-90, 19)
    track.addCurve180(-90, { x: -2, z: 2 })
    track.addCurve90(0, { x: -1, z: -1 })
    track.addStraight(-90, 7)
    track.addCurve180(-90, { x: -1, z: 1 })
    track.addCurve180(180, { x: 2, z: 2 })
    track.addStraight(180, 12)

    // Small track For testing purposes
    // track.addStraight(0)
    // track.addCurve180(0, { x: 1, z: 1 })
    // track.addStraight(180)
    // track.addCurve180(180, { x: 1, z: 1 })

    track.updateTransform()
    track.buildMesh()
  }

  setupTrailRenderer(trailRenderer: TrailRenderer) {
    trailRenderer.renderSortOrder = 3
    trailRenderer.material.state.depthTest = false
    trailRenderer.material.texture = Texture.from("/textures/tracks.png")
    trailRenderer.material.textureScale[1] = 10
  }

  setupEditor() {
    this.editor.addAsset("small-rock", this.resources["/models/small-rock.glb"].gltf, 150)
    this.editor.addAsset("medium-rock", this.resources["/models/medium-rock.glb"].gltf, 150)
    this.editor.addAsset("cactus1", this.resources["/models/cactus1.glb"].gltf, 150)
    this.editor.addAsset("huge-rock", this.resources["/models/huge-rock.glb"].gltf, 300)
    this.editor.addAsset("powerlines", this.resources["/models/powerlines.glb"].gltf, 300)
    this.editor.addAsset("bus", this.resources["/models/bus.glb"].gltf, 150, Texture.from("/textures/desert-racing-cars.png"))
    this.editor.addAsset("pickup", this.resources["/models/pickup.glb"].gltf, 150, Texture.from("/textures/desert-racing-cars.png"))
    this.editor.addAsset("truck", this.resources["/models/truck.glb"].gltf, 150, Texture.from("/textures/desert-racing-cars.png"))
    this.editor.loadData()
  }

  showStartScreen() {
    this.startScreen.show()
    this.gameState = GameState.startScreen
    this.control.target = { x: 24, y: 0, z: 28 }
    this.lapCounter.visible = false
    this.lapCounter.reset()
    this.control.angles.x = 15
    this.control.angles.y = 40
  }

  startPlayerCarCameraTracking() {
    this.control.target = this.playerCar.position
  }

  resetCarsToStartingLine() {
    this.control.angles.x = 35
    this.control.angles.y = -35
    this.playerCar.totalDistance = this.track.totalDistance - 1.5
    this.playerCar.accelerate = false
    this.cpuCar.totalDistance = this.track.totalDistance - 1.5
    this.cpuCar.accelerate = false
    this.playerCar.lapDistance = - 1.5
    this.playerCar.resetLaps()
    this.cpuCar.lapDistance = - 1.5
    this.cpuCar.resetLaps()
    this.lapCounter.reset()
    this.lapCounter.visible = true
  }

  updateCamera() {
    let aspectRatio = this.app.renderer.width / this.app.renderer.height
    if (aspectRatio > 0.8) {
      Camera.main.orthographicSize = 3
    } else {
      Camera.main.orthographicSize = 5
    }
    this.control.updateCamera()
    this.editor?.setVisiblityForObjects(this.control.target)
  }

  showInfo() {
    this.audioPlayer.play("car_rev_1", { startWhenSuspended: true })
    this.audioPlayer.fadeVolume("music", 1)
    this.startScreen.flash()
    this.startScreen.transition(() => {
      this.startScreen.hide()
      this.resetCarsToStartingLine()
      this.startPlayerCarCameraTracking()
      this.gameState = GameState.info
      this.infoScreen.show()
    })
  }

  startCountDown() {
    this.infoScreen.hide()
    this.countDownScreen.show(() => {
      this.gameState = GameState.playing
      this.start()
    })
  }

  onLapComplete(lap: number) {
    if (this.gameState === GameState.playing) {
      if (lap === 3) {
        this.finished()
      } else {
        this.lapCounter.increase()
      }
      this.startScreen.flash()
    }
  }

  start() {
    this.gameState = GameState.playing
  }

  finished() {
    this.gameState = GameState.finished
    const { x, y, z } = this.playerCar!.position
    this.control.target = { x, y, z }
    setTimeout(() => {
      this.startScreen.transition(() => {
        this.showStartScreen()
      })
    }, 1000)
    this.audioPlayer.fadeVolume("music", 0.5)
  }

  playStartScreenCarLoop() {
    this.playerCar.accelerate = true
    this.cpuCar.accelerate = true
    if (this.playerCar.totalDistance < 150) {
      this.playerCar.totalDistance = 150
    }
    if (this.playerCar.totalDistance > 250) {
      this.playerCar.totalDistance = 150
    }
    if (this.cpuCar.totalDistance < 130) {
      this.cpuCar.totalDistance = 130
    }
    if (this.cpuCar.totalDistance > 230) {
      this.cpuCar.totalDistance = 130
    }
  }

  updateCars(elapsedTime: number) {
    let updateCarPositions =
      this.gameState === GameState.startScreen || 
      this.gameState === GameState.playing || 
      this.gameState === GameState.finished
    this.playerCar.update(
      this.track, updateCarPositions ? elapsedTime : 0);
    this.cpuCar.playerCarTotalDistance = this.playerCar.totalDistance
    this.cpuCar.update(
      this.track, updateCarPositions ? elapsedTime : 0)
  }

  show() {
    this.playerCar.createModel(this.resources["/models/rally-car-blue.glb"].gltf)
    this.cpuCar.createModel(this.resources["/models/rally-car-yellow.glb"].gltf)

    this.createGround()
    this.buildTrack(this.track)
    this.setupTrailRenderer(this.trailRenderer)
    this.setupLighting()
    this.setupCamera()
    this.setupEditor()
    this.setupRenderPasses()

    this.particleSystem.texture = Texture.from("/textures/smoke.png")

    this.app.stage.addChild(new StartLine())
    // this.app.stage.addChild(new Grid())

    this.startScreen.createFlagModel(this.resources["/models/flag.glb"].gltf)

    this.audioPlayer.play("music", {
      loop: true, muteOnBlur: true, volume: 0, startWhenSuspended: true
    })
    this.audioPlayer.fadeVolume("music", 0.5, 2000)

    this.showStartScreen()

    this.timeStep.addUpdate(elapsedTime => {
      if (this.gameState === GameState.startScreen) {
        this.playStartScreenCarLoop()
      }
      this.updateCars(elapsedTime)
      this.updateCamera()
    })
    this.timeStep.addRender(() => {
      this.app.renderer.render(this.app.stage)
    })
    this.timeStep.start()
  }
}