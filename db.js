// db.js — Simple in-memory user store (no MongoDB needed)
const bcrypt = require('bcryptjs');

const users = []; // Stores { id, name, email, password (hashed) }

// Create a new user
async function createUser(email, password) {
  const existing = users.find(u => u.email === email);
  if (existing) return { error: 'Email already registered' };

  const hashed = await bcrypt.hash(password, 10);
  const user = { id: Date.now().toString(), email, password: hashed };
  users.push(user);
  return { user: { id: user.id, email: user.email } };
}

// Verify login credentials
async function findUser(email, password) {
  const user = users.find(u => u.email === email);
  if (!user) return { error: 'No account found with this email' };

  const match = await bcrypt.compare(password, user.password);
  if (!match) return { error: 'Incorrect password' };

  return { user: { id: user.id, email: user.email } };
}

module.exports = { createUser, findUser };
