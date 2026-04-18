// routes.js — API route definitions
const express = require('express');
const jwt = require('jsonwebtoken');
const { createUser, findUser } = require('./db');

const router = express.Router();
const JWT_SECRET = 'financeapp_secret_2024'; // In production, use env variable

// POST /signup — Register a new user
router.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.json({ success: false, message: 'All fields are required' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.json({ success: false, message: 'Invalid email address' });
  if (password.length < 6)
    return res.json({ success: false, message: 'Password must be at least 6 characters' });

  const result = await createUser(email, password);
  if (result.error) return res.json({ success: false, message: result.error });

  const token = jwt.sign({ id: result.user.id, email: result.user.email }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ success: true, token, email: result.user.email });
});

// POST /login — Authenticate existing user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.json({ success: false, message: 'All fields are required' });

  const result = await findUser(email, password);
  if (result.error) return res.json({ success: false, message: result.error });

  const token = jwt.sign({ id: result.user.id, email: result.user.email }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ success: true, token, email: result.user.email });
});

// POST /calculate — Process financial data
router.post('/calculate', (req, res) => {
  // Verify JWT token
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.json({ success: false, message: 'Not authenticated' });

  try {
    jwt.verify(token, JWT_SECRET);
  } catch {
    return res.json({ success: false, message: 'Session expired, please login again' });
  }

  const { name, income, expenses, cibil, tenure } = req.body;

  // Validate inputs
  if (!name || !income || !expenses || !cibil)
    return res.json({ success: false, message: 'All fields are required' });

  const inc = parseFloat(income);
  const exp = parseFloat(expenses);
  const score = parseInt(cibil);
  const months = parseInt(tenure) || 12;

  if (isNaN(inc) || isNaN(exp) || isNaN(score))
    return res.json({ success: false, message: 'Please enter valid numbers' });
  if (score < 300 || score > 900)
    return res.json({ success: false, message: 'CIBIL score must be between 300 and 900' });
  if (exp >= inc)
    return res.json({ success: false, message: 'Expenses must be less than income' });

  // CIBIL analysis
  let cibilStatus, cibilMessage, cibilType;
  if (score >= 750) {
    cibilStatus = 'EXCELLENT';
    cibilMessage = 'Great score! You are eligible for all EMI products at the best rates.';
    cibilType = 'success';
  } else if (score >= 650) {
    cibilStatus = 'FAIR';
    cibilMessage = 'Decent score. You have limited EMI options available.';
    cibilType = 'warning';
  } else {
    cibilStatus = 'POOR';
    cibilMessage = 'Score too low. Not eligible for EMI. Focus on improving your credit.';
    cibilType = 'error';
  }

  // EMI calculation: EMI = P * r * (1+r)^n / ((1+r)^n - 1)
  const RATE = 10; // Annual interest rate %
  const r = RATE / (12 * 100); // Monthly rate

  const products = [
    { name: 'Smartphone', price: 25000, emoji: '📱' },
    { name: 'Laptop',     price: 75000, emoji: '💻' },
    { name: 'Bike',       price: 120000, emoji: '🏍️' }
  ];

  const savings = inc - exp;

  const productResults = products.map(p => {
    const pow = Math.pow(1 + r, months);
    const emi = Math.round(p.price * r * pow / (pow - 1));
    const emiPercent = ((emi / inc) * 100).toFixed(1);
    const recommended = emi < inc * 0.30 && score >= 650;
    return {
      name: p.name,
      emoji: p.emoji,
      price: p.price,
      emi,
      emiPercent,
      recommended,
      tenure: months
    };
  });

  res.json({
    success: true,
    name,
    income: inc,
    expenses: exp,
    savings,
    cibil: score,
    cibilStatus,
    cibilMessage,
    cibilType,
    products: productResults,
    rate: RATE,
    tenure: months
  });
});

module.exports = router;
