const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./src/routes/auth');

const app = express();

// Middleware
app.use(bodyParser.json());

// Routes
app.use('/auth', authRoutes);

// Start Server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
