/* global localStorage */

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

displayMessage('System', 'Type a message below to send it to available peers', 'system')

if (localStorage.lastURL) {
  chatURLInput.value = localStorage.lastURL
}

if (localStorage.username) {
  updateName(localStorage.username)
} else {
  namePrompt.showModal()
}

nameChangeButton.addEventListener('click', () => {
  namePrompt.showModal()
})

namePrompt.addEventListener('close', () => {
  updateName(chatNameInput.value)
})

urlPrompt.addEventListener('close', () => {
  const appURL = chatURLInput.value
  console.log('Connecting to', appURL)

  localStorage.lastURL = appURL
})

inputForm.addEventListener('submit', (e) => {
  e.preventDefault()
  const text = textInput.value
  textInput.value = ''
  displayMessage(localStorage.username, text, 'self')
})

urlPrompt.showModal()

function displayMessage (username, text, additional = '') {
  const messageElement = messageTemplate.content.cloneNode(true)

  messageElement.querySelector('.message-username').innerText = username
  messageElement.querySelector('.message-text').innerText = text

  if (additional) {
    messageElement.querySelector('.message').classList.add(`message-${additional}`)
  }

  historyBox.appendChild(messageElement)
}

function updateName (username) {
  localStorage.username = username
  nameChangeButton.innerText = username
  chatNameInput.value = localStorage.username
  displayMessage('System', `Set your username to ${username}`, 'system')
}
