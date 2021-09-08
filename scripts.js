/*
global
localStorage,
*/

import Chat from './hypercore-fetch-chat.js'

const {
  urlPrompt,
  chatURLInput,
  inputForm,
  textInput,
  historyBox,
  messageTemplate,
  namePrompt,
  chatNameInput,
  nameChangeButton
} = window

let chat = null

displaySystem('Type a message below to send it to available peers')

if (localStorage.lastURL) {
  chatURLInput.value = localStorage.lastURL
}

if (localStorage.username) {
  updateName(localStorage.username)
} else {
  namePrompt.showModal()
}

urlPrompt.showModal()

nameChangeButton.addEventListener('click', () => {
  namePrompt.showModal()
})

namePrompt.addEventListener('close', () => {
  updateName(chatNameInput.value)
})

urlPrompt.addEventListener('close', async () => {
  const appURL = chatURLInput.value

  localStorage.lastURL = appURL

  displaySystem(`Connecting to ${appURL}`)

  chat = new Chat(localStorage.lastURL, {
    username: localStorage.username
  })

  await chat.open()

  chat.addEventListener('text', onText)
  chat.addEventListener('identity', onIdentity)

  function onText (e) {
    const { username, fromID, content } = e
    const formatted = formatUser(username, fromID)
    displayMessage(formatted, content, fromID)
  }

  function onIdentity (e) {
    const { username, fromID } = e
    const formatted = formatUser(username, fromID)
    displaySystem(`Saw new user ${formatted}`)
  }
})

inputForm.addEventListener('submit', (e) => {
  e.preventDefault()
  const content = textInput.value
  textInput.value = ''
  chat.sendText(content)
})

urlPrompt.showModal()

function displayMessage (username, text, additional = '') {
  console.log(username, text, additional)
  const messageElement = messageTemplate.content.cloneNode(true)

  messageElement.querySelector('.message-username').innerText = username
  messageElement.querySelector('.message-text').innerText = text

  if (additional) {
    messageElement.querySelector('.message').classList.add(`message-${additional}`)
  }

  historyBox.appendChild(messageElement)
}

function displaySystem(content) {
  displayMessage('System', content, 'system')
}

function updateName (username) {
  localStorage.username = username
  nameChangeButton.innerText = username
  chatNameInput.value = localStorage.username
  displaySystem(`Set your username to ${username}`)
  if (chat) chat.username = username
}

function formatUser (username, fromID) {
  return `${username}@${fromID.slice(0, 8)}`
}
