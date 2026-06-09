const { db } = require("../../../db");
const { product } = require("../../../db/schema");
const { eq, inArray, desc, asc, sql, count } = require("drizzle-orm");

exports.getProductbyslug = async (slug) => {
    const [result] = await db.select().from(product).where(eq(product.slug, slug));
    return result;
};

exports.getProductHome = async () => {
    const result = { new_arrival: [], top_selling: [] };
    try {
        const [results_new_arrival, results_top_selling] = await Promise.all([
            db.select().from(product).orderBy(desc(product.createdAt)).limit(4),
            db.select().from(product).orderBy(desc(product.salesCount)).limit(4)
        ]);
        result.new_arrival = results_new_arrival;
        result.top_selling = results_top_selling;
        return result;
    } catch (error) {
        console.log(error);
        return { new_arrival: [], top_selling: [] };
    }
};

exports.getProduct = async () => {
    const rows = await db.select().from(product);
    return rows;
};

exports.getProductsByIds = async (ids) => {
    if (!ids || ids.length === 0) return [];
    const rows = await db.select().from(product).where(inArray(product.id, ids));
    return rows;
};

exports.getRecommendations = async (cartIds, limit = 3) => {
    if (!cartIds || cartIds.length === 0) return [];

    try {
        const idArray = sql.join(cartIds.map(id => sql`${id}`), sql`, `);
        const result = await db.execute(sql`
            WITH cart_tags AS (
                SELECT DISTINCT unnest(tags) AS tag
                FROM product
                WHERE id = ANY(ARRAY[${idArray}]::int[]) AND tags IS NOT NULL
            )
            SELECT p.*,
                (
                    SELECT COUNT(*)
                    FROM unnest(p.tags) t
                    WHERE t IN (SELECT tag FROM cart_tags)
                ) AS match_count
            FROM product p
            WHERE p.id != ALL(ARRAY[${idArray}]::int[])
                AND p.tags IS NOT NULL
                AND p.tags && ARRAY(SELECT tag FROM cart_tags)
            ORDER BY match_count DESC
            LIMIT ${limit}
        `);
        return result.rows;
    } catch (error) {
        console.error("getRecommendations error:", error);
        return [];
    }
};

exports.getProductCategory = async (page, limit) => {
    try {
        const [rows, countResult] = await Promise.all([
            db.select().from(product).orderBy(asc(product.id)).limit(limit).offset((page - 1) * limit),
            db.select({ total: count() }).from(product)
        ]);
        return { rows, totalCount: countResult[0]?.total || 0 };
    } catch (error) {
        console.log(error);
        return { rows: [], totalCount: 0 };
    }
};
