const helper = require("../../common/helper");

exports.getProduct = async () => {
    const query = "SELECT * FROM products";
    const results = await helper.db.query(query);
    console.log(results.rows);
    return results.rows;
};
