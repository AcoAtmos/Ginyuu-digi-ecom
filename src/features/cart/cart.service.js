const { db } = require("../../../db");
const { product, cartItems } = require("../../../db/schema");
const { eq, and, desc } = require("drizzle-orm");

exports.getCart = async (userId) => {
    const rows = await db.select({
        id: cartItems.id,
        productId: cartItems.productId,
        addedAt: cartItems.addedAt,
        name: product.name,
        slug: product.slug,
        price: product.price,
        discount: product.discount,
        category: product.category,
        preview: product.preview
    }).from(cartItems).leftJoin(product, eq(cartItems.productId, product.id)).where(eq(cartItems.userId, userId)).orderBy(desc(cartItems.addedAt));
    const items = rows.map(row => ({
        id: row.productId,
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
    const [productCheck] = await db.select({ id: product.id }).from(product).where(eq(product.id, productId));
    if (!productCheck) throw new Error("Product not found");
    try {
        const [result] = await db.insert(cartItems).values({ userId, productId }).onConflictDoNothing().returning({ id: cartItems.id });
        if (!result) return { isDuplicate: true };
        return { isDuplicate: false };
    } catch (err) {
        throw err;
    }
};

exports.removeItem = async (userId, productId) => {
    await db.delete(cartItems).where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId)));
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
