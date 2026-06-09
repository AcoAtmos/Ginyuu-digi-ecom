const { db } = require("../../../db");
const { promoCodes } = require("../../../db/schema");
const { eq, and, sql } = require("drizzle-orm");

exports.validatePromo = async (promoCode, cartSubtotal) => {
    if (!promoCode) {
        return { valid: false, message: "No promo code provided" };
    }
    try {
        const [promo] = await db.select({
            id: promoCodes.id,
            code: promoCodes.code,
            discountPct: promoCodes.discountPct,
            maxUsage: promoCodes.maxUsage,
            usedCount: promoCodes.usedCount,
            expiresAt: promoCodes.expiresAt,
            isActive: promoCodes.isActive
        }).from(promoCodes).where(and(eq(sql`UPPER(${promoCodes.code})`, sql`UPPER(${promoCode})`), eq(promoCodes.isActive, true)));
        if (!promo) {
            return { valid: false, message: "Invalid promo code" };
        }
        if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
            return { valid: false, message: "Promo code has expired" };
        }
        if (promo.maxUsage && promo.usedCount >= promo.maxUsage) {
            return { valid: false, message: "Promo code usage limit reached" };
        }
        const discountAmount = Math.floor(cartSubtotal * parseFloat(promo.discountPct));
        return {
            valid: true, code: promo.code,
            discount_pct: parseFloat(promo.discountPct),
            discount_amount: discountAmount,
            message: `Promo ${promo.code} applied! ${parseInt(promo.discountPct * 100)}% discount`
        };
    } catch (err) {
        console.error("Validate promo error:", err);
        return { valid: false, message: "Failed to validate promo code" };
    }
};

exports.incrementPromoUsage = async (promoId) => {
    if (!promoId) return;
    try {
        await db.update(promoCodes).set({ usedCount: sql`${promoCodes.usedCount} + 1` }).where(eq(promoCodes.id, promoId));
    } catch (err) {
        console.error("Failed to increment promo usage:", err);
    }
};
