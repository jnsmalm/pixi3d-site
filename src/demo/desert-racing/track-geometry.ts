import { MeshGeometry3D } from "pixi3d";
import type { Track } from "./track";

export const TrackGeometry = {
  create: (track: Track, halfSize = 1.5) => {

    let positions = []
    let uvs = []
    let resolution = 0.335

    for (let i = 0; i < track.totalDistance; i += resolution) {
      let percent1 = i / track.totalDistance
      let percent2 = (i + resolution) / track.totalDistance

      positions.push(...track.getPositionAtDistance(i + resolution > track.totalDistance ? 0 : i + resolution, new Float32Array([+halfSize, 0, 0])))
      uvs.push(1, percent2)

      positions.push(...track.getPositionAtDistance(i + resolution > track.totalDistance ? 0 : i + resolution, new Float32Array([-halfSize, 0, 0])))
      uvs.push(0, percent2)

      positions.push(...track.getPositionAtDistance(i, new Float32Array([-halfSize, 0, 0])))
      uvs.push(0, percent1)

      positions.push(...track.getPositionAtDistance(i, new Float32Array([-halfSize, 0, 0])))
      uvs.push(0, percent1)

      positions.push(...track.getPositionAtDistance(i, new Float32Array([+halfSize, 0, 0])))
      uvs.push(1, percent1)

      positions.push(...track.getPositionAtDistance(i + resolution > track.totalDistance ? 0 : i + resolution, new Float32Array([+halfSize, 0, 0])))
      uvs.push(1, percent2)
    }

    return Object.assign(new MeshGeometry3D(), {
      positions: {
        buffer: new Float32Array(positions)
      },
      uvs: [{
        buffer: new Float32Array(uvs)
      }]
    })
  }
}