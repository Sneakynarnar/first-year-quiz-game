import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors'; 

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors()); // Enable CORS
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('../client'));

// Assuming your client files are in a 'public' folder 
app.use(express.static('public'));

const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

const io = new Server(server); 

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('createRoom', () => {
        const roomId = uuidv4();
        socket.join(roomId);
        console.log(`Room ${roomId} created`);
        io.to(roomId).emit('roomCreated', roomId);
    });

    socket.on('disconnect', () => {
        console.log('User Disconnected');
    })
});

// app.get('/room',  (req, res) => {
//   res.sendFile('public/room/index.html')
// });
// app.get('/lobby', (req, res) => {
//   res.sendFile('public/lobby/index.html')
// });
// app.get('/settings', (req, res) => {
//   res.sendFile('public/settings/index.html')
// });
// app.get('/profile', (req, res) => {
//   res.sendFile('public/profile/index.html')
// });