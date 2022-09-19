import { Program, Shader, Texture } from "pixi.js"
import { Camera, Color, Material, Mesh3D, MeshShader } from "pixi3d"

export class SkyMaterial extends Material {
  horizonSize = 50
  horizonColor = Color.fromBytes(255, 255, 255)

  constructor(private texture: Texture) {
    super()
    this.state.culling = true
    this.state.clockwiseFrontFace = false
  }

  updateUniforms(mesh: Mesh3D, shader: Shader) {
    shader.uniforms.u_ViewProjection = Camera.main.viewProjection
    shader.uniforms.u_Model = mesh.worldTransform.array
    shader.uniforms.u_Texture = this.texture
    shader.uniforms.u_HorizonColor = this.horizonColor.rgb
    shader.uniforms.u_HorizonSize = this.horizonSize
  }

  createShader() {
    return new MeshShader(Program.from(vert, frag))
  }
}

const vert = `
attribute vec3 a_Position;
attribute vec2 a_UV1;

varying vec3 v_Position;
varying vec2 v_UV1;

uniform mat4 u_ViewProjection;
uniform mat4 u_Model;

void main() {
  gl_Position = u_ViewProjection * u_Model * vec4(a_Position, 1.0);
  v_UV1 = a_UV1;
}
`

const frag = `
varying vec2 v_UV1;

uniform sampler2D u_Texture;
uniform vec3 u_HorizonColor;
uniform float u_HorizonSize;

void main() {
  vec3 sampledColor = texture2D(u_Texture, v_UV1).rgb;
  float horizonMask = smoothstep(0.2, 0.5, 1.0 - v_UV1.y * u_HorizonSize);
  vec3 finalColor = mix(sampledColor * 1.6, u_HorizonColor, horizonMask);
  gl_FragColor = vec4(finalColor, 1.0);
}
`