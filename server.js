const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const { createUser, findUser } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve all frontend files from current folder
app.use(express.static(__dirname));

// Home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Signup API
app.post('/api/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const result = await createUser(email, password);

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      user: result.user
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// Login API
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await findUser(email, password);

    if (result.error) {
      return res.status(401).json({ error: result.error });
    }

    res.json({
      success: true,
      user: result.user
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Dashboard page (optional if you have dashboard.html)
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ FinanceIQ running at http://localhost:${PORT}`);
});
