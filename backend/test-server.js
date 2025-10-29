// Simple test to see if basic express works
const express = require('express');
const app = express();
const PORT = 5000;

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Test server is running' });
});

app.listen(PORT, () => {
  console.log(`✅ Test server running on port ${PORT}`);
});
