import { Program, Shader } from "pixi.js";
import { Camera, Material, Mesh3D, MeshShader } from "pixi3d";
import type { Track } from "./track";

export class TrackMaterial extends Material {
  constructor(public track: Track) {
    super()
  }

  updateUniforms(mesh: Mesh3D, shader: Shader) {
    shader.uniforms.u_ViewProjection = Camera.main.viewProjection
    shader.uniforms.u_TotalDistance = this.track.totalDistance
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

uniform float u_TotalDistance;

void main() {
  float TAU = 6.2831;
  float line = 1.0 - (cos(v_UV1.x * TAU) * 0.5 + 0.5);

  line = step(0.998, line);
  float cutoff = step(0.5, fract(v_UV1.y * u_TotalDistance * 0.9));

  float trackLine = line * cutoff;

  vec3 lineColor = vec3(251.0 / 256.0, 211.0 / 256.0, 52.0 / 256.0);
  vec3 roadColor = vec3(72.0 / 256.0, 70.0 / 256.0, 63.0 / 256.0);
  vec3 trackColor = mix(roadColor, lineColor, trackLine);

  gl_FragColor = vec4(trackColor, 1);
}
`