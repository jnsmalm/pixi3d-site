import gsap from "gsap";
import { BLEND_MODES, Container, Graphics, Rectangle, Renderer, Text, Ticker } from "pixi.js";
import { Camera, Container3D, glTFAsset, Material, Model, PostProcessingSprite } from "pixi3d";

export class StartScreen extends Container {
  private modelContainer: Container3D
  private model?: Model
  private texts = [
    "PRESS AND HOLD TO SPEED UP",
    "RELEASE TO SLOW DOWN",
    "STEERING IS ON AUTOMATIC"
  ]
  private textIndex = 0
  private startText: Text
  private tipText: Text
  private ticker = new Ticker()
  private startButton: PostProcessingSprite
  private transitionOverlay: Graphics
  private flashOverlay: Graphics
  private textTimeline?: gsap.core.Timeline

  constructor(private renderer: Renderer, private onStart: () => void) {
    super()

    this.zIndex = 1

    this.modelContainer = new Container3D()

    this.startButton = this.addChild(
      new PostProcessingSprite(renderer, {
        objectToRender: this.modelContainer, width: 512, height: 512
      }))
    this.startButton.visible = false
    this.startButton.anchor.set(0.5)
    this.startButton.hitArea = new Rectangle(-110, -80, 220, 160)
    this.startButton.interactive = true
    this.startButton.buttonMode = true
    this.startButton.on("pointerdown", () => {
      this.onStart()
      this.startButton.interactive = false
    })

    this.startText = this.startButton.addChild(new Text("START", {
      fontFamily: "contrailone",
      fontSize: 50,
      fill: 0xffffff,
      dropShadow: true,
      dropShadowBlur: 15,
      dropShadowAlpha: 0.5,
      align: "center",
      stroke: 0,
      strokeThickness: 7,
      padding: 30
    }))
    this.startText.anchor.set(0.5)

    this.tipText = this.startButton.addChild(new Text("", {
      fontFamily: "contrailone",
      fontSize: 25,
      fill: 0xffffff,
      align: "center",
      stroke: 0,
      dropShadow: true,
      dropShadowBlur: 15,
      dropShadowAlpha: 1,
      padding: 20
    }))
    this.tipText.anchor.set(0.5)
    this.tipText.alpha = 0
    this.tipText.position.y = 120

    this.flashOverlay = this.addChild(new Graphics())
    this.flashOverlay.beginFill(0xffffff)
    this.flashOverlay.drawRect(0, 0, 100, 100)
    this.flashOverlay.endFill()
    this.flashOverlay.alpha = 0
    this.flashOverlay.blendMode = BLEND_MODES.ADD

    this.transitionOverlay = this.addChild(new Graphics())
    this.transitionOverlay.beginFill(0)
    this.transitionOverlay.drawRect(0, 0, 100, 100)
    this.transitionOverlay.endFill()
    this.transitionOverlay.alpha = 0
  }

  createFlagModel(gltf: glTFAsset) {
    let camera = new Camera(this.renderer);
    camera.z = 9
    camera.aspect = 1

    let time = 0
    this.ticker.add(() => {
      time += 0.1
    })

    let material = Material.from(vert, frag, (mesh, shader) => {
      shader.uniforms.u_ViewProjection = camera.viewProjection
      shader.uniforms.u_Time = time
      shader.uniforms.u_Model = mesh.worldTransform.array
    })
    material.state.depthTest = false

    this.model = this.modelContainer.addChild(Model.from(gltf))
    this.model.meshes.forEach(mesh => {
      mesh.renderSortOrder = 5
      mesh.material = material
      mesh.material.doubleSided = true
    })
    this.model.scale.set(2, 1.5, 1)
  }

  show() {
    this.tipText.visible = true
    this.tipText.alpha = 0
    this.startButton.interactive = true
    this.startButton.visible = true

    this.ticker.add(() => {
      let scale = this.renderer.screen.height / 700
      this.startButton.x = this.renderer.screen.width / 2
      this.startButton.y = this.renderer.screen.height - 160 * scale
      this.startButton.scale.set(scale)
      this.transitionOverlay.width = this.renderer.screen.width
      this.transitionOverlay.height = this.renderer.screen.height
      this.flashOverlay.width = this.renderer.screen.width
      this.flashOverlay.height = this.renderer.screen.height
    })
    this.ticker.start()

    this.textTimeline = gsap.timeline({ repeat: -1 })
    this.textTimeline.call(() => {
      this.tipText.text = this.texts[this.textIndex]
      this.tipText.scale.set(0.8)
    })
    this.textTimeline.to(this.tipText, { alpha: 1, duration: 0.2, delay: 1.5 })
    this.textTimeline.to(this.tipText.scale, { x: 1, y: 1, duration: 0.5, delay: -0.2, ease: "back.out" })
    this.textTimeline.to(this.tipText, { alpha: 0, duration: 0.2, delay: 2 })
    this.textTimeline.call(() => {
      this.textIndex = (this.textIndex + 1) % this.texts.length
    })
  }

  hide() {
    if (this.textTimeline) {
      this.textTimeline.kill()
    }
    this.startButton.visible = false
    this.tipText.visible = false
  }

  flash() {
    let timeline = gsap.timeline()
    timeline.to(this.flashOverlay, { alpha: 0.3, duration: 0.1 })
    timeline.to(this.flashOverlay, { alpha: 0.0, duration: 2 })
  }

  transition(onComplete: () => void) {
    let timeline = gsap.timeline()
    timeline.to(this.transitionOverlay, { alpha: 1, duration: 0.5, delay: 0.5, ease: "power2.in" })
    timeline.call(onComplete)
    timeline.to(this.transitionOverlay, { alpha: 0, duration: 0.5, ease: "power2.in" })
  }
}

const vert = `
#version 100
precision highp float;

attribute vec3 a_Position;
attribute vec2 a_UV1;
attribute vec3 a_Normal;

varying vec2 v_UV1;
varying vec3 v_Normal;

uniform mat4 u_ViewProjection;
uniform mat4 u_Model;
uniform float u_Time;

void main() {
  float x = cos(a_UV1.y * 5.0 + u_Time);

  vec3 position = a_Position + vec3(0, x * 0.1, x * 0.2);

  v_Normal = a_Normal;
  v_UV1 = a_UV1;
  gl_Position = u_ViewProjection * u_Model * vec4(position, 1);
}
`

const frag = `
#version 100
precision highp float;

varying vec3 v_Normal;
varying vec2 v_UV1;

uniform float u_Time;

void main() {
  float light = cos(v_UV1.y * 5.0 + u_Time);

  float chessboard = floor(v_UV1.x * 4.0) + floor(v_UV1.y * 6.0);
  chessboard = fract(chessboard * 0.5);
  chessboard *= 2.0;

  gl_FragColor = vec4(vec3(chessboard + light * 0.15), 1);
}
`