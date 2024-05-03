
const urlParams = new URLSearchParams(window.location.search);
const accountId = urlParams.get('user');
console.log(accountId);
if (!accountId) {
  window.location.href = 'http://localhost:3000/login';
}
const socket = io({
  query: {
    username: accountId,
  },
});

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
const chat = document.querySelector('#chat');
// Answer Buttons
const btnRed = document.querySelector('#btnRed');
const btnBlue = document.querySelector('#btnBlue');
const btnGreen = document.querySelector('#btnGreen');
const btnYellow = document.querySelector('#btnYellow');
const addFriendButton = document.querySelector('#addfriend');
const textBox1 = document.querySelector('#textBox1');
const textBox2 = document.querySelector('#textBox2');
console.log(addFriendButton);

const removeFriendButton = document.querySelector('#rmfriend');
let currentRoom = '';
let isHost = false;
let questionsLoaded = false;

let selectedOption = 'quiz-one';


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
        console.log('Joining Room: ', roomId);
        hideSection(optionSection);
        console.log(`Room Created: ${roomId}`);
        const roomText = document.querySelector('#roomText');
        currentRoom = roomId;
        roomText.innerHTML = `Room ID: <b>${roomId}</b>`;
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
  isHost = true;
});

btnRooms.addEventListener('click', () => {
  socket.emit('getRooms');
});

btnStart.addEventListener('click', () => {
  socket.emit('startQuiz', currentRoom, selectedOption);
  if (isHost && !questionsLoaded) {
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
  const userItems = document.querySelector('.user-list');
  const userItem = document.createElement('li');
  userItem.textContent = accountId + ' (YOU)';
  console.log(userItems);
  userItems.appendChild(userItem);
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

  setTimeout(() => {
    console.log('Time is up');
  }, 10000);
});

socket.on('userJoined', (userId, users) => {
  const userItems = document.querySelectorAll('.user-list li');
  const tabListItem = document.createElement('li');
  const userItem = document.createElement('li');
  const chatList = document.querySelector('#chatText');
  const message = `<b class="text-green-500">${getCurrentTime()} ${userId} joined the room</b> `;
  tabListItem.textContent = userId;
  userItem.innerHTML = message;
  const currentRoomUsers = [userId + ' (YOU)'];
  console.log(message);
  users = [userId, ...users];
  for (const item of userItems) {
    currentRoomUsers.push(item.textContent);
  }
  for (let user of users) {
    console.log('User: ', user);
    if (user === accountId) {
      user = user + ' (YOU)';
    }
    if (currentRoomUsers.includes(user)) {
      return;
    }
    const userListItem = document.createElement('li');
    userListItem.textContent = user;
    userList.appendChild(userListItem);
  }
  chatList.appendChild(userItem);
  console.log('User Joined: ', userId);
});

socket.on('userLeft', (userId) => {
  const userItems = document.querySelectorAll('.user-list li');
  userItems.forEach((item) => {
    if (item.textContent.includes(userId)) {
      item.remove();
    }
  });
  const userItem = document.createElement('li');
  const chatList = document.querySelector('#chatText');
  const message = `<b class="text-red-500">${getCurrentTime()} ${userId} has left the room</b> `;
  userItem.innerHTML = message;
  chatList.appendChild(userItem);
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

chat.addEventListener('submit', (event) => {
  event.preventDefault();
  const messageInput = document.querySelector('#chat textarea');
  const messageContent = messageInput.value.trim();
  if (messageContent !== '') {
    sendMessage(messageContent);
    messageInput.value = '';
  }
});
console.log(chat, 'Chat');
chat.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    const messageInput = document.querySelector('#chat textarea');
    const messageContent = messageInput.value.trim();
    if (messageContent !== '') {
      sendMessage(messageContent);
      messageInput.value = '';
    }
  }
});

socket.on('questionsList', (questions) => {
  console.log('recieved questions', questions);
  questionsLoaded = true; // Set questions loaded to true
  displayFirstQuestion(questions);
});

socket.on('question', (question) => {
  displayQuestion(question);
});

function displayQuestion(question) {
  const questionContainer = document.querySelector('#questionContainer');
  questionContainer.innerHTML = `<h2>${question.question_title}</h2>`;
  const optionsListElement = document.createElement('ul');
  btnRed.textContent = question.options[0];
  btnBlue.textContent = question.options[1];
  btnGreen.textContent = question.options[2];
  btnYellow.textContent = question.options[3];

  question.options.forEach((option) => {
    const optionItem = document.createElement('li');
    optionItem.textContent = option;
    optionItem.addEventListener('click', () => {
      socket.emit('answer', { roomId: currentRoom, answer: option });
    });
    optionsListElement.appendChild(optionItem);
  });
  questionContainer.appendChild(optionsListElement);
}

socket.on('correctAnswer', ({ questionIndex, correctOption }) => {
  console.log(`Question ${questionIndex + 1}: Correct option is ${correctOption}`);
  // const questionContainers = document.querySelectorAll('.question-container');
  // const currentQuestionContainer = questionContainers[questionIndex];
  // const options = currentQuestionContainer.querySelectorAll('li');

  // options.forEach((option, index) => {
  //   if (index === correctOption) {
  //     option.classList.add('correct-answer');
  //   }
  // });
});

// socket.on('wrongAnswer', ({ questionIndex, selectedOption, correctOption }) => {

//   const questionContainers = document.querySelectorAll('.question-container');
//   const currentQuestionContainer = questionContainers[questionIndex];
//   const options = currentQuestionContainer.querySelectorAll('li');

//   options.forEach((option, index) => {
//     if (index === selectedOption) {
//       option.classList.add('wrong-answer');
//     }
//     if (index === correctOption) {
//       option.classList.add('correct-answer');
//     }
//   });
// });

function sendMessage(message) {
  socket.emit('sendMessage', currentRoom, message);
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
  // Check if selectedOption is defined before using it
  if (selectedOption !== undefined && questions[selectedOption]) {
    const firstQuizQuestions = questions[selectedOption].questions;
    // Use firstQuizQuestions as needed
    if (isHost) {
      console.log("I'm a host");
      const questionTitleElement = document.createElement('h2');
      questionTitleElement.textContent = firstQuizQuestions[0].question_title;
      const questionContainer = document.querySelector('#questionContainer');
      questionContainer.innerHTML = ''; // Clear previous content
      questionContainer.appendChild(questionTitleElement);
    }

    if (!isHost) {
      console.log("I'm a student");
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
  } else {
    console.log('Selected option is undefined or does not exist in questions.');
  }
}


function displayFriends(friendsData) {
  const onlineFriendsList = document.getElementById('onlineFriends');
  const offlineFriendsList = document.getElementById('offlineFriends');
  onlineFriendsList.innerHTML = '';
  offlineFriendsList.innerHTML = '';
  friendsData.forEach((friend) => {
    const friendElement = document.createElement('div');
    friendElement.classList.add('friend');
    friendElement.textContent = friend.name;
    if (friend.online) {
      friendElement.classList.add('online');
      onlineFriendsList.appendChild(friendElement);
    } else {
      friendElement.classList.add('offline');
      offlineFriendsList.appendChild(friendElement);
    }
  });
}


addFriendButton.addEventListener('click', () => {
  textBox1.style.display = 'block';
  textBox2.style.display = 'none';
});

removeFriendButton.addEventListener('click', () => {
  textBox1.style.display = 'none';
  textBox2.style.display = 'block';
});


textBox1.addEventListener('keydown', async (event) => {
  if (event.key === 'Enter') {
    console.log('sending friend request');
    const friendName = textBox1.value;
    await sendFriendRequest(friendName);
    textBox1.value = '';
  }
});
textBox2.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    removeFriend(textBox2.value);
    textBox2.value = '';
  }
},
);


async function sendFriendRequest(username) {
  const response = await fetch('http://localhost:3000/api/sendfriendrequest/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ users: [accountId, username] }),
  });
  return response.ok;
}

async function removeFriend(username) {
  const response = await fetch('http://localhost:3000/api/removefriend/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ users: [accountId, username] }),
  });
  return response.ok;
}

async function acceptFriendRequest(username) {
  const response = await fetch('http://localhost:3000/api/acceptfriendrequest/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ users: [accountId, username] }),
  });
  return response.ok;
}

async function ignoreFriendRequest(username) {
  const response = await fetch('http://localhost:3000/api/ignorefriendrequest/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ users: [accountId, friendName] }),
  });
  return response.ok;
}

async function getFriends() {
  const response = await fetch('http://localhost:3000/api/friends/' + accountId, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.json();
}

async function getFriendRequests() {
  const response = await fetch('http://localhost:3000/api/friendrequests/' + accountId, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.json();
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch('/api/titles');

    if (!response.ok) {
      throw new Error('Failed to fetch quiz titles');
    }

    const data = await response.json();
    const quizTitles = data.quizTitles;

    const quizSelect = document.querySelector('#quizSelect');

    quizSelect.innerHTML = '';

    quizTitles.forEach(quiz => {
      const option = document.createElement('option');
      option.value = quiz.quizId;
      option.textContent = quiz.quizTitle;
      quizSelect.appendChild(option);
    });

    console.log('Quiz titles loaded successfully:', quizTitles);

    quizSelect.addEventListener('change', (event) => {
      selectedOption = event.target.value;
      console.log('Selected quiz ID:', selectedOption);
    });
  } catch (error) {
    console.error('Error fetching quiz titles:', error);
    alert('Failed to load quiz titles. Please try again later.');
  }
});

// socket.emit('selectQuiz', {roomId: currentRoom, quizTitle: selectedTitle });
