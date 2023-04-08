import { Program, Shader, Ticker } from "pixi.js"
import { Camera, Color, Material, Mesh3D, MeshShader } from "pixi3d"

export class SwimMatrial extends Material {
  private time = 0

  color = new Color()

  constructor(public size = 0.2, public strength = 1.3, public speed = 2.5) {
    super()

    this.time = Math.random() * 100
    Ticker.shared.add(() => {
      this.time += Ticker.shared.elapsedMS / 1000
    })
  }

  updateUniforms(mesh: Mesh3D, shader: Shader) {
    shader.uniforms.u_ViewProjection = Camera.main.viewProjection.array
    shader.uniforms.u_Model = mesh.worldTransform.array
    shader.uniforms.u_Speed = this.speed
    shader.uniforms.u_Size = this.size
    shader.uniforms.u_Strength = this.strength
    shader.uniforms.u_Time = this.time
    shader.uniforms.u_Color = this.color.rgb
  }

  createShader() {
    return new MeshShader(Program.from(vert, frag))
  }
}

const vert = `
attribute vec3 a_Position;

varying vec3 v_Position;

uniform mat4 u_ViewProjection;
uniform mat4 u_Model;
uniform float u_Time;
uniform float u_Speed;
uniform float u_Strength;
uniform float u_Size;

void main() {
  float offset = sin(a_Position.x * u_Size + u_Time * u_Speed);
  vec3 position = a_Position + vec3(0, 0, offset * u_Strength);
  gl_Position = u_ViewProjection * u_Model * vec4(position, 1.0);
  v_Position = a_Position.xyz;
}
`

const frag = `
varying vec3 v_Position;

uniform vec3 u_Color;

void main() {
  gl_FragColor = vec4(u_Color, 1.0);
}
`