import { Program, Renderer, Shader, Texture } from "pixi.js"
import { Camera, Color, LightingEnvironment, Material, MaterialRenderPass, Mesh3D, MeshShader, Vec3 } from "pixi3d"

export class WaterMatrial extends Material {
  time = 0
  shallowColor = Color.fromBytes(30, 30, 30)
  deepColor = Color.fromBytes(0, 123, 180)
  refractionStrength = 0.05
  depth = 3
  lightDirection = Vec3.create()
  waveStrength = 0.5

  constructor(private renderer: Renderer, private heightTexture: Texture, private normalTexture: Texture, private depthTexture: Texture, private colorPass: MaterialRenderPass) {
    super()
  }

  updateUniforms(mesh: Mesh3D, shader: Shader) {
    shader.uniforms.u_ViewProjection = Camera.main.viewProjection.array
    shader.uniforms.u_Model = mesh.worldTransform.array
    shader.uniforms.u_DepthTexture = this.depthTexture
    shader.uniforms.u_ColorTexture = this.colorPass.renderTexture
    shader.uniforms.u_Resolution = [this.renderer.width, this.renderer.height]
    shader.uniforms.u_ShallowWaterColor = this.shallowColor.rgb
    shader.uniforms.u_DeepWaterColor = this.deepColor.rgb
    shader.uniforms.u_Time = this.time
    shader.uniforms.u_WaterHeightTexture = this.heightTexture
    shader.uniforms.u_WaterNormalTexture = this.normalTexture
    shader.uniforms.u_RefractionStrength = this.refractionStrength
    shader.uniforms.u_Depth = this.depth
    shader.uniforms.u_NormalStrength = 1;
    shader.uniforms.u_LightDirection = this.lightDirection
    shader.uniforms.u_CameraPosition = Camera.main.worldTransform.position.array
    shader.uniforms.u_CameraNear = Camera.main.near
    shader.uniforms.u_CameraFar = Camera.main.far
    shader.uniforms.u_WaveStrength = this.waveStrength
  }

  createShader() {
    return new MeshShader(Program.from(vert, frag))
  }
}

const vert = `
#version 100
precision highp float;

attribute vec3 a_Position;
attribute vec2 a_UV1;
attribute vec3 a_Normal;
attribute vec4 a_Tangent;

varying vec3 v_Normal;
varying vec3 v_WorldPosition;
varying vec2 v_UV1;
varying mat3 v_TBN;

uniform mat4 u_ViewProjection;
uniform mat4 u_Model;
uniform sampler2D u_WaterHeightTexture;
uniform float u_Time;
uniform float u_WaveStrength;

float getWaterSurfaceHeight(vec2 offset, float tiling) {
  vec2 waterHeightUV = (a_UV1 * tiling) + offset;
  float sampledHeight = texture2D(u_WaterHeightTexture, waterHeightUV).r * 2.0 - 1.0;
  return sampledHeight;
}

void main() {
  vec2 waterScroll1 = normalize(vec2(0, 1)) * u_Time * 0.3;
  vec2 waterScroll2 = normalize(vec2(0, -1)) * u_Time * 0.3;

  float waterSurfaceHeight1 = getWaterSurfaceHeight(waterScroll1, 7.0);
  float waterSurfaceHeight2 = getWaterSurfaceHeight(waterScroll2, 5.0);
  float finalWaterSurfaceHeight = (waterSurfaceHeight1 + waterSurfaceHeight2) * u_WaveStrength;

  vec3 position = a_Position + vec3(0, finalWaterSurfaceHeight, 0);

  v_UV1 = a_UV1;
  v_WorldPosition = (u_Model * vec4(position, 1.0)).xyz;
  v_Normal = a_Normal;

  vec3 bitangent = cross(a_Normal, a_Tangent.xyz);

  vec3 T = normalize(vec3(u_Model * a_Tangent));
  vec3 B = normalize(vec3(u_Model * vec4(bitangent, 0.0)));
  vec3 N = normalize(vec3(u_Model * vec4(a_Normal, 0.0)));

  v_TBN = mat3(T, B, N);

  gl_Position = u_ViewProjection * u_Model * vec4(position, 1.0);
}
`

const frag = `
#version 100
precision highp float;

varying vec3 v_Normal;
varying vec3 v_WorldPosition;
varying vec2 v_UV1;
varying mat3 v_TBN;

uniform sampler2D u_DepthTexture;
uniform sampler2D u_ColorTexture;
uniform float u_Time;
uniform vec2 u_Resolution;
uniform vec3 u_ShallowWaterColor;
uniform vec3 u_DeepWaterColor;
uniform sampler2D u_WaterColorTexture;
uniform sampler2D u_WaterNormalTexture;

uniform float u_RefractionStrength;
uniform float u_Depth;
uniform float u_NormalStrength;
uniform vec3 u_LightDirection;
uniform float u_CameraNear;
uniform float u_CameraFar;
uniform vec3 u_CameraPosition;

float linearizeDepth(float d, float zNear, float zFar) {
  float z_n = 2.0 * d - 1.0;
  return 2.0 * zNear * zFar / (zFar + zNear - z_n * (zFar - zNear));
}

vec3 getRefractionColor(vec2 offset) {
  float refractionStrength = u_RefractionStrength;

  vec2 sampledWaterNormal = (texture2D(u_WaterNormalTexture, v_UV1 + offset).rg * 2.0 - 1.0) * refractionStrength;
  vec2 screenPosition = gl_FragCoord.xy / u_Resolution;
  vec2 screenPositionRefraction = screenPosition + sampledWaterNormal;

  vec3 sampledRefraction = texture2D(u_ColorTexture, screenPositionRefraction).rgb;
  return sampledRefraction;
}

float getWaterDepth() {
  float maxDepthDistance = u_Depth;

  vec2 screenPosition = gl_FragCoord.xy / u_Resolution;

  vec4 sampledDepth = texture2D(u_DepthTexture, screenPosition);
  float currentDepth = linearizeDepth(gl_FragCoord.z, u_CameraNear, u_CameraFar);
  float terrainDepth = linearizeDepth(sampledDepth.r, u_CameraNear, u_CameraFar);
  
  float depthDifference = abs(terrainDepth - currentDepth);
  float distanceToTerrain = clamp(depthDifference / maxDepthDistance, 0.0, 1.0);

  return distanceToTerrain;
}

vec3 getDiffuseLight(vec3 normal) {
  vec3 L = normalize(-u_LightDirection);
  vec3 N = normalize(normal);
  float diffuseLight = clamp(dot(N, L), 0.0, 1.0);
  float diffuseLightStrength = 0.3;
  return vec3(diffuseLight * diffuseLightStrength);
}

vec3 getSpecularLight(vec3 normal) {
  vec3 L = normalize(-u_LightDirection);
  vec3 V = normalize(u_CameraPosition - v_WorldPosition);
  vec3 R = reflect(L, normal);
  float specularLight = clamp(dot(V, R), 0.0, 1.0);
  float gloss = 0.85;
  float specularExponent = pow(specularLight, gloss);
  return vec3(specularExponent);
}

vec3 getWaterSurfaceNormal(vec2 offset, float tiling) {
  vec2 waterNormalUV = v_UV1 * tiling + offset;
  vec3 sampledNormal = texture2D(u_WaterNormalTexture, waterNormalUV).rgb * 2.0 - 1.0;
  vec3 waterSurfaceNormal = normalize(v_TBN * sampledNormal) * u_NormalStrength; 
  return waterSurfaceNormal;
}

vec3 getWaterDepthColor(float waterDepth) {
 return mix(u_ShallowWaterColor, u_DeepWaterColor, waterDepth);
}

void main() {
  vec3 normal = normalize(v_Normal);
  if (abs(normal.x) > 0.0 || normal.y < -0.1) {
    discard;
  }
  vec2 waterScroll1 = normalize(vec2(0, 1)) * u_Time * 0.3;
  vec2 waterScroll2 = normalize(vec2(0, -1)) * u_Time * 0.3;
  vec3 waterSurfaceNormal1 = getWaterSurfaceNormal(waterScroll1, 7.0);
  vec3 waterSurfaceNormal2 = getWaterSurfaceNormal(waterScroll2, 5.0);
  vec3 waterSurfaceNormal = waterSurfaceNormal1 + waterSurfaceNormal2;

  float waterDepth = getWaterDepth();
  vec3 waterDepthColor = getWaterDepthColor(waterDepth);
  vec3 waterRefractionColor = getRefractionColor(waterSurfaceNormal.rg);
  float waterRefractionMask = 1.0 - waterDepth;
  vec3 waterRefraction = mix(vec3(0), waterRefractionColor, waterRefractionMask);
  
  vec3 diffuseLight = getDiffuseLight(waterSurfaceNormal);
  vec3 specularLight = getSpecularLight(waterSurfaceNormal);
  vec3 finalLightColor = diffuseLight + specularLight;
  vec3 finalWaterColor = waterDepthColor + waterRefraction + finalLightColor;

  gl_FragColor = vec4(finalWaterColor, 1);
}
`