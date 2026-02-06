const path = require("path");

// checkout page
exports.checkout = async (req , res ) =>{
    res.render(path.join(__dirname ,"./checkout/checkout_page.ejs"));
};
// login page
exports.login = async (req , res ) =>{
    res.render(path.join(__dirname ,"./login/login_page.ejs"));
};

// home page
exports.home = async (req , res ) =>{
    res.render(path.join(__dirname ,"./home/home_page.ejs"));
};


// product page
exports.product = async (req , res ) =>{
    res.render(path.join(__dirname ,"./product/product.ejs"));
};

// showcase page
exports.showcase = async (req , res ) =>{
    res.render(path.join(__dirname ,"./showcase/showcase.ejs"));
};
