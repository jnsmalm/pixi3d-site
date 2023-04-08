import { Container, Texture } from "pixi.js";
import { Camera, CameraOrbitControl, Container3D, glTFAsset, Plane, Point3D, Vec3 } from "pixi3d";
import { EditorItem } from "./editor-item";

import Data from "./level.json"

export interface EditorAsset {
  type: string
  visibiltyDistance: number
  gltf: glTFAsset
  texture: Texture
}

export class Editor extends Container {
  private assets: EditorAsset[] = []
  private itemContainer: Container3D
  private assetIndex = -1
  private currentItem?: EditorItem
  private cursorX = 0
  private cursorY = 0
  private _visibleObjectsCount = 0
  private editMode = false

  get visibleObjectsCount() {
    return this._visibleObjectsCount
  }

  constructor(private control: CameraOrbitControl) {
    super()
    this.itemContainer = this.addChild(new Container3D())

    let rotationY = 0
    let scale = 1

    document.addEventListener("keydown", e => {
      if (e.key === "w") {
        this.selectNextAsset()
      }
      if (e.key === "a") {
        this.currentItem?.rotationQuaternion.setEulerAngles(0, rotationY -= 10, 0)
      }
      if (e.key === "d") {
        this.currentItem?.rotationQuaternion.setEulerAngles(0, rotationY += 10, 0)
      }
      if (e.key === "x") {
        this.currentItem?.scale.set(scale += 0.1)
      }
      if (e.key === "z") {
        this.currentItem?.scale.set(scale -= 0.1)
      }
      if (e.key === "q") {
        if (this.currentItem) {
          this.currentItem.destroy()
        }
        this.currentItem = undefined
      }
      if (e.key === "c") {
        this.copyToClipboard()
      }
      if (e.key === "l") {
        this.loadData()
      }
      if (e.key === "e") {
        this.switchToEditorMode()
      }
      if (e.key === "g") {
        this.switchToGameMode()
      }
      if (e.key === "s") {
        this.positionControlTargetCursor(this.cursorX, this.cursorY)
      }
    })
    document.addEventListener("mousemove", e => {
      this.cursorX = e.x
      this.cursorY = e.y
      this.positionCurrentItemAtCursor(e.x, e.y)
    })
    document.addEventListener("dblclick", e => {
      if (!this.editMode) {
        return
      }
      if (!this.currentItem) {
        this.positionControlTargetCursor(e.x, e.y)
      } else {
        this.placeCurrentItem()
      }
    })
    this.switchToGameMode()
  }

  setVisiblityForObjects(target: { x: number, y: number, z: number }) {
    let targetPosition = Vec3.fromValues(target.x, target.y, target.z)
    this._visibleObjectsCount = 0
    this.itemContainer.children.forEach(item => {
      let object = item as EditorItem
      let asset = this.assets.find(asset => asset.type === object.assetType)
      let distance = Vec3.squaredDistance(object.worldTransform.position.array, targetPosition)
      object.renderable = distance < asset!.visibiltyDistance || this.editMode
      if (object.renderable) {
        this._visibleObjectsCount++
      }
    })
  }

  copyToClipboard() {
    let data = this.itemContainer.children.map(child => {
      let item = child as EditorItem
      return {
        type: item.assetType,
        position: { x: item.position.x, y: item.position.y, z: item.position.z },
        rotation: {
          x: item.rotationQuaternion.x,
          y: item.rotationQuaternion.y,
          z: item.rotationQuaternion.z,
          w: item.rotationQuaternion.w
        },
        scale: item.scale.x
      }
    })
    navigator.clipboard.writeText(JSON.stringify(data, undefined, 2));
  }

  getGroundPosition(screenX: number, screenY: number) {
    let plane = new Plane(new Point3D(0, 1, 0), 0)
    let ray = Camera.main.screenToRay(screenX, screenY)
    if (ray) {
      let distance = plane.rayCast(ray)
      return ray.getPoint(distance)
    }
    return undefined
  }

  positionControlTargetCursor(x: number, y: number) {
    let position = this.getGroundPosition(x, y)?.array
    if (position) {
      this.control.target = {
        x: position[0], y: position[1], z: position[2]
      }
    }
  }

  positionCurrentItemAtCursor(x: number, y: number) {
    let position = this.getGroundPosition(x, y)?.array
    if (position && this.currentItem) {
      this.currentItem.position.array = position
    }
  }

  onItemSelected(item: EditorItem) {
    if (this.currentItem === item) {
      return
    }
    this.currentItem = item
  }

  placeCurrentItem() {
    if (this.currentItem === undefined) {
      return
    }
    this.currentItem = this.itemContainer.addChild(new EditorItem(this.currentItem.asset))
    this.currentItem.onSelected = (item) => {
      this.onItemSelected(item)
    }
  }

  selectNextAsset() {
    if (this.currentItem) {
      this.currentItem.destroy()
    }
    this.assetIndex = (this.assetIndex + 1) % this.assets.length
    let asset = this.assets[this.assetIndex]
    this.currentItem = this.itemContainer.addChild(new EditorItem(asset))
    this.currentItem.onSelected = (item) => {
      this.onItemSelected(item)
    }
  }

  switchToGameMode() {
    this.itemContainer.children.forEach(child => {
      (child as EditorItem).switchToGameMode()
    })
    this.control.allowControl = false
    this.editMode = false
    Camera.main.orthographic = true
  }

  switchToEditorMode() {
    this.itemContainer.children.forEach(child => {
      (child as EditorItem).switchToEditorMode()
    })
    this.control.allowControl = true
    this.editMode = true
    Camera.main.orthographic = false
  }

  loadData() {
    this.itemContainer.children.forEach(c => c.destroy())
    for (let obj of Data) {
      let asset = this.assets.find(a => a.type === obj.type)
      let item = this.itemContainer.addChild(new EditorItem(asset!))
      item.onSelected = (item) => {
        this.onItemSelected(item)
      }
      item.position.set(obj.position.x, obj.position.y, obj.position.z)
      item.rotationQuaternion.set(
        obj.rotation.x, obj.rotation.y, obj.rotation.z, obj.rotation.w)
      item.scale.set(obj.scale)
    }
  }

  addAsset(type: string, gltf: glTFAsset, visibiltyDistance = 150, texture?: Texture) {
    if (!texture) {
      texture = Texture.from("/textures/desert-racing-environments.png")
    }
    this.assets.push({
      gltf,
      type,
      visibiltyDistance,
      texture
    })
  }
}