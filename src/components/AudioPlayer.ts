import type { Howl } from "howler";

export interface AudioPlayOptions {
  loop?: boolean,
  muteOnBlur?: boolean,
  volume?: number
}

export class AudioPlayer {
  private playing: { [name: string]: { id: number, muteOnBlur: boolean, volume: number } } = {}
  private howl: Howl
  private _masterVolume = 1

  get masterVolume() {
    return this._masterVolume
  }

  set masterVolume(value: number) {
    this._masterVolume = value
    for (let name in this.playing) {
      this.setVolume(name, this.playing[name].volume)
    }
  }

  constructor(howl: Howl) {
    this.howl = howl
    window.addEventListener("blur", e => {
      for (let name in this.playing) {
        if (this.playing[name].muteOnBlur) {
          this.howl.mute(true, this.playing[name].id)
        }
      }
    })
    window.addEventListener("focus", e => {
      for (let name in this.playing) {
        this.howl.mute(false, this.playing[name].id)
      }
    })
  }

  play(name: string, options: AudioPlayOptions = {}) {
    let { loop = false, volume = 1, muteOnBlur = false } = options
    let id = this.howl.play(name)
    this.howl.on("end", () => {
      if (!loop) delete this.playing[name]
    }, id)
    this.howl.loop(loop, id)
    this.playing[name] = { id, muteOnBlur, volume }
    this.setVolume(name, volume)
  }

  setVolume(name: string, volume: number) {
    if (this.playing[name]) {
      this.howl.volume(volume * this.masterVolume, this.playing[name].id)
      this.playing[name].volume = volume
    }
  }
}