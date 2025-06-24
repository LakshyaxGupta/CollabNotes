const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Note = require('./models/Note');
const User = require('./models/User');
const { Server } = require('socket.io');
const http = require('http');
const server = http.createServer(app); // create HTTP server
const io = new Server(server); // attach socket.io to the server
const cookieParser = require('cookie-parser');
const authMiddleware = require('./middlewares/authMiddleware');

app.use(cookieParser());
dotenv.config();
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));


mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));


const authRoutes = require('./routes/authRoute');
const noteRoutes = require('./routes/noteRoute');
const tagsRoutes = require('./routes/tagsRoute');
// app.use((req, res, next) => {
//   console.log(`[${req.method}] ${req.originalUrl}`);
//   next();
// });

app.use(authRoutes);
app.use('/api', noteRoutes);
app.use(tagsRoutes);

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/dashboard', authMiddleware, async (req, res) => {
    const notes = await Note.find({ owner: req.userId }).lean();
    res.render('dashboard', { notes });
});
app.get('/shared', authMiddleware, async (req, res) => {
  const notes = await Note.find({
    collaborators: req.userId
  }).lean();

  res.render('dashboard', { notes });
});
app.get('/editor', authMiddleware, (req, res) => {
    res.render('editor');
});

app.get('/editor/:id', authMiddleware, async (req, res) => {
  const note = await Note.findOne({ _id: req.params.id, owner: req.userId }).lean();
  if (!note) return res.redirect('/404');

  res.render('editor', { note }); // send note data to the editor
});

app.get('/404' , (req,res) =>{
    res.render('404');
})
app.get('/login', (req, res) => {
    res.render('login');
});
app.get('/register', (req, res) => {
    res.render('register');
});
app.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/');
});

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('join-note', (noteId) => {
    socket.join(noteId);
    console.log(`User joined note room: ${noteId}`);
  });

  socket.on('send-changes', ({ noteId, content }) => {
    socket.to(noteId).emit('receive-changes', content); // broadcast to other clients
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});


server.listen(process.env.PORT || 3000);