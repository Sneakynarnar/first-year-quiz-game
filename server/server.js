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

app.use(express.static(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'client')));

const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

const io = new Server(server);

let activeRooms = new Set();

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('createRoom', () => {
    const roomId = uuidv4();
    socket.join(roomId);
    activeRooms.add(roomId);
    console.log(`Room ${roomId} created`);
    io.to(roomId).emit('roomCreated', roomId);
  });

  socket.on('getRooms', () => {
    console.log('Client requested room list'); 
    socket.emit('roomsList', Array.from(activeRooms));
  });

  socket.on('joinRoom', (roomId) => {
    if (activeRooms.has(roomId)) {
      socket.join(roomId);
      socket.emit('redirect', `/room/${roomId}`); 
      console.log('User Joined a Room')
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

  const roomFilePath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'client', 'room', 'index.html'); 
  res.sendFile(roomFilePath);
});