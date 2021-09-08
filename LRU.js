export const DEFAULT_MAX_SIZE = 512

export default class LRU {
  constructor (maxSize = DEFAULT_MAX_SIZE) {
    this.maxSize = maxSize
    this.items = new Map()
  }

  has (value) {
    return this.items.has(value)
  }

  track (value) {
    const timestamp = Date.now()

    this.items.set(value, timestamp)

    if (this.isFull()) this.clearOldest()
  }

  get size () {
    return this.items.size
  }

  isFull () {
    return this.size >= this.maxSize
  }

  clearOldest () {

  }

  getOldest () {
    if (!this.size) return null
    let oldestTime = Date.now()
    let oldestValue = null

    for (const [value, timestamp] in this.items) {
      if (timestamp < oldestTime) {
        oldestTime = timestamp
        oldestValue = value
      }
    }

    return oldestValue
  }
}
