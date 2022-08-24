import { Buffer, Program, Renderer, Shader } from "pixi.js";
import { Camera, Color, Container3D, Mat4, Material, Mesh3D, MeshGeometry3D, MeshShader, Quat, Vec3 } from "pixi3d";

export class TrailRenderer extends Container3D {
  private _trails: Trail[] = []
  private _mesh: Mesh3D
  private _maxPoints = 100

  constructor(public material = new TrailMaterial()) {
    super()

    this._mesh = this.addChild(new Mesh3D(this.createGeometry(this._maxPoints), material))
    this._mesh.renderSortOrder = 10
  }

  createGeometry(maxPoints: number) {
    let verticesPerPoint = 2
    let elementsPerPosition = 3
    let elementsPerUV = 2
    let indicesPerPoint = 6

    return Object.assign(new MeshGeometry3D(), {
      positions: {
        buffer: new Float32Array(maxPoints * verticesPerPoint * elementsPerPosition)
      },
      indices: {
        buffer: new Uint16Array(maxPoints * indicesPerPoint)
      },
      uvs: [
        { buffer: new Float32Array(maxPoints * verticesPerPoint * elementsPerUV) }
      ],
      distances: {
        buffer: new Float32Array(maxPoints * verticesPerPoint)
      },
    })
  }

  startTrail(size: number, position: Float32Array, normal: Float32Array) {
    let trail = new Trail(size)
      .addPoint(position, normal)
    return this._trails[this._trails.push(trail) - 1]
  }

  _render(renderer: Renderer) {
    let totalPoints = 0

    for (let i = 0; i < this._trails.length; i++) {
      for (let j = 0; j < this._trails[i].points.length; j++) {
        totalPoints++
      }
    }

    if (totalPoints > this._maxPoints) {
      this._mesh.geometry = this.createGeometry(totalPoints + Math.ceil(totalPoints * 0.1))
    }

    let positions = this._mesh.geometry.positions!.buffer
    let uvs = this._mesh.geometry.uvs![0].buffer
    let indices = this._mesh.geometry.indices!.buffer
    let distances = (this._mesh.geometry as any).distances.buffer

    let pointIndex = 0
    let positionIndex = 0
    let uvIndex = 0
    let indicesIndex = 0
    let distancesIndex = 0
    let index = 0

    for (let i = 0; i < this._trails.length; i++) {
      for (let j = 0; j < this._trails[i].points.length; j++) {
        let point = this._trails[i].points[j]

        positions[positionIndex++] = point.rightPosition[0]
        positions[positionIndex++] = point.rightPosition[1]
        positions[positionIndex++] = point.rightPosition[2]
        positions[positionIndex++] = point.leftPosition[0]
        positions[positionIndex++] = point.leftPosition[1]
        positions[positionIndex++] = point.leftPosition[2]

        uvs[uvIndex++] = 0
        uvs[uvIndex++] = point.distance
        uvs[uvIndex++] = 1
        uvs[uvIndex++] = point.distance

        distances[distancesIndex++] = j / (this._trails[i].maxPoints - 1)
        distances[distancesIndex++] = j / (this._trails[i].maxPoints - 1)

        if (j === 0) {
          continue
        }

        indices[indicesIndex++] = index
        indices[indicesIndex++] = index + 1
        indices[indicesIndex++] = index + 2

        indices[indicesIndex++] = index + 2
        indices[indicesIndex++] = index + 1
        indices[indicesIndex++] = index + 3

        index += 2

        if (j === this._trails[i].points.length - 1) {
          index += 2
        }
      }
    }

    (this._mesh.geometry as any)._shaderGeometry = {}

    super._render(renderer)
  }
}

export class Trail {
  private _size: number
  private _totalDistance = 0

  points: TrailPoint[] = []
  maxPoints = 100

  get totalDistance() {
    return this._totalDistance
  }

  constructor(size: number) {
    this._size = size
  }

  addPoint(position: Float32Array, normal: Float32Array): Trail {
    let point = new TrailPoint(position, 0)
    if (this.points.length === 0) {
      this.points.push(point); return this
    }
    let previousPoint = this.points[0]
    let distance = Vec3.distance(previousPoint.center, position)
    this._totalDistance += distance

    point.distance = this._totalDistance

    let rotationBetweenPoints = Mat4.getRotation(
      Mat4.targetTo(previousPoint.center, position, normal))

    if (this.points.length > 1) {
      let a = Mat4.getRotation(
        Mat4.targetTo(this.points[1].center, previousPoint.center, normal))
      let b = rotationBetweenPoints
      rotationBetweenPoints = Quat.slerp(a, b, 0.5)
    }

    let previousPointRotation = Mat4.getRotation(
      Mat4.targetTo(previousPoint.center, position, normal))

    let right = Vec3.fromValues(this._size, 0, 0)
    let left = Vec3.fromValues(-this._size, 0, 0)

    Vec3.add(previousPoint.center,
      Vec3.transformQuat(right, rotationBetweenPoints),
      point.rightPosition)
    Vec3.add(previousPoint.center,
      Vec3.transformQuat(left, rotationBetweenPoints),
      point.leftPosition)

    Vec3.add(position,
      Vec3.transformQuat(right, previousPointRotation),
      previousPoint.rightPosition)
    Vec3.add(position,
      Vec3.transformQuat(left, previousPointRotation),
      previousPoint.leftPosition)

    this.points.unshift(point);

    if (this.points.length > this.maxPoints) {
      this.points.splice(this.points.length - 1, 1)
    }

    return this
  }
}

class TrailPoint {
  rightPosition = Vec3.create()
  leftPosition = Vec3.create()

  constructor(public center: Float32Array, public distance = 0) {
    this.center = Vec3.copy(center)
  }
}

export class TrailShader extends MeshShader {
  createShaderGeometry(geometry: MeshGeometry3D) {
    let result = super.createShaderGeometry(geometry, false)
    let g = geometry as any
    if (g.distances) {
      result.addAttribute("a_Distance", new Buffer(g.distances.buffer),
        1, false, g.distances.componentType, g.distances.stride)
    }
    return result
  }
}

export class TrailMaterial extends Material {
  colorA = new Color(1, 1, 1)
  colorB = new Color(1, 1, 1)

  constructor() {
    super()
    this.doubleSided = true
  }

  updateUniforms(mesh: Mesh3D, shader: Shader) {
    shader.uniforms.u_ViewProjection = Camera.main.viewProjection
    shader.uniforms.u_ColorA = this.colorA.rgb
    shader.uniforms.u_ColorB = this.colorB.rgb
    shader.uniforms.u_Model = mesh.worldTransform.array
  }

  createShader() {
    return new TrailShader(Program.from(vert, frag))
  }
}

const vert = `
  attribute vec3 a_Position;
  attribute vec2 a_UV1;
  attribute float a_Distance;

  varying vec2 v_UV1;
  varying float v_Distance;

  uniform mat4 u_ViewProjection;
  uniform mat4 u_Model;

  void main() {
    v_Distance = a_Distance;
    v_UV1 = a_UV1;
    gl_Position = u_ViewProjection * u_Model * vec4(a_Position, 1.0);
  }
`

const frag = `
  varying vec2 v_UV1;
  varying float v_Distance;

  uniform vec3 u_ColorA;
  uniform vec3 u_ColorB;

  void main() {
    float alpha = 1.0 - v_Distance;
    vec3 color = mix(u_ColorA, u_ColorB, alpha);
    vec2 uv = vec2(v_UV1.x, fract(v_UV1.y));
    gl_FragColor = vec4(vec3(color) * alpha, alpha);
  }
`