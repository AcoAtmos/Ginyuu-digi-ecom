const helper = require("../../common/helper");

// for product home
exports.getProductbyslug = async (slug) => {
    const query = "SELECT * FROM products WHERE slug = $1";
    const results = await helper.db.query(query, [slug]);
    return results.rows[0];
};
exports.getProductHome = async () => {
    const result = {new_arrival: [], top_selling: []};
    const query_new_arrival = "SELECT * FROM products ORDER BY created_at DESC LIMIT 4";
    const query_top_selling = "SELECT * FROM products ORDER BY sales_count DESC LIMIT 4";

    try{
        const results_new_arrival = await helper.db.query(query_new_arrival);
        const results_top_selling = await helper.db.query(query_top_selling);
        result.new_arrival = results_new_arrival.rows;
        result.top_selling = results_top_selling.rows;
        return result;
    }catch(error){
        console.log(error);
        return {new_arrival: [], top_selling: []};
    }
};
// for product page
exports.getProduct = async () => {
    const query = "SELECT * FROM products";
    const results = await helper.db.query(query);
    return results.rows;
};

// for category
exports.getProductCategory = async (page, limit) => {
    const query = "SELECT * FROM products ORDER BY id ASC LIMIT $1 OFFSET $2";
    try{
        const results = await helper.db.query(query, [limit, (page - 1) * limit]);
        return results.rows;
    }catch(error){
        console.log(error); 
        return [];
    }
};
