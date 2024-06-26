

import Filter from 'bad-words';
const filter = new Filter();
filter.addWords('leagueoflegends');
export const activeRooms = new Map();
export const roomMembers = {};

export function generateRoomId() {
  let roomId = Math.floor(Math.random() * 900000) + 100000;
  while (activeRooms.has(roomId)) {
    roomId = Math.floor(Math.random() * 900000) + 100000;
  }
  return roomId.toString();
}

export function createRoom(socket, io, username) {
  const roomId = generateRoomId();
  activeRooms.set(roomId, true);
  socket.join(roomId);
  roomMembers[roomId] = { users: [username] };

  // // console.log(`Room ${roomId} created`);
  io.to(roomId).emit('roomCreated', roomId);
}


export function startQuiz(io, roomId, questions, selectedQuizTitle) {
  const questionsList = questions[selectedQuizTitle].questions;
  let questionIndex = 0;

  const sendQuestion = () => {
    const question = questionsList[questionIndex];
    io.to(roomId).emit('question', question);
    questionIndex++;

    if (questionIndex < questionsList.length) {
      setTimeout(sendQuestion, 10000); // Adjust the delay as needed
    }
  };
  sendQuestion(); // Start sending questions
}


export function getRooms(socket) {
  // console.log('Client requested room list');
  // console.log('Active rooms:', activeRooms);
  socket.emit('roomsList', Array.from(activeRooms.keys()));
}

export function getQuestions(socket, questions) {
  socket.emit('questionsList', questions);
}

export function answer(socket, roomId, answer) {
  console.log(
    `Received answer from ${socket.id} in room ${roomId}: ${answer}`,
  );
}

export function joinRoom(socket, roomId, io, username) {
  // console.log('Joining room with ID', roomId, 'and username', username);
  if (roomMembers[roomId] === undefined && activeRooms.has(roomId)) {
    roomMembers[roomId] = { users: [] };
    // console.log('Room members initialized for room', roomId);
  }
  if (activeRooms.has(roomId) === false) {
    socket.emit('roomError', 'Invalid Room ID');
    // console.log('Invalid Room ID provided by user'); // Log the error
    return;
  }
  // console.log('Room member already exists is ', roomMembers[roomId].users.indexOf(username) !== -1);
  if (roomMembers[roomId].users.indexOf(username) !== -1) {
    socket.emit('roomError', 'User already in room');
    // console.log('User already in room');
    return;
  }
  if (activeRooms.has(roomId)) {
    socket.join(roomId);
    // console.log(`${username} joined room ${roomId}`);
    io.to(roomId).emit('userJoined', username, roomMembers[roomId].users);
    roomMembers[roomId].users.push(username);
    // console.log('Room members:', roomMembers[roomId].users);
  } else {
    socket.emit('roomError', 'Invalid Room ID');
  }
}

export function deleteRoom(socket, io) {
  const rooms = Object.keys(socket.rooms);
  const roomId = rooms.find((roomId) => roomId !== socket.id);
  if (roomId && activeRooms.has(roomId)) {
    activeRooms.delete(roomId);
    // console.log(`Room ${roomId} has been deleted`);
    io.emit('roomDeleted', roomId);
  }
}

export function sendMessage(socket, io, roomId, messageContent, username) {
  if (activeRooms.has(roomId)) {
    messageContent = filter.clean(messageContent);
    io.to(roomId).emit('message', username, messageContent);
  } else {
    socket.emit('roomError', 'Invalid Room ID');
    // console.log('Invalid Room ID provided by user');
  }
}

export function disconnect(username, io) {
  // console.log(`User ${username} disconnected`);
  io.emit('userLeft', username);
}
