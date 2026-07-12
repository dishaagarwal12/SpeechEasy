// server.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const helmet = require('helmet');

connectDB();

const app = express();

app.use(express.json());
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'https://speech-easy-six.vercel.app'],
  credentials: true,
}));

app.get('/', (req, res) => {
  res.send('SpeechEasy backend is alive 🎤');
});

app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/interviews', interviewRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});