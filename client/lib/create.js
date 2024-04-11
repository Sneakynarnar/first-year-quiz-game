const socket = io();

let btnCreate = document.querySelector('#createRoom');
let btnRooms = document.querySelector('#getRooms');
let showRoomSection = document.querySelector('#showRoom');

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

    // Event delegation for dynamically created join buttons
    roomItem.addEventListener('click', (event) => { 
      if (event.target.classList.contains('joinRoom')) {
        socket.emit('joinRoom', roomId);
        window.location.href = socket.io.uri + `/room/${roomId}`; 
      }
    });

    roomItem.appendChild(joinButton);
    roomList.appendChild(roomItem);
  });

  showRoomSection.appendChild(roomList);
});

btnCreate.addEventListener('click', () => {
    socket.emit('createRoom');
});

socket.on('roomsCreated', (roomId) => {
    console.log(`Room Created: ${roomId}`)
});

btnRooms.addEventListener('click', () => {
    socket.emit('getRooms');
    console.log('clicked');
});

socket.on('redirect', (url) => {
    window.location.href = url;
})

joinButton.addEventListener('click', () => {
    socket.emit('joinRoom', roomId);

    window.location.href = socket.io.uri + `/room/${roomId}`;
});
