const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.registerUser = async (req, res) => {
  try {
    const { username, email, mobileNumber, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10); // Salt rounds: 10
    const newUser = new User({ username, email, mobileNumber, password: hashedPassword, role });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password!' });
    }

    // Check if the user is an admin based on email
    if (user.role === 'admin') {
      // Create a JWT token with admin role
      const token = jwt.sign({ userId: user._id, role: 'admin' }, process.env.JWT_SECRET);
      return res.status(200).json({ message: 'Admin Login successful', user, token });
    }

    // For regular users
    const token = jwt.sign({ userId: user._id, role: 'user' }, process.env.JWT_SECRET);
    res.status(200).json({ message: 'User Login successful', user, token});
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

