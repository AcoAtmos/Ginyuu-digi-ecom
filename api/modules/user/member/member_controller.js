const { 
    get_profile,
    get_my_profile,
    get_my_purchases,
    get_all_purchases
} = require("./member_service");

// get my profile
exports.get_my_profile = async (req, res) => {
    await get_my_profile(req, res);
}

// get my purchases (member)
exports.get_my_purchases = async (req, res) => {
    await get_my_purchases(req, res);
}

// get all purchases (admin)
exports.get_all_purchases = async (req, res) => {
    await get_all_purchases(req, res);
}