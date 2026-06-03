const { db } = require("../../config/database");

exports.getCart = async (userId) => {
    const query = `
        SELECT 
            c.id, c.product_id, c.added_at,
            p.name, p.slug, p.price, p.discount, p.category, p.preview
        FROM cart_items c
        JOIN product p ON c.product_id = p.id
        WHERE c.user_id = $1
        ORDER BY c.added_at DESC
    `;
    const results = await db.query(query, [userId]);
    const items = results.rows.map(row => ({
        id: row.product_id,
        cartItemId: row.id,
        name: row.name,
        slug: row.slug,
        category: row.category,
        image: row.preview,
        price: row.price,
        discount: row.discount || 0,
        subtotal: row.price
    }));
    const totalPrice = items.reduce((sum, item) => sum + item.subtotal, 0);
    return { items, totalPrice, totalItems: items.length };
};

exports.addItem = async (userId, productId) => {
    const productCheck = await db.query("SELECT id FROM product WHERE id = $1", [productId]);
    if (productCheck.rows.length === 0) throw new Error("Product not found");
    try {
        const query = `
            INSERT INTO cart_items (user_id, product_id)
            VALUES ($1, $2)
            ON CONFLICT (user_id, product_id) DO NOTHING
            RETURNING id
        `;
        const result = await db.query(query, [userId, productId]);
        if (result.rows.length === 0) return { isDuplicate: true };
        return { isDuplicate: false };
    } catch (err) {
        throw err;
    }
};

exports.removeItem = async (userId, productId) => {
    await db.query("DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2", [userId, productId]);
    return { success: true };
};

exports.syncCart = async (userId, guestCart) => {
    if (!Array.isArray(guestCart) || guestCart.length === 0) return;
    const results = { added: 0, skipped: 0 };
    for (const item of guestCart) {
        if (!item.id) continue;
        try {
            const result = await this.addItem(userId, item.id);
            if (result.isDuplicate) results.skipped++;
            else results.added++;
        } catch (err) {
            console.warn(`Failed to sync item ${item.id}:`, err.message);
            results.skipped++;
        }
    }
    return results;
};
