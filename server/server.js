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

console.log(questions);


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
app.post('/api/createquiz', (req, res) => {
  const quiz = req.body;
  console.log('Received quiz: ', quiz);
  const [quizName, quizQuestions] = Object.entries(quiz)[0];
  console.log('THESE ARE THE ENTRIES', Object.entries(quiz));
  fs.readFile('./questions.json', (err, data) => {
    if (err) {
      console.error(err);
      return;
    }
    const questions = JSON.parse(data);
    const quizId = uuidv4();
    // console.log(quizName);
    questions[quizId] = { 'quiz-title': quizName, 'questions': quizQuestions };
    fs.writeFile('./questions.json', JSON.stringify(questions), (err) => {
      if (err) {
        console.error(err);
        return;
      }
      res.json({ id: quizId });
    });
  });
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

io.on('connection', (socket) => {

  console.log(`A ${socket.id} connected`);

  socket.on('createRoom', () => {
    const roomId = uuidv4(); // I would use a random number generator for this for a more readable room id
    socket.join(roomId);
    activeRooms.set(roomId, true);
    console.log(`Room ${roomId} created`);
    io.to(roomId).emit('roomCreated', roomId);
  });

  socket.on('startQuiz', (roomId) => {
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
