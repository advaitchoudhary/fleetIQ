const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  const JWT_SECRET = process.env.JWT_SECRET;
  const token =
    req.header("Authorization")?.split(" ")[1] ||
    req.cookies?.admin_token;

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    // Attach organizationId directly for convenience in controllers
    req.organizationId = decoded.organizationId || null;
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

// Build a Mongoose filter scoped to the caller's org.
// admin with no org → empty filter (sees all orgs).
const getOrgFilter = (req) => {
  if (req.user.role === "admin" && !req.organizationId) return {};
  return { organizationId: req.organizationId };
};

module.exports = {
  protect,
  authorizeRoles,
  getOrgFilter,
};