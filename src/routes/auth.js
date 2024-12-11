// import express from 'express';
const express = require('express');
const prisma = require('../db/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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
  const existedEmail = await prisma.user.findFirst({
    where: {
      email
    }
  })

  // if (err) return res.status(500).json({ message: 'Database error.' });

  if (existedEmail) {
    return res.status(400).json({ message: 'Email already registered.' });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Simpan user ke database
  await prisma.user.create({
    data: {
      name: name,
      phone: phone,
      email: email,
      auth: hashedPassword
    }
  })

  // if (err) return res.status(500).json({ message: 'Database error.' });

  return res.status(201).json({ message: 'User registered successfully.' });
});

// Login User
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const user = await prisma.user.findUnique({
    where: {
      email
    }
  })

  // if (err) return res.status(500).json({ message: 'Database error.' });

  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  //check password
  const isPasswordValid = await bcrypt.compare(password, user.auth);
  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Invalid password.' });
  }

  // Generate JWT
  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.status(200).json({ message: 'Login successful.', token });
});

module.exports = router;
