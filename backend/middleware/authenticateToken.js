const jwt = require("jsonwebtoken")

function authenticateToken(req, res, next) {
  console.log('AUTH MIDDLEWARE CALLED');
  
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  
  console.log('Token:', token ? 'Present' : 'Missing');
  
  if (!token) {
    console.log('No token');
    return res.status(401).json({ message: "Access token required" });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      console.log('Token invalid:', err.message);
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    
    console.log('User authenticated:', user);
    req.user = user;
    next();
  })
}

export default authenticateToken;