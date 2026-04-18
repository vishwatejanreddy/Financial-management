// server.js
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve all files from current folder
app.use(express.static(__dirname));

// Open index.html when site loads
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ FinanceApp running at http://localhost:${PORT}`);
});
