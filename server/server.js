import { fileURLToPath } from 'url';
import path from 'path';
import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'fs';
import { storeQuiz } from './modules/quizes.mjs';
import * as accounts from './modules/accounts.mjs';
import * as rooms from './modules/sockets.mjs';
import * as quiz from './modules/quizes.mjs';
const __dirname = path.dirname(fileURLToPath(import.meta.url)); // Get the directory name of the current module
// Quiz Bank;
const questions = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, '..', 'server', 'questions.json'),
    'utf8',
  ),
);
dotenv.config(); // Load the environment variables
const app = express();
const port = process.env.PORT || 3000; // Set the port to the environment variable PORT or 3000
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Parse JSON bodies MIDDLEWARE
app.use(express.static(path.join(__dirname, '..', 'public'))); // Serve the public directory

const server = http.createServer(app);
const io = new Server(server);
export const socketToUser = new Map();

app.get('/api/questions', (req, res) => {
  let questions;
  req.query.count = req.query.count || 10;
  if (req.query.category) {
    questions = quiz.getQuestions(req.query.count, req.query.category);
  } else {
    questions = quiz.getRandomQuestions(req.query.count);
  }
  res.status(200).json(questions);
});

app.get('/api/allquestions', (req, res) => {
  quiz.getQuestions().then((questions) => {
    res.status(200).json(questions);
  });
});

app.post('/api/createquiz', (req, res) => {
  const quizCreated = storeQuiz(req.body);
  if (quizCreated) {
    res.status(200).json('Quiz created successfully');
  } else {
    res.status(400).json('Quiz creation failed');
  }
});

app.post('/api/sendfriendrequest', async (req, res) => {
  console.log(req.body);
  const [from, to] = req.body.fr;
  console.log('[FRIENDS]: friend request sending from', from, 'to', to);
  const status = await accounts.sendFriendRequest(res, from, to);
  if (status === 'Success') {
    res.status(200).json('Friend request sent');
  } else {
    res.status(400).send(status);
  }
});
app.post('/api/acceptfriendrequest', async (req, res) => {
  const [from, to] = req.body.users;
  console.log('[FRIENDS]: accepting friend request from', from, 'to', to, 'on server side');
  const status = await accounts.acceptFriendRequest(res, from, to);
  if (status === 'Success') {
    res.status(200).send('Friend request accepted');
  } else {
    res.status(400).send(status);
  }
});
app.post('/api/ignorefriendrequest', async (req, res) => {
  const [from, to] = req.body.users;
  console.log('[FRIENDS]: ignoring friend request from', from, 'to', to, 'on server side');
  await accounts.ignoreFriendRequest(res, from, to);
});
app.post('/api/removefriend', async (req, res) => {
  const [from, to] = req.body.users;
  console.log('[FRIENDS]: removing friend from', from, 'to', to, 'on server side');
  const status = await accounts.removeFriend(res, from, to);
  if (status === 'Success') {
    res.status(200).send('Friend removed');
  } else {
    res.status(400).send(status);
  }
});
app.get('/api/friends/:userId', async (req, res) => {
  const username = req.params.userId;
  console.log('[FRIENDS]: getting friends for', username);
  const friends = formatFriends(await accounts.getFriends(username));
  res.status(200).json({ friends });
});
app.post('/api/friendrequests', async (req, res) => {
  const username = req.body;
  console.log('[FRIENDS]: getting friend requests for', username);
  await accounts.getFriendRequests(res, username);
});
app.post('/api/leaderboard', async (req, res) => {
  console.log('[LEADERBOARD]: getting leaderboard');
  await accounts.getLeaderboard(res);
});
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body; // Destructure the username and password from the request body
  const loggedIn = await accounts.login(username, password); // Call the login function from accounts.mjs
  if (loggedIn) {
    res.status(200).json('Login successful');
  } else {
    res.status(401).json('Login failed');
  }
});
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  await accounts.register(res, username, password); // Call the register function from accounts.mjs
});
app.post('/api/activeusers', async (req, res) => {
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
    rooms.deleteRoom(socket, io);
  });

  socket.on('sendMessage', (roomId, messageContent) => {
    rooms.sendMessage(socket, roomId, messageContent, io, socketToUser.get(socket.id));
  });

  socket.on('disconnect', () => {
    rooms.disconnect(socketToUser.get(socket.id), io);
    socketToUser.delete(socket.id);
  });
});

function formatFriends(friends) {
  if (!friends) return [];
  const formattedFriends = [];
  for (const friend of friends) {
    if (socketToUser.values().includes(friend)) {
      formattedFriends.push({ name: friend, online: true });
    } else {
      formattedFriends.push({ name: friend, online: false });
    }
  }
  return formattedFriends;
}
export function notifyFriendRequest(client, username, requestee) {
  client = client === null ? io : client;
  // console.log('Notifying', requestee, 'of friend request');
  let socketId = Array.from(socketToUser.entries()).find(([, value]) => value === requestee);
  if (socketId === undefined) {
    return;
  } else {
    socketId = socketId[0];
  }
  client.to(socketId).emit('friendRequest', username);
}


export function notifyFriendRequestAccepted(client, requestee, username) {
  // console.log('Notifying', requestee, 'of friend request acceptance from', username);
  client = client === null ? io : client;
  let socketId = Array.from(socketToUser.entries()).find(([, value]) => value === requestee);
  if (socketId === undefined) {
    return;
  } else {
    socketId = socketId[0];
  }
  client.to(socketId).emit('friendRequestAccepted', username);
}
