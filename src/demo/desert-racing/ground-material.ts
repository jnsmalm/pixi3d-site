import { Program, Renderer, Shader } from "pixi.js";
import { Camera, Material, Mesh3D, MeshShader } from "pixi3d";

export class GroundMaterial extends Material {

  updateUniforms(mesh: Mesh3D, shader: Shader) {
    shader.uniforms.u_ViewProjection = Camera.main.viewProjection.array
    shader.uniforms.u_Model = mesh.worldTransform.array
  }

  createShader() {
    return new MeshShader(Program.from(vert, frag))
  }

  render(mesh: Mesh3D, renderer: Renderer) {
    const gl = renderer.gl

    gl.enable(gl.STENCIL_TEST)
    gl.stencilFunc(gl.ALWAYS, 5, 0xFF)
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE)

    super.render(mesh, renderer)
    
    gl.disable(gl.STENCIL_TEST)
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
void main() {
  vec3 groundColor = vec3(255.0 / 255.0, 218.0 / 255.0, 107.0 / 255.0);

  gl_FragColor = vec4(groundColor, 1);
}
`