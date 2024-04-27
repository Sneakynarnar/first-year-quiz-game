import { fileURLToPath } from 'url';
import path from 'path';
import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';
import fs from 'fs';

import { createQuiz } from './modules/quizes.mjs';
import { login, register } from './modules/accounts.mjs';
import * as rooms from './modules/sockets.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url)); // Get the directory name of the current module
// Quiz Bank;
const questions = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, '..', 'server', 'questions.json'),
    'utf8',
  ),
);
console.log(questions);
dotenv.config(); // Load the environment variables
const app = express(); 
const port = process.env.PORT || 3000; // Set the port to the environment variable PORT or 3000
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Parse JSON bodies MIDDLEWARE
app.use(express.static(path.join(__dirname, '..', 'public'))); // Serve the public directory

const server = http.createServer(app);
const io = new Server(server);


app.post('/api/createquiz', createQuiz);
app.post('/api/login', (req, res) => {
  const { username, password } = req.body; // Destructure the username and password from the request body
  login(res, username, password); // Call the login function from accounts.mjs
});
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  register(res, username, password); // Call the register function from accounts.mjs
});

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

io.on('connection', (socket) => { // socket event listeners
  console.log(`A ${socket.id} connected`);

  socket.on('createRoom', () => {
    rooms.createRoom(socket, io);
  });

  socket.on('startQuiz', (roomId) => {
    rooms.startQuiz(io, roomId, questions);
  });

  socket.on('getRooms', () => {
    rooms.getRooms(socket);
  });

  socket.on('getQuestions', () => {
    rooms.getQuestions(socket, questions);
  });

  socket.on('answer', ({ roomId, answer }) => {
    rooms.answer(socket, roomId, answer);
  });

  socket.on('joinRoom', (roomId) => {
    rooms.joinRoom(socket, roomId, io);
  });

  socket.on('quitRoom', () => {
    rooms.quitRoom(socket, io);
  });

  socket.on('sendMessage', (roomId, studentId, messageContent) => {
    rooms.sendMessage(socket, roomId, studentId, messageContent, io);
  });

  socket.on('disconnect', () => {
    rooms.disconnect(socket, io);
  });
});
