const promoService = require("./promo_service");

exports.validatePromo = async (req, res) => {
    try {
        const { code, subtotal } = req.body;

        if (!code) {
            return res.status(400).json({
                status: "error",
                message: "Promo code is required"
            });
        }

        if (!subtotal || subtotal <= 0) {
            return res.status(400).json({
                status: "error",
                message: "Valid subtotal is required"
            });
        }

        const result = await promoService.validatePromo(code, subtotal);

        if (result.valid) {
            res.status(200).json({
                status: "success",
                message: result.message,
                data: {
                    code: result.code,
                    discount_pct: result.discount_pct,
                    discount_amount: result.discount_amount
                }
            });
        } else {
            res.status(400).json({
                status: "error",
                message: result.message
            });
        }
    } catch (err) {
        console.error("Validate promo error:", err);
        res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }
}
