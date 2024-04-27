

import Filter from 'bad-words';
const filter = new Filter();
const activeRooms = new Map();

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

export function joinRoom(socket, roomId, io) {
  if (activeRooms.has(roomId)) {
    socket.join(roomId);
    console.log(`${socket.id} joined room ${roomId}`);
    io.to(roomId).emit('userJoined', socket.id);
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

export function sendMessage(socket, roomId, studentId, messageContent, io) {
  if (activeRooms.has(roomId)) {
    console.log(messageContent);
    const cleanMessage = filter.clean(messageContent);
    io.to(roomId).emit('message', studentId, cleanMessage);
  } else {
    socket.emit('roomError', 'Invalid Room ID');
  }
}

export function disconnect(socket, io) {
  console.log(`User ${socket.id} disconnected`);
  io.emit('userLeft', socket.id);
}
