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
export const app = express();
const port = process.env.PORT || 3000; // Set the port to the environment variable PORT or 3000
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Parse JSON bodies MIDDLEWARE
app.use(express.static(path.join(__dirname, '..', 'public'))); // Serve the public directory

const server = http.createServer(app);
const io = new Server(server);
export const socketToUser = new Map();

app.get('/api/titles', async (req, res) => {
  try {
    const quizTitles = Object.keys(questions);

    const response = {
      quizTitles: quizTitles.map(title => ({
        quizId: title,
        quizTitle: questions[title]['quiz-title']
      }))
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching quiz titles:', error);
    res.status(500).json({ error: 'Failed to fetch quiz titles' });
  }
});

app.get('/api/questions', async (req, res) => {
  let questions;
  req.query.count = req.query.count || 10;
  if (req.query.category) {
    questions = await quiz.getRandomQuestionsFromCategory(req.query.count, req.query.category);
  } else {
    questions = await quiz.getRandomQuestions(req.query.count);
  }
  res.status(200).json({ questions });
});

app.get('/api/allquestions', async (req, res) => {
  await quiz.getQuestions().then((questions) => {
    res.status(200).json(questions);
  });
});

app.post('/api/createquiz', async (req, res) => {
  const quizCreated = await storeQuiz(req.body);
  if (quizCreated) {
    res.status(200).send('Quiz created successfully');
  } else {
    res.status(400).send('Quiz creation failed');
  }
});

app.post('/api/sendfriendrequest', async (req, res) => {
  const [from, to] = req.body.users;
  const status = await accounts.sendFriendRequest(from, to);
  if (status === 'Success') {
    res.status(200).json('Friend request sent');
    console.log('Friend request sent from', from, 'to', to, 'on server side');
  } else {
    res.status(400).send(status);
  }
});
app.post('/api/acceptfriendrequest', async (req, res) => {
  const [from, to] = req.body.users;
  console.log('[FRIENDS]: accepting friend request from', from, 'to', to, 'on server side');
  const status = await accounts.acceptFriendRequest(from, to);
  if (status === 'Success') {
    res.status(200).send('Friend request accepted');
    console.log('Friend request accepted from', from, 'to', to, 'on server side');
  } else {
    res.status(400).send(status);
  }
});
app.post('/api/ignorefriendrequest', async (req, res) => {
  const [from, to] = req.body.users;
  console.log('[FRIENDS]: ignoring friend request from', from, 'to', to, 'on server side');
  const status = await accounts.ignoreFriendRequest(from, to);
  if (status === 'Success') {
    res.status(200).send('Friend request ignored');
    console.log('Friend request ignored from', from, 'to', to, 'on server side');
  } else {
    console.log('ERROR', status, 'from', from, 'to', to, 'on server side');
    res.status(400).send(status);
  }
});
app.post('/api/removefriend', async (req, res) => {
  const [from, to] = req.body.users;
  console.log('[FRIENDS]: removing friend from', from, 'to', to, 'on server side');
  const status = await accounts.removeFriend(from, to);
  if (status === 'Success') {
    res.status(200).send('Friend removed');
  } else {
    res.status(400).send(status);
  }
});
app.get('/api/friends/:userId', async (req, res) => {
  const username = req.params.userId;
  console.log('[FRIENDS]: getting friends for', username);
  const friends = await accounts.getFriends(username);
  const formattedFriends = formatFriends(friends);
  if (!formattedFriends) {
    res.status(400).send("Couldn't get friends");
  }
  res.status(200).json({ formattedFriends });
});
app.get('/api/friendrequests/:userId', async (req, res) => {
  const username = req.params.userId;
  // console.log('[FRIENDS]: getting friend requests for', username);
  const friendRequests = await accounts.getFriendRequests(username);
  if (friendRequests) {
    res.status(200).json({ friendRequests });
  } else {
    res.status(400).send("Couldn't get friend requests");
  }
});
app.get('/api/leaderboard', async (req, res) => {
  console.log('[LEADERBOARD]: getting leaderboard');
  const leaderboard = await accounts.getLeaderboard();
  res.send({ leaderboard });
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
  const status = await accounts.register(username, password); // Call the register function from accounts.mjs
  if (status === 'Success') {
    res.status(200).send('Registration successful');
  } else {
    console.log('ERROR', status, 'from', username, 'on server side');
    res.status(400).json(status);
  }
});
app.get('/api/activeusers', (req, res) => {
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
  console.log(friends);
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
