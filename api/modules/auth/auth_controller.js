
const {
    register,
    login,
    registerCheckout
} = require("./auth_service");

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
    try{
        const result = await login(req.body);
        console.log(result);
        return res.status(200).json({
            code: 200,
            status: "success",
            message: "User logged in successfully",
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

// verify token
exports.verifyToken = async (req, res) => {
    return res.status(200).json({
        code: 200,
        status: "success",
        message: "Token verified successfully"
    });
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