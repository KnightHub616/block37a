const express = require('express');
const prisma = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
const SALT_ROUNDS = 10;

router.post('/register', async (req, res, next) => {
  const { username, password, email } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { username: username },
    });

    if (existingUser) {
      return res.status(409).json({ message: 'Username already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = await prisma.user.create({
      data: {
        username: username,
        password: hashedPassword,
        email: email,
      },
      select: { id: true, username: true }
    });

    const tokenPayload = {
       userId: newUser.id,
       username: newUser.username
    };
    const secretKey = process.env.JWT_SECRET;
    const tokenOptions = {
        expiresIn: '1h'
    };

    if (!secretKey) {
        console.error("JWT_SECRET is not defined in .env file!");
        return res.status(500).json({ message: "Authentication configuration error." });
    }

    const token = jwt.sign(tokenPayload, secretKey, tokenOptions);

    res.status(201).json({ token: token, message: 'User registered successfully' });

  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { username: username },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const tokenPayload = {
       userId: user.id,
       username: user.username
    };
    const secretKey = process.env.JWT_SECRET;
     const tokenOptions = {
        expiresIn: '1h'
    };

    if (!secretKey) {
        console.error("JWT_SECRET is not defined in .env file!");
        return res.status(500).json({ message: "Authentication configuration error." });
    }

    const token = jwt.sign(tokenPayload, secretKey, tokenOptions);

    res.status(200).json({ token: token, message: 'Login successful' });

  } catch (error) {
    next(error);
  }
});

router.get('/me', protect, async (req, res, next) => {
  if (req.user) {
    res.status(200).json(req.user);
  } else {
    res.status(401).json({ message: 'Not authorized' });
  }
});

module.exports = router;
