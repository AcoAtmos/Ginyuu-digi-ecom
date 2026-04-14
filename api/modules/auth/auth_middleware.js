const jwt = require("jsonwebtoken");

exports.authMiddleware = (req, res, next) => {
    // get token from header
    let token = req.headers.authorization;
    console.log(`coockies : ${req.cookies}`);
    console.log(token);
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
