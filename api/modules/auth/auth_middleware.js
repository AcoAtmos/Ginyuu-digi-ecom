const jwt = require("jsonwebtoken");

exports.authMiddleware = (req, res, next) => {
    // get token from header
    let token = req.headers.authorization;
    token = token.split(" ")[1];
    if (!token){
        return res.status(401).json({
            code: 401,
            status: "error",
            message: "Unauthorized"
        });
    }

    // verify token
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err){
            return res.status(403).json({
                code: 403,
                status: "error",
                message: "Forbidden"
            });
        }

        // attach user to request
        req.user = user;
        next();
    });
};

exports.checkLoginStatus = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // tidak ada token
  if (!authHeader) {
    req.isLogin = false;
    req.user = null;
    return next(); // lanjut
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // token valid
    req.isLogin = true;
    req.user = decoded;

  } catch (err) {
    // token salah / expired
    req.isLogin = false;
    req.user = null;
  }

  next(); // tetap lanjut
};