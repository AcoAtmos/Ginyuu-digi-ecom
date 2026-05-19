const { get_my_profile, update_my_profile, get_my_purchases, get_all_purchases } = require("./user.service");

exports.get_my_profile = async (req, res) => {
    await get_my_profile(req, res);
};

exports.update_my_profile = async (req, res) => {
    await update_my_profile(req, res);
};

exports.get_my_purchases = async (req, res) => {
    await get_my_purchases(req, res);
};

exports.get_all_purchases = async (req, res) => {
    await get_all_purchases(req, res);
};
