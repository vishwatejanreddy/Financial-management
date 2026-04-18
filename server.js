// server.js — Main Express server
const express = require('express');
const path = require('path');
const routes = require('./routes');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api', routes);

// Serve index for all unknown routes (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n✅  FinanceApp running at http://localhost:${PORT}\n`);
});
