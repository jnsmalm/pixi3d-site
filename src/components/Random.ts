export namespace Random {
  export function integer(min: number, max: number) {
    return Math.floor(Math.random() * max) + min
  }
}