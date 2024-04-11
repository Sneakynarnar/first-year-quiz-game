import { fileURLToPath } from 'url';
import path from 'path';
import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';

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

let activeRooms = new Map();

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('createRoom', () => {
    const roomId = uuidv4();
    socket.join(roomId);
    activeRooms.set(roomId, true);
    console.log(`Room ${roomId} created`);
    io.to(roomId).emit('roomCreated', roomId);
    socket.emit('redirect', `/create?roomId=${roomId}`);
  });

  socket.on('getRooms', () => {
    console.log('Client requested room list');
    socket.emit('roomsList', Array.from(activeRooms.keys()));
  });

  socket.on('joinRoom', (roomId) => {
    if (activeRooms.has(roomId)) {
      socket.join(roomId);
      console.log(`User joined room ${roomId}`);
      socket.emit('redirect', `/room/${roomId}`);
    } else {
      socket.emit('roomError', 'Invalid Room ID');
    }
  });

  socket.on('disconnect', () => {
    console.log('User Disconnected');
  });
});

app.get('/room/:roomId', (req, res) => {
  const roomId = req.params.roomId;

  const roomFilePath = path.join(__dirname, '..', 'client', 'room', 'index.html');
  res.sendFile(roomFilePath);
});

app.get('/create', (req, res) => {
  const createFilePath = path.join(__dirname, '..', 'client', 'create', 'index.html');
  res.sendFile(createFilePath);
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
