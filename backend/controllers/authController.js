// controllers/authController.js
// Contains the actual logic for registering and logging in users.

const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @route  POST /api/auth/register
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({ message: 'Something went wrong during registration' });
  }
};

// @route  POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // 1. Find the user by email
    const user = await User.findOne({ email });

    // 2. IMPORTANT: use the exact same generic error whether the email
    //    doesn't exist OR the password is wrong. This prevents attackers
    //    from figuring out which registered emails exist on our system.
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 3. Compare the plain-text password the user typed against the
    //    stored bcrypt hash
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 4. Success — generate token and return user info
    const token = generateToken(user._id);

    res.status(200).json({
      token,
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Something went wrong during login' });
  }
};

module.exports = { registerUser, loginUser };