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
import * as accounts from './modules/accounts.mjs';
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

const socketToUser = new Map();

app.post('/api/createquiz', createQuiz);
app.post('/api/sendfriendrequest', (req, res) => {
  console.log(req.body);
  const [from, to] = req.body.fr;
  console.log('[FRIENDS]: friend request sending from', from, 'to', to);
  accounts.sendFriendRequest(res, from, to);
});
app.post('/api/acceptfriendrequest', (req, res) => {
  const [from, to] = req.body;
  console.log('[FRIENDS]: accepting friend request from', from, 'to', to, 'on server side');
  accounts.acceptFriendRequest(res, from, to);
});
app.post('/api/ignorefriendrequest', (req, res) => {
  const [from, to] = req.body;
  console.log('[FRIENDS]: ignoring friend request from', from, 'to', to, 'on server side');
  accounts.ignoreFriendRequest(res, from, to);
});
app.post('/api/removefriend', (req, res) => {
  const [from, to] = req.body;
  console.log('[FRIENDS]: removing friend from', from, 'to', to, 'on server side');
  accounts.removeFriend(res, from, to);
});
app.get('/api/friends/:userId', (req, res) => {
  const username = req.params.userId;
  console.log('[FRIENDS]: getting friends for', username);
  accounts.getFriends(res, username);
});
app.post('/api/friendrequests', (req, res) => {
  const username = req.body;
  console.log('[FRIENDS]: getting friend requests for', username);
  accounts.getFriendRequests(res, username);
});
app.post('/api/leaderboard', (req, res) => {
  console.log('[LEADERBOARD]: getting leaderboard');
  accounts.getLeaderboard(res);
});
app.post('/api/login', (req, res) => {
  const { username, password } = req.body; // Destructure the username and password from the request body
  accounts.login(res, username, password); // Call the login function from accounts.mjs
});
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  accounts.register(res, username, password); // Call the register function from accounts.mjs
});
app.post('/api/activeusers', (req, res) => {
  res.json(Array.from(socketToUser.values()));
});
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

io.on('connection', (socket) => { // socket event listeners
  console.log(`A ${socket.id} connected`);
  const username = socket.handshake.query.username;
  console.log(socket.handshake.query);
  if (username) {
    socketToUser.set(socket.id, username);
  } else {
    socket.disconnect(true); // we disconnect if we dont get a username
  }
  console.log(socketToUser);
  socket.on('createRoom', () => {
    rooms.createRoom(socket, io, socketToUser.get(socket.id));
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
    rooms.joinRoom(socket, roomId, io, socketToUser.get(socket.id));
  });

  socket.on('quitRoom', () => {
    rooms.quitRoom(socket, io);
  });

  socket.on('sendMessage', (roomId, messageContent) => {
    rooms.sendMessage(socket, roomId, messageContent, io, socketToUser.get(socket.id));
  });

  socket.on('disconnect', () => {
    rooms.disconnect(socketToUser.get(socket.id), io);
    socketToUser.delete(socket.id);
  });
});
