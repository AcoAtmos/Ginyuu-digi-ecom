const path = require("path");

exports.landing = async (req, res) => {
    res.render("landing");
};

exports.checkout = async (req, res) => {
    res.render("checkout");
};

exports.waiting_for_payment = async (req, res) => {
    res.render("waiting-payment");
};
