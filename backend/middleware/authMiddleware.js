// middleware/authMiddleware.js
// This is our "security guard" — it runs BEFORE any protected route's
// controller. It checks for a valid JWT token in the Authorization header.
// If valid, it attaches the decoded user info to req.user so the next
// function (the controller) knows exactly who is making the request.

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Tokens are sent like: "Authorization: Bearer eyJhbGciOi..."
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer')) {
    try {
      // Split "Bearer eyJhbGciOi..." into ["Bearer", "eyJhbGciOi..."]
      token = authHeader.split(' ')[1];

      // Verify the token using our secret — throws an error if invalid/expired
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch the user (without the password field) and attach to req
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'User no longer exists' });
      }

      next(); // ✅ everything checks out — let the request continue to the controller
    } catch (error) {
      console.error('Token verification failed:', error.message);
      return res.status(401).json({ message: 'Not authorized, invalid token' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

module.exports = protect;