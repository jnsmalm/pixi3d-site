import { BLEND_MODES, Program, Shader } from "pixi.js"
import { Camera, Material, MaterialRenderSortType, Mesh3D, MeshShader } from "pixi3d"

export class GoalMaterial extends Material {
  constructor() {
    super()

    this.renderSortType = MaterialRenderSortType.transparent
    this.blendMode = BLEND_MODES.ADD
    this.doubleSided = true
    this.state.depthMask = false
  }

  createShader() {
    return new MeshShader(Program.from(vert, frag))
  }

  updateUniforms(mesh: Mesh3D, shader: Shader) {
    shader.uniforms.u_Model = mesh.worldTransform.array
    shader.uniforms.u_ViewProjection = Camera.main.viewProjection.array
  }
}

const vert = `
attribute vec3 a_Position;
attribute vec2 a_UV1;
attribute vec3 a_Normal;

varying vec3 v_Position;
varying vec2 v_UV1;
varying vec3 v_Normal;

uniform mat4 u_ViewProjection;
uniform mat4 u_Model;

void main() {
  v_Position = a_Position;
  v_Normal = a_Normal;
  v_UV1 = a_UV1;
  gl_Position = u_ViewProjection * u_Model * vec4(a_Position, 1.0);
}
`

const frag = `
varying vec3 v_Normal;
varying vec2 v_UV1;
varying vec3 v_Position;

uniform vec3 u_Color;

void main() {
  vec3 normal = normalize(v_Normal * 0.5 + 0.5);
  float up = normal.y;
  float alpha = 1.0;
  vec3 color = vec3(0.9, 0.9, 0.9);
  gl_FragColor = vec4(vec3(color * alpha), alpha);
}
`