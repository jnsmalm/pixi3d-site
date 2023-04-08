import { Program, Shader } from "pixi.js";
import { Camera, Container3D, Material, Mesh3D, MeshShader } from "pixi3d";

export class StartLine extends Container3D {
  private mesh: Mesh3D

  constructor() {
    super()
    
    this.mesh = this.addChild(Mesh3D.createPlane(new StartLineMaterial()))
    this.mesh.scale.set(1.5, 1, 0.3)
    this.mesh.renderSortOrder = 2
    this.mesh.enableRenderPass("ground")
    this.mesh.disableRenderPass("material")
  }
}

class StartLineMaterial extends Material {
  constructor() {
    super()
    this.state.depthTest = false
  }

  updateUniforms(mesh: Mesh3D, shader: Shader) {
    shader.uniforms.u_ViewProjection = Camera.main.viewProjection.array
    shader.uniforms.u_Model = mesh.worldTransform.array
  }

  createShader() {
    return new MeshShader(Program.from(vert, frag))
  }
}

const vert = `
attribute vec3 a_Position;
attribute vec2 a_UV1;

varying vec2 v_UV1;

uniform mat4 u_ViewProjection;
uniform mat4 u_Model;

void main() {
  v_UV1 = a_UV1;
  gl_Position = u_ViewProjection * u_Model * vec4(a_Position, 1.0);
}
`

const frag = `
varying vec2 v_UV1;

void main() {
  float chessboard = floor(v_UV1.x * 20.0) + floor(v_UV1.y * 4.0);
  chessboard = fract(chessboard * 0.5);
  chessboard *= 2.0;

  gl_FragColor = vec4(vec3(chessboard), 1);
}
`