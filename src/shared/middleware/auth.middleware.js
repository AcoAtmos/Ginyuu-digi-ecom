const jwt = require("jsonwebtoken");

exports.authMiddleware = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ code: 401, status: "error", message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    console.log(`ini decode : `, decoded);
    next();
  } catch (err) {
    return res.status(401).json({ code: 401, status: "error", message: "Invalid token" });
  }
};

exports.adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ code: 403, status: "error", message: "Admin only" });
  }
  next();
};
