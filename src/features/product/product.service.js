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

exports.getProductsByIds = async (ids) => {
    if (!ids || ids.length === 0) return [];
    const query = "SELECT * FROM product WHERE id = ANY($1::int[])";
    const results = await db.query(query, [ids]);
    return results.rows;
};

exports.getRecommendations = async (cartIds, limit = 3) => {
    if (!cartIds || cartIds.length === 0) return [];

    try {
        const query = `
            WITH cart_tags AS (
                SELECT DISTINCT unnest(tags) AS tag
                FROM product
                WHERE id = ANY($1::int[]) AND tags IS NOT NULL
            )
            SELECT p.*,
                (
                    SELECT COUNT(*)
                    FROM unnest(p.tags) t
                    WHERE t IN (SELECT tag FROM cart_tags)
                ) AS match_count
            FROM product p
            WHERE p.id != ALL($1::int[])
                AND p.tags IS NOT NULL
                AND p.tags && ARRAY(SELECT tag FROM cart_tags)
            ORDER BY match_count DESC
            LIMIT $2
        `;
        const results = await db.query(query, [cartIds, limit]);
        return results.rows;
    } catch (error) {
        console.error("getRecommendations error:", error);
        return [];
    }
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
