const path = require("path");
// register page
exports.register = async (req , res ) =>{
    res.render(path.join(__dirname ,"./register/register_page.ejs"));
};

// login page
exports.login = async (req , res ) =>{
    res.render(path.join(__dirname ,"./login/login_page.ejs"));
};

// home page
exports.home = async (req , res ) =>{
    res.render(path.join(__dirname ,"./home/home_page.ejs"));
};

// showcase page
exports.showcase = async (req , res ) =>{
    res.render(path.join(__dirname ,"./showcase/showcase_page.ejs"));
};

// product page
exports.product = async (req , res ) =>{
    res.render(path.join(__dirname ,"./product/product_page.ejs"));
};

// checkout page
exports.checkout = async (req , res ) =>{
    res.render(path.join(__dirname ,"./checkout/checkout_page.ejs"));
};

// profile page
exports.profile = async (req , res ) =>{
    res.render(path.join(__dirname ,"./profile/profile_page.ejs"));
};

