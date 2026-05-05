const path = require("path");

// landing page
exports.landing = async (req , res ) =>{
    res.render(path.join(__dirname ,"./landing_page/landing_page.ejs"));
}; 

// checkout page 2
exports.checkout = async (req , res ) =>{
    res.render(path.join(__dirname ,"./checkout/checkout.ejs"));
};

