const socket = io();

// Buttons
let btnCreate = document.querySelector('#createRoom');
let btnRooms = document.querySelector('#getRooms');

//Sections
let optionSection = document.querySelector('#options');
let showRoomSection = document.querySelector('#showRoom');
let createRoomSection = document.querySelector('#createRoom');
let roomJoinSection = document.querySelector('#roomJoin');

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
      }
    });

    roomItem.appendChild(joinButton);
    roomList.appendChild(roomItem);
  });

  showRoomSection.appendChild(roomList);
});

btnCreate.addEventListener('click', () => {
  hideSection(optionSection)
  socket.emit('createRoom');
});

socket.on('roomCreated', (roomId) => {
  console.log(`Room Created: ${roomId}`);
  toggleSection(createRoomSection)
  let roomText = document.querySelector('#roomText')
  roomText.innerHTML = `Room ID: <b>${roomId}</b>`;
  console.log(`A room has been created: ${roomId}`);
});

btnRooms.addEventListener('click', () => {
  socket.emit('getRooms');
  console.log('clicked');
});

socket.on('userJoined', (userId) => {
  const userItem = document.createElement('li');
  userItem.textContent = `User ID: ${userId} joined the room`;

  const userList = document.querySelector('.user-list');
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
