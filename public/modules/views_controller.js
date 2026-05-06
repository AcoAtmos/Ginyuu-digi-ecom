const path = require("path");

// landing page
exports.landing = async (req , res ) =>{
    res.render(path.join(__dirname ,"./landing_page/landing_page.ejs"));
}; 

// checkout page 2
exports.checkout = async (req , res ) =>{
    res.render(path.join(__dirname ,"./checkout/checkout.ejs"));
};

// waiting for payment
exports.waiting_for_payment = async (req , res ) =>{
    res.render(path.join(__dirname ,"./waiting_for_payment/waiting_for_payment.ejs"));
};
