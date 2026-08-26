require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const parkingRoutes = require('./routes/parkingRoutes');

const app = express();
const MONGODB_URI = process.env.MONGODB_URI;

// Allows the HTML/JS frontend (opened via file:// or a static server) to call this API.
app.use(cors());
app.use(express.json({ limit: '100kb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

app.use('/api/parking', parkingRoutes);

app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  if (error.name === 'ValidationError') {
    return res.status(400).json({ message: error.message });
  }
  return res.status(500).json({ message: 'An unexpected server error occurred.' });
});

async function startServer() {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is missing. Add it to the .env file.');
  }

  await mongoose.connect(MONGODB_URI);
  console.log('MongoDB connected.');
  app.listen(8080, '0.0.0.0', () => {
    console.log("Server running on port 8080");
  });
}

startServer().catch((error) => {
  console.error('Unable to start server:', error.message);
  process.exit(1);
});

module.exports = app;