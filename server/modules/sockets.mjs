

import Filter from 'bad-words';
const filter = new Filter();
const activeRooms = new Map();
const roomMembers = {};
export function createRoom(socket, io) {
  let roomId = Math.floor(Math.random() * 900000) + 100000;
  socket.join(roomId);
  while (activeRooms.has(roomId)) {
    roomId = Math.floor(Math.random() * 900000) + 100000; // Generate a new room ID until it is unique
    // not using uuidv4 here because it generates a long string that is not user-friendly.
  }
  activeRooms.set(roomId, true);
  console.log(`Room ${roomId} created`);
  io.to(roomId).emit('roomCreated', roomId);
}


export function startQuiz(io, roomId, questions) {
  console.log(questions);
  const questionsList = questions['quiz-one'].questions;
  let questionIndex = 0;

  const sendQuestion = () => {
    const question = questionsList[questionIndex];
    io.to(roomId).emit('question', question);
    questionIndex++;

    if (questionIndex < questionsList.length) {
      setTimeout(sendQuestion, 5000); // Adjust the delay as needed
    }
  };
  sendQuestion(); // Start sending questions
}


export function getRooms(socket) {
  console.log('Client requested room list');
  socket.emit('roomsList', Array.from(activeRooms.keys()));
}

export function getQuestions(socket, questions) {
  socket.emit('questionsList', questions);
}

export function answer(socket, roomId, answer) {
  console.log(
    `Received answer from ${socket.id} in room ${roomId}: ${answer}`
  );
}

export function joinRoom(socket, roomId, io, username) {
  if (roomMembers[roomId].users.indexOf(username) === -1) {
    socket.emit('roomError', 'User already in room');
    return;
  }
  if (activeRooms.has(roomId)) {
    socket.join(roomId);
    console.log(`${username} joined room ${roomId}`);
    io.to(roomId).emit('userJoined', username);
    roomMembers[roomId].users.push(username);
  } else {
    socket.emit('roomError', 'Invalid Room ID');
  }
}

export function quitRoom(socket, io) {
  const rooms = Object.keys(socket.rooms);
  const roomId = rooms.find((roomId) => roomId !== socket.id);
  if (roomId && activeRooms.has(roomId)) {
    activeRooms.delete(roomId);
    console.log(`Room ${roomId} has been deleted`);
    io.emit('roomDeleted', roomId);
  }
}

export function sendMessage(socket, roomId, messageContent, io, username) {
  if (activeRooms.has(roomId)) {
    console.log(messageContent);
    const cleanMessage = filter.clean(messageContent);
    console.log('usernames', username, 'message', cleanMessage, 'room', roomId);
    io.to(roomId).emit('message', username, cleanMessage);
  } else {
    socket.emit('roomError', 'Invalid Room ID');
  }
}

export function disconnect(username, io) {
  console.log(`User ${username} disconnected`);
  io.emit('userLeft', username);
}
