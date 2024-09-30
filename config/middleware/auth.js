// middleware/auth.js
const jwt = require('jsonwebtoken');

function isLoggedIn(req, res, next) {
  console.log("Cookies:", req.cookies);

  const token = req.cookies.token;
  if (!token) {
    return res.status(401).send("You must be logged in.");
  }

  try {
    const data = jwt.verify(token, 'shhhhh');
    req.user = data;
    console.log("User Data:", req.user);
    next();
  } catch (err) {
    console.error("JWT verification error:", err);
    return res.status(401).send("Invalid or expired token.");
  }
}

module.exports = { isLoggedIn };
