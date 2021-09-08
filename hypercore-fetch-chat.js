/*
global Event, EventTarget
*/

import LRU from './LRU.js'

const DEFAULT_NAME = 'Anonymous'
const DEFAULT_URL = 'hyper://blog.mauve.moe/'
const EXTENSION_NAME = 'hyperchat-example-1'
const EVENTS_FOLDER = '/$/extensions/'
const BROADCAST_DELAY = 3000

const CLOSED_STATE = 2

export class ErrorEvent extends Event {
  constructor (error) {
    super('error')
    this.error = error
  }
}

export class TextEvent extends Event {
  constructor (content, username, fromID) {
    super('text')
    this.content = content
    this.username = username
    this.fromID = fromID
  }
}

export class IdentityEvent extends Event {
  constructor (username, fromID) {
    super('identity')
    this.username = username
    this.fromID = fromID
  }
}

export default class Chat extends EventTarget {
  constructor (url = DEFAULT_URL, {
    fetch = globalThis.fetch,
    EventSource = globalThis.EventSource,
    extensionName = EXTENSION_NAME,
    username = DEFAULT_NAME
  } = {}) {
    super()
    this.fetch = fetch
    this.EventSource = EventSource
    this.url = url
    this.extensionName = extensionName
    this._username = username

    this.source = null

    this.seenMessages = new LRU()
    this.seenPeople = new LRU()
  }

  get eventsURL () {
    return new URL(EVENTS_FOLDER, this.url).href
  }

  get extensionURL () {
    return this.eventsURL + this.extensionName
  }

  get username () {
    return this._username
  }

  set username (newUsername) {
    this._username = newUsername
    this.broadcastIdentity()
  }

  async open () {
    if (this.source && this.source.readyState !== CLOSED_STATE) {
      throw new Error('Already opened')
    }

    // Start listening for extension events
    this.source = new this.EventSource(this.eventsURL)

    this.source.addEventListener(this.extensionName, (e) => this.onEvent(e))

    // Load up the extension
    await this.getPeers()

    // Wait a bit and then tell everybody we exist
    setTimeout(() => this.broadcastIdentity(), BROADCAST_DELAY)
  }

  async onEvent (e) {
    const { data, lastEventId: peerID } = e

    try {
      const parsed = JSON.parse(data)

      const { id, type, from: rawFrom, content, username } = parsed

      const fromID = rawFrom || peerID

      if (!id) throw new Error('No ID in message')

      if (this.seenMessages.has(id)) return

      this.seenMessages.track(id)

      if (type === 'text') {
        this.seenPeople.track(fromID)
        this.dispatchEvent(new TextEvent(content, username, fromID))
      } else if (type === 'identity') {
        // Ignore them if we've seen them before
        if (!this.seenPeople.has(fromID)) {
          this.seenPeople.track(fromID)
          // If they're new, we should tell them we exist
          await this.broadcastIdentity()
          this.dispatchEvent(new IdentityEvent(username, fromID))
        }
      } else {
        throw new Error('Invalid message type ' + type)
      }

      await this.broadcastMessage({ ...parsed, from: fromID })
    } catch (e) {
      this.onError(e)
    }
  }

  async getPeers () {
    const { fetch } = this
    const response = await fetch(this.extensionURL)

    await response.json()
  }

  async sendText (content) {
    const { username } = this
    await this.broadcastMessage({
      type: 'text',
      username,
      content
    })

    this.dispatchEvent(new TextEvent(content, username, 'local'))
  }

  async broadcastMessage (message) {
    if (!message.id) message.id = makeID()

    this.seenMessages.track(message.id)

    const { fetch } = this

    const response = await fetch(this.extensionURL, {
      method: 'POST',
      body: JSON.stringify(message)
    })

    await response.text()
  }

  async broadcastIdentity () {
    const { username } = this

    try {
      await this.broadcastMessage({
        type: 'identity',
        username
      })
    } catch (e) {
      this.onError(e)
    }
  }

  onError (e) {
    console.error(e.stack)
    this.dispatchEvent(new ErrorEvent(e))
  }

  async close () {
    if (this.source && this.source.readyState !== CLOSED_STATE) {
      this.source.close()
    }
  }
}

function makeID () {
  return new Uint8Array([
    Math.random() * 256,
    Math.random() * 256,
    Math.random() * 256,
    Math.random() * 256,
    Math.random() * 256,
    Math.random() * 256
  ]).join('')
}
