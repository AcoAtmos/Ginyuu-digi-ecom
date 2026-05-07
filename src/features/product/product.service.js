const { db } = require("../../config/database");

exports.getProductbyslug = async (slug) => {
    const query = "SELECT * FROM products WHERE slug = $1";
    const results = await db.query(query, [slug]);
    return results.rows[0];
};

exports.getProductHome = async () => {
    const result = { new_arrival: [], top_selling: [] };
    const query_new_arrival = "SELECT * FROM products ORDER BY created_at DESC LIMIT 4";
    const query_top_selling = "SELECT * FROM products ORDER BY sales_count DESC LIMIT 4";
    try {
        const [results_new_arrival, results_top_selling] = await Promise.all([
            db.query(query_new_arrival),
            db.query(query_top_selling)
        ]);
        result.new_arrival = results_new_arrival.rows;
        result.top_selling = results_top_selling.rows;
        return result;
    } catch (error) {
        console.log(error);
        return { new_arrival: [], top_selling: [] };
    }
};

exports.getProduct = async () => {
    const query = "SELECT * FROM product";
    const results = await db.query(query);
    return results.rows;
};

exports.getProductCategory = async (page, limit) => {
    const query = "SELECT * FROM products ORDER BY id ASC LIMIT $1 OFFSET $2";
    const countQuery = "SELECT COUNT(*) AS total FROM products";
    try {
        const [results, countResult] = await Promise.all([
            db.query(query, [limit, (page - 1) * limit]),
            db.query(countQuery)
        ]);
        return { rows: results.rows, totalCount: parseInt(countResult.rows[0].total) };
    } catch (error) {
        console.log(error);
        return { rows: [], totalCount: 0 };
    }
};
