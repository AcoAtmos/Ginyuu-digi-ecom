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

exports.resetPassword = async (req, res) => {
    res.render("reset-password", { token: req.query.token || null });
};

// profile section
exports.profile = async (req, res) => {
    res.render("profile-user/profile");
};

exports.profile_settings = async (req, res) => {
    res.render("profile-user/settings");
};

exports.profile_purchases = async (req, res) => {
    res.render("profile-user/purchases");
};

exports.security = async (req, res) => {
    res.render("profile-user/security");
};