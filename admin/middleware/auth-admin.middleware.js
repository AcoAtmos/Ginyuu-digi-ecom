const jwt = require("jsonwebtoken");

const respond = (req, res, status, message) => {
  if (req.accepts('html')) {
    res.clearCookie('admin_token', { path: '/' });
    return res.redirect('/auth/login');
  }
  return res.status(status).json({ code: status, status: "error", message });
};

// for BE
exports.authenticateAdmin = (req, res, next) => {
  const token = req.cookies?.admin_token;
  if (!token) {
    return respond(req, res, 401, "Unauthorized");
  }

  try {
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
    if (decoded.role !== 'ADMIN' || decoded.status !== 'active') {
      return respond(req, res, 403, "Access denied");
    }
    req.user = decoded;
    next();
  } catch (err) {
    return respond(req, res, 401, "Invalid token");
  }
};

// for FE
exports.redirectIfAuthenticated = (req, res, next) => {
  const token = req.cookies?.admin_token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
      if (decoded.role === 'ADMIN' && decoded.status === 'active') {
        return res.redirect('/dashboard');
      }
    } catch (_) {
      res.clearCookie('admin_token', { path: '/' });
    }
  }
  next();
};
