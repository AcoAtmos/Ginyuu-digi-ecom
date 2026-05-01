
const {
    register,
    login,
    registerCheckout
} = require("./auth_service");
const jwt = require("jsonwebtoken");
const { db } = require("../../common/helper");

exports.register = async(req, res) => {
    try{
        const result = await register(req.body);
        res.status(200).json({
            status: "success",
            message: "User registered successfully",
            data: result
        });
    }catch(err){
        return res.status(500).json({
            status: "error server error cik",
            message: err.message
        });
    }
};

// normal login
exports.login = async (req, res) => {
  try {
    const user = await login(req.body); // langsung user

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        username: user.username,
        email: user.email,
        phone: user.phone,
        image_url: user.image_url
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
    });

    return res.status(200).json({
      code: 200,
      status: "success",
      message: "User logged in successfully",
      data: {
        user: {
          username: user.username,
          email: user.email,
          phone: user.phone,
          image_url: user.image_url,
          role: user.role
        },
      },
    });

  } catch (err) {
    return res.status(500).json({
      code: 500,
      status: "error",
      message: err.message,
    });
  }
};

// verify token
exports.verifyToken = async (req, res) => {
    const token = req.cookies?.token;
    if(token){
        console.log("token", token);
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err){
                return res.status(403).json({
                    code: 403,
                    status: "error",
                    message: "Forbidden"
                });
            }
            return res.status(200).json({
                code: 200,
                status: "success",
                message: "Token verified successfully",
                data: { user }
            });
        });
    } else {
        console.log("token not found");
        return res.status(401).json({
            code: 401,
            status: "error",
            message: "Token not found"
        });
    }
};

// register in checkout
exports.registerCheckout = async (req, res) => {
    try{
        const result = await registerCheckout(req.body);
        return res.status(200).json({
            code: 200,
            status: "success",
            message: "User registered successfully",
            data: result
        });
    }catch(err){
        return res.status(500).json({
            code: 500,
            status: "error",
            message: err.message,
            data: err
        });
    }
};

// get current user from token (full profile from DB)
exports.getMe = async (req, res) => {
    const token = req.cookies?.token;
    if(!token){
        return res.status(401).json({
            code: 401,
            status: "error",
            message: "Token not found"
        });
    }
    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // get full user data from DB
        const query = `SELECT id, username, email, phone, image_url, role, created_at FROM users WHERE id = $1`;
        const {rows} = await db.query(query, [decoded.id]);
        
        if(rows.length === 0){
            return res.status(404).json({
                code: 404,
                status: "error",
                message: "User not found"
            });
        }
        
        return res.status(200).json({
            code: 200,
            status: "success",
            data: rows[0]
        });
    }catch(err){
        return res.status(401).json({
            code: 401,
            status: "error",
            message: "Invalid token"
        });
    }
};

// logout - clear cookie
exports.logout = async (req, res) => {
    res.cookie("token", "", {
        httpOnly: true,
        expires: new Date(0),
        path: "/"
    });
    return res.status(200).json({
        code: 200,
        status: "success",
        message: "Logged out successfully"
    });
};