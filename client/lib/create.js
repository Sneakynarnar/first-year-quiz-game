const socket = io();

// Buttons
const btnCreate = document.querySelector('#createRoom');
const btnRooms = document.querySelector('#getRooms');
const btnStart = document.querySelector('#startQuiz');
// Sections
const userList = document.querySelector('.user-list');
const optionSection = document.querySelector('#options');
const showRoomSection = document.querySelector('#showRoom');
const createRoomSection = document.querySelector('#createRoom');
const playAreaSection = document.querySelector('#playArea');

let currentRoom = '';
let isTeacher = false;
let questionsLoaded = false;

function hideSection(section) {
  section.classList.add('hidden');
}

function toggleSection(section) {
  section.classList.remove('hidden');
}

socket.on('roomsList', (rooms) => {
  console.log(`Available Rooms: ${rooms}`);

  showRoomSection.innerHTML = '';

  if (rooms.length === 0) {
    showRoomSection.textContent = 'No active rooms found.';
    return;
  }

  const roomList = document.createElement('ul');

  rooms.forEach(roomId => {
    const roomItem = document.createElement('li');
    roomItem.textContent = `Room ID: ${roomId}`;

    const joinButton = document.createElement('button');
    joinButton.textContent = 'Join';
    joinButton.classList.add('joinRoom');

    roomItem.addEventListener('click', (event) => {
      if (event.target.classList.contains('joinRoom')) {
        socket.emit('joinRoom', roomId);
        currentRoom = roomId;
      }
    });

    roomItem.appendChild(joinButton);
    roomList.appendChild(roomItem);
  });

  showRoomSection.appendChild(roomList);
});

btnCreate.addEventListener('click', () => {
  hideSection(optionSection);
  socket.emit('createRoom');
  isTeacher = true;
});

btnRooms.addEventListener('click', () => {
  socket.emit('getRooms');
});

btnStart.addEventListener('click', () => { 
  socket.emit('startQuiz')
  if (isTeacher && !questionsLoaded) { 
    socket.emit('getQuestions');
  }
});

socket.on('roomCreated', (roomId) => {
  console.log(`Room Created: ${roomId}`);
  toggleSection(createRoomSection);
  const roomText = document.querySelector('#roomText');
  currentRoom = roomId;
  roomText.innerHTML = `Room ID: <b>${roomId}</b>`;
  console.log(`A room has been created: ${roomId}`);
});

socket.on('message', (id, messageContent) => {
  const messageItem = document.createElement('li');
  const chatList = document.querySelector('#chatText');
  const message = `<b class="text-blue-500">${getCurrentTime()}</b> – (${id}): ${messageContent}`;
  messageItem.innerHTML = message;
  console.log(message);
  chatList.appendChild(messageItem);
});

socket.on('quizStarted', (questions) => {
  console.log('Quiz Started');
  displayFirstQuestion(questions);
})

socket.on('userJoined', (userId) => {
  const userItem = document.createElement('li');
  userItem.textContent = `User ID: ${userId} joined the room`;
  userList.appendChild(userItem);
});

socket.on('userLeft', (userId) => {
  const userItems = document.querySelectorAll('.user-list li');
  userItems.forEach((item) => {
    if (item.textContent.includes(userId)) {
      item.remove();
    }
  });
});

socket.on('roomDeleted', (roomId) => {
  const roomItems = document.querySelectorAll('#showRoom li');
  roomItems.forEach((item) => {
    if (item.textContent.includes(roomId)) {
      item.remove();
    }
  });
});

document.querySelector('#quitRoom').addEventListener('click', () => {
  socket.emit('quitRoom');
  console.log('Quit Roomed');
});

document.querySelector('#chat').addEventListener('submit', (event) => {
  event.preventDefault();
  
  const messageInput = document.querySelector('#chat textarea');
  const messageContent = messageInput.value.trim();

  if (messageContent !== '') {
    sendMessage(messageContent);

    messageInput.value = '';
  }
});

socket.on('questionsList', (questions) => {
  console.log('recieved questions', questions)
  questionsLoaded = true; // Set questions loaded to true
  displayFirstQuestion(questions);
});

socket.on('correctAnswer', ({ questionIndex, correctOption }) => {
  const questionContainers = document.querySelectorAll('.question-container');
  const currentQuestionContainer = questionContainers[questionIndex];
  const options = currentQuestionContainer.querySelectorAll('li');

  options.forEach((option, index) => {
    if (index === correctOption) {
      option.classList.add('correct-answer');
    }
  });
});

socket.on('wrongAnswer', ({ questionIndex, selectedOption, correctOption }) => {
  const questionContainers = document.querySelectorAll('.question-container');
  const currentQuestionContainer = questionContainers[questionIndex];
  const options = currentQuestionContainer.querySelectorAll('li');

  options.forEach((option, index) => {
    if (index === selectedOption) {
      option.classList.add('wrong-answer');
    }
    if (index === correctOption) {
      option.classList.add('correct-answer');
    }
  });
});

function sendMessage(message) {
  socket.emit('sendMessage', currentRoom, socket.id, message);
}

function getCurrentTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

document.querySelector('#btnRed').addEventListener('click', () => {
  socket.emit('answer', { roomId: currentRoom, answer: 'Red' });
});

function displayFirstQuestion(questions) {
  const firstQuizQuestions = questions['quiz-one'].questions;

  if (isTeacher) {
    console.log('im a teacher');
    const questionTitleElement = document.createElement('h2');
    questionTitleElement.textContent = firstQuizQuestions[0].question_title;
    const questionContainer = document.querySelector('#questionContainer');
    questionContainer.innerHTML = ''; // Clear previous content
    questionContainer.appendChild(questionTitleElement);
  }

  if (!isTeacher) {
    console.log('im not a teacher')
    const optionsList = firstQuizQuestions[0].options;
    const optionsListElement = document.createElement('ul');

    optionsList.forEach((option, index) => {
      const optionItem = document.createElement('li');
      optionItem.textContent = option;
      optionItem.addEventListener('click', () => {
        socket.emit('answer', { roomId: currentRoom, answer: option });
      });
      optionsListElement.appendChild(optionItem);
    });

    const questionContainer = document.querySelector('#questionContainer');
    questionContainer.innerHTML = ''; 
    questionContainer.appendChild(optionsListElement);
  }
}