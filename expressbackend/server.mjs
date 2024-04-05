import express from 'express';
//import path from 'path';
const app = express();
const port = 3000;
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.send('Hello, world!');
});
app.get('/room',  (req, res) => {
  res.sendFile('public/room/index.html')
});
app.get('/lobby', (req, res) => {
  res.sendFile('public/lobby/index.html')
});
app.get('/settings', (req, res) => {
  res.sendFile('public/settings/index.html')
});
app.get('/profile', (req, res) => {
  res.sendFile('public/profile/index.html')
});
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});