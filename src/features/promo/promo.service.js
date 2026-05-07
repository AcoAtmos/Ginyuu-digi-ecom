const { db } = require("../../config/database");

exports.validatePromo = async (promoCode, cartSubtotal) => {
    if (!promoCode) {
        return { valid: false, message: "No promo code provided" };
    }
    try {
        const query = `
            SELECT id, code, discount_pct, max_usage, used_count, expires_at, is_active
            FROM promo_codes WHERE UPPER(code) = UPPER($1) AND is_active = true
        `;
        const result = await db.query(query, [promoCode]);
        if (result.rows.length === 0) {
            return { valid: false, message: "Invalid promo code" };
        }
        const promo = result.rows[0];
        if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
            return { valid: false, message: "Promo code has expired" };
        }
        if (promo.max_usage && promo.used_count >= promo.max_usage) {
            return { valid: false, message: "Promo code usage limit reached" };
        }
        const discountAmount = Math.floor(cartSubtotal * parseFloat(promo.discount_pct));
        return {
            valid: true, code: promo.code,
            discount_pct: parseFloat(promo.discount_pct),
            discount_amount: discountAmount,
            message: `Promo ${promo.code} applied! ${parseInt(promo.discount_pct * 100)}% discount`
        };
    } catch (err) {
        console.error("Validate promo error:", err);
        return { valid: false, message: "Failed to validate promo code" };
    }
};

exports.incrementPromoUsage = async (promoId) => {
    if (!promoId) return;
    try {
        await db.query("UPDATE promo_codes SET used_count = used_count + 1 WHERE id = $1", [promoId]);
    } catch (err) {
        console.error("Failed to increment promo usage:", err);
    }
};
