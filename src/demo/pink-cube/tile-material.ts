import { Program, Shader } from "pixi.js"
import { Camera, Color, Material, Mesh3D, MeshShader } from "pixi3d"

export class TileMaterial extends Material {
  color = new Color()
  color2 = new Color(1, 180 / 255, 248 / 255)
  alpha = 1

  createShader() {
    return new MeshShader(Program.from(vert, frag))
  }

  updateUniforms(mesh: Mesh3D, shader: Shader) {
    shader.uniforms.u_Model = mesh.worldTransform.array
    shader.uniforms.u_ViewProjection = Camera.main.viewProjection
    shader.uniforms.u_Color = this.color.rgba
    shader.uniforms.u_Color2 = this.color2.rgba
    shader.uniforms.u_Alpha = this.alpha
  }
}

const vert = `
attribute vec3 a_Position;
attribute vec3 a_UV1;
attribute vec3 a_Normal;

varying vec4 v_Position;
varying vec3 v_UV1;
varying vec3 v_Normal;

uniform mat4 u_ViewProjection;
uniform mat4 u_Model;

void main() {
  v_Position = u_Model * vec4(a_Position, 1.0);
  v_Normal = a_Normal;
  v_UV1 = a_UV1;
  gl_Position = u_ViewProjection * u_Model * vec4(a_Position, 1.0);
}
`

const frag = `
varying vec3 v_Normal;
varying vec3 v_UV1;
varying vec4 v_Position;

uniform vec3 u_Color;
uniform vec3 u_Color2;
uniform float u_Alpha;

void main() {
  vec3 pos = v_Position.xyz / v_Position.w;
  vec3 normal = normalize(v_Normal * 0.5 + 0.5);
  float up = normal.y;
  float alpha = 1.0;
  float shade = normal.y + normal.x * 0.1;

  float a = -1.0;
  float b = -7.0;

  float fade = clamp((a - pos.y) * (a/b), 0.0, 1.0);
  vec3 color = mix(u_Color * shade, u_Color2, pow(fade, 0.9));

  gl_FragColor = vec4(vec3(color * 1.0 * u_Alpha), u_Alpha);
}
`