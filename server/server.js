import { fileURLToPath } from 'url';
import path from 'path';
import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';
import fs from 'fs';

import { login, register } from './accounts.mjs';
import * as rooms from './sockets.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Quiz Bank;
const questions = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, '..', 'server', 'questions.json'),
    'utf8',
  ),
);
console.log(questions);
dotenv.config();
const app = express();
const port = process.env.PORT || 3000;
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files from the 'client' directory
app.use(express.static(path.join(__dirname, '..', 'client')));

const server = http.createServer(app);
const io = new Server(server);


app.post('/api/createquiz', (req, res) => {
  const quiz = req.body; // The quiz object should be in the format { 'quiz-name': { 'question': 'answer' } }
  console.log('Received quiz: ', quiz);
  const [quizName, quizQuestions] = Object.entries(quiz)[0]; // Destructure the quiz object
  console.log('THESE ARE THE ENTRIES', Object.entries(quiz));
  fs.readFile('./questions.json', (err, data) => { //
    if (err) {
      console.error(err);
      return;
    }
    const questions = JSON.parse(data); //
    const quizId = uuidv4(); // Generate a unique ID for the quiz
    // console.log(quizName);
    questions[quizId] = { 'quiz-title': quizName, 'questions': quizQuestions }; //
    fs.writeFile('./questions.json', JSON.stringify(questions), (err) => {
      if (err) {
        console.error(err);
        return;
      }
      res.json({ id: quizId }); // Send the quiz ID back to the client
    });
  });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body; // Destructure the username and password from the request body
  login(res, username, password); // Call the login function from accounts.mjs
});

app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  register(res, username, password); // Call the register function from accounts.mjs
});
app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'login', 'index.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'register', 'index.html'));
});

app.get('/play', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'play', 'index.html'));
});

app.get('/createquiz', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'createquiz', 'index.html'));
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
