import { fileURLToPath } from 'url';
import path from 'path';
import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';
import fs from 'fs';
import Filter from 'bad-words';

// Quiz Bank;
const questions = JSON.parse(fs.readFileSync('./questions.json', 'utf8'));

console.log(questions)


const filter = new Filter();

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files from the 'client' directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, '..', 'client')));

const server = http.createServer(app);
const io = new Server(server);

const activeRooms = new Map();

app.get('/play', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'play', 'index.html'));
});

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

io.on('connection', (socket) => {
  console.log(`A ${socket.id} connected`);

  socket.on('createRoom', () => {
    const roomId = uuidv4();
    socket.join(roomId);
    activeRooms.set(roomId, true);
    console.log(`Room ${roomId} created`);
    io.to(roomId).emit('roomCreated', roomId);
  });

  socket.on('startQuiz', () => {
    io.emit('quizStarted', questions);
  });

  socket.on('getRooms', () => {
    console.log('Client requested room list');
    socket.emit('roomsList', Array.from(activeRooms.keys()));
  });

  socket.on('getQuestions', () => {
    socket.emit('questionsList', questions);
  });

  socket.on('answer', ({ roomId, answer }) => {
    console.log(`Received answer from ${socket.id} in room ${roomId}: ${answer}`);
  });


  socket.on('joinRoom', (roomId) => {
    if (activeRooms.has(roomId)) {
      socket.join(roomId);
      console.log(`${socket.id} joined room ${roomId}`);
      io.to(roomId).emit('userJoined', socket.id);
    } else {
      socket.emit('roomError', 'Invalid Room ID');
    }
  });

  socket.on('quitRoom', () => {
    const rooms = Object.keys(socket.rooms);
    const roomId = rooms.find(roomId => roomId !== socket.id);
    if (roomId && activeRooms.has(roomId)) {
      activeRooms.delete(roomId);
      console.log(`Room ${roomId} has been deleted`);
      io.emit('roomDeleted', roomId);
    }
  });

  socket.on('sendMessage', (roomId, studentId, messageContent) => {
    if (activeRooms.has(roomId)) {
      console.log(messageContent);
      const cleanMessage = filter.clean(messageContent);
      io.to(roomId).emit('message', studentId, cleanMessage);
    } else {
      socket.emit('roomError', 'Invalid Room ID');
    }
  });

  socket.on('disconnect', () => {
    console.log(`User ${socket.id} disconnected`);
    io.emit('userLeft', socket.id);
  });
});
