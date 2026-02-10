const helper = require("../../common/helper");

// for product home
exports.getProductbyslug = async (slug) => {
    const query = "SELECT * FROM products WHERE slug = $1";
    const results = await helper.db.query(query, [slug]);
    return results.rows[0];
};

exports.getProduct = async () => {
    const query = "SELECT * FROM products";
    const results = await helper.db.query(query);
    return results.rows;
};
