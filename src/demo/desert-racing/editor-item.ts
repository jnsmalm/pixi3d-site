import { Color, Container3D, Model, PickingHitArea, StandardMaterial } from "pixi3d";
import type { EditorAsset } from "./editor";

export class EditorItem extends Container3D {
  private model: Model

  onSelected?: (item: EditorItem) => void

  get assetType() {
    return this.asset.type
  }

  constructor(public asset: EditorAsset) {
    super()
    this.model = this.addChild(Model.from(asset.gltf))
    this.model.scale.set(0.5)
    this.model.meshes.forEach(mesh => {
      mesh.renderSortOrder = 2;
      mesh.enableRenderPass("planar-shadows");
      (mesh.material as StandardMaterial).baseColorTexture = asset.texture
    })
    this.switchToGameMode()
  }

  switchToGameMode() {
    this.interactive = false
  }

  switchToEditorMode() {
    this.interactive = true
    if (!this.hitArea) {
      this.hitArea = PickingHitArea.fromObject(this.model)
      this.on("mouseover", e => {
        this.hoverOver()
      })
      this.on("mouseout", e => {
        this.hoverOut()
      })
      this.on("mousedown", e => {
        if (this.onSelected) {
          this.onSelected(this)
        }
      })
    }
  }

  hoverOver() {
    this.model.meshes.forEach(mesh => {
      (mesh.material as StandardMaterial).baseColor = new Color(1, 0, 1)
    })
  }

  hoverOut() {
    this.model.meshes.forEach(mesh => {
      (mesh.material as StandardMaterial).baseColor = new Color(1, 1, 1)
    })
  }
}