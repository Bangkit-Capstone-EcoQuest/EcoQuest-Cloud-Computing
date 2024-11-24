const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

const router = express.Router();

// Register User
router.post('/register', async (req, res) => {
  const { name, phone, email, password } = req.body;

  // Validasi input
  if (!name || !phone || !email || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  // Cek apakah email sudah terdaftar
  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, result) => {
    if (err) return res.status(500).json({ message: 'Database error.' });
    if (result.length > 0) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Simpan user ke database
    const user = { name, phone, email, password: hashedPassword };
    db.query('INSERT INTO users SET ?', user, (err, result) => {
      if (err) return res.status(500).json({ message: 'Database error.' });
      res.status(201).json({ message: 'User registered successfully.' });
    });
  });
});

// Login User
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, result) => {
    if (err) return res.status(500).json({ message: 'Database error.' });
    if (result.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const user = result[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password.' });
    }

    // Generate JWT
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ message: 'Login successful.', token });
  });
});

module.exports = router;
