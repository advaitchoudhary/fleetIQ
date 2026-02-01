const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  const JWT_SECRET = process.env.JWT_SECRET;
  const token = req.header("Authorization")?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("JWT verification failed in protect:", error);
    
    // Provide specific error messages for different JWT errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: "Token expired. Please log in again.",
        error: "TokenExpiredError",
        expiredAt: error.expiredAt
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: "Invalid token. Please log in again.",
        error: "JsonWebTokenError"
      });
    }
    
    res.status(401).json({ message: "Invalid token" });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access Denied: Insufficient permissions" });
    }
    next();
  };
};

module.exports = {
  protect,
  authorizeRoles
};