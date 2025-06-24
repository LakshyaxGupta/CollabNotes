const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // ✅ First check cookie, then header
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    console.warn('❌ No token found in cookies or header');
    return res.redirect('/login'); // Redirect to login for web pages
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId; // Add userId to req
    next();
  } catch (err) {
    console.error('❌ Invalid token:', err.message);
    res.redirect('/login'); // Invalid token? Back to login
  }
};

module.exports = authMiddleware;
