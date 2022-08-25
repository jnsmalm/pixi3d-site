import { Program, State, Renderer } from "pixi.js"
import { Camera, LightingEnvironment, Mat4, Mesh3D, MeshShader } from "pixi3d"

export class PlanarShadowsRenderPass {
  private shader = new MeshShader(Program.from(vert, frag))
  private state = Object.assign(new State(), {
    depthTest: false, depthMask: false, culling: true, clockwiseFrontFace: false
  })

  get name() {
    return "planar-shadows"
  }

  constructor(private renderer: Renderer) { }

  render(meshes: Mesh3D[]) {
    const gl = this.renderer.gl

    gl.enable(gl.STENCIL_TEST)
    gl.stencilFunc(gl.EQUAL, 5, 0xFF)
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.ZERO)

    for (let mesh of meshes) {
      this.shader.uniforms.u_Model = mesh.worldTransform.array
      this.shader.uniforms.u_InversedModel = Mat4.invert(mesh.worldTransform.array)
      this.shader.uniforms.u_ViewProjection = Camera.main.viewProjection
      this.shader.uniforms.u_LightDir =
        LightingEnvironment.main.lights[0].worldTransform.forward
      this.shader.render(mesh, this.renderer, this.state)
    }
    gl.disable(gl.STENCIL_TEST)
  }
}

const vert = `
attribute vec3 a_Position;

uniform mat4 u_ViewProjection;
uniform mat4 u_Model;
uniform mat4 u_InversedModel;
uniform vec3 u_LightDir;

void main() {
  vec3 worldLightDirection = -normalize(u_LightDir);
  vec3 _PlaneNormal = vec3(0, 1, 0);
  mat4 unity_ObjectToWorld = u_Model;
  mat4 unity_WorldToObject = u_InversedModel;

  // Calculate vertex offset
  float planeNormalDotWorldVertex = dot(_PlaneNormal, vec3(unity_ObjectToWorld * vec4(a_Position, 1)));
  float planeNormalDotLightDir = dot(_PlaneNormal, worldLightDirection);
  vec3 worldVertexToPlaneVector = worldLightDirection * (planeNormalDotWorldVertex / (-planeNormalDotLightDir));

  vec4 offset = vec4(a_Position, 1.0) + unity_WorldToObject * vec4(worldVertexToPlaneVector, 0.0);

  // Add vertex offset in local coordinates before applying final transformation
  gl_Position = u_ViewProjection * u_Model * offset;
}
`

const frag = `
void main() {
  vec3 shadowColor = vec3(0.1, 0.1, 0.1);
  gl_FragColor = vec4(shadowColor * 0.5, 0.5);
}
`