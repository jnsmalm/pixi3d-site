import { DRAW_MODES } from "pixi.js";
import { Camera, Container3D, Material, Mesh3D, MeshGeometry3D } from "pixi3d";

export class Grid extends Container3D {
  private _mesh: Mesh3D

  constructor() {
    super()

    let material = Material.from(vert, frag, (mesh, shader) => {
      shader.uniforms.u_ViewProjection = Camera.main.viewProjection.array
      shader.uniforms.u_Model = mesh.worldTransform.array
    })
    material.drawMode = DRAW_MODES.LINES
    material.state.depthTest = false

    this._mesh = this.addChild(new Mesh3D(
      GridGeometry.createGrid(), material))
  }
}

export class GridMaterial extends Material {
  constructor() {
    super()
    this.drawMode = DRAW_MODES.LINES
  }
}

export namespace GridGeometry {
  export function createGrid() {
    let positions: number[] = []
    let segements = 100
    for (let i = 0; i < segements; i++) {
      positions.push(-(segements - 1) / 2 + i, 0, -segements / 2)
      positions.push(-(segements - 1) / 2 + i, 0, segements / 2)
      positions.push(-segements / 2, 0, 0 - (segements - 1) / 2 + i)
      positions.push(segements / 2, 0, 0 - (segements - 1) / 2 + i)
    }
    let geometry = new MeshGeometry3D()
    geometry.positions = {
      buffer: new Float32Array(positions)
    }
    return geometry
  }
}

const vert = `
attribute vec3 a_Position;

uniform mat4 u_ViewProjection;
uniform mat4 u_Model;

void main() {
  gl_Position = u_ViewProjection * u_Model * vec4(a_Position, 1.0);
}
`

const frag = `
void main() {
  gl_FragColor = vec4(1, 1, 1, 1);
}
`