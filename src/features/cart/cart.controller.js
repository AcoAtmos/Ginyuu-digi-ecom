const cartService = require("./cart.service");

exports.getCart = async (req, res) => {
    try {
        const data = await cartService.getCart(req.user.id);
        res.status(200).json({ status: "success", data });
    } catch (err) {
        console.error('GET /api/cart ERROR:', err);
        res.status(500).json({ status: "error", message: err.message });
    }
};

exports.addItem = async (req, res) => {
    try {
        const { product_id } = req.body;
        if (!product_id) return res.status(400).json({ status: "error", message: "Product ID is required" });
        
        const result = await cartService.addItem(req.user.id, product_id);
        if (result.isDuplicate) {
            return res.status(200).json({ status: "duplicate", message: "This product is already in your cart" });
        }
        const data = await cartService.getCart(req.user.id);
        res.status(200).json({ status: "success", message: "Item added to cart", data });
    } catch (err) {
        res.status(err.message === "Product not found" ? 404 : 500).json({ status: "error", message: err.message });
    }
};

exports.removeItem = async (req, res) => {
    try {
        const { product_id } = req.params;
        await cartService.removeItem(req.user.id, product_id);
        const data = await cartService.getCart(req.user.id);
        res.status(200).json({ status: "success", message: "Item removed from cart", data });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
};

exports.syncCart = async (req, res) => {
    try {
        const { cart } = req.body;
        if (!Array.isArray(cart)) return res.status(400).json({ status: "error", message: "Cart must be an array" });
        const syncResult = await cartService.syncCart(req.user.id, cart);
        const data = await cartService.getCart(req.user.id);
        res.status(200).json({ status: "success", message: "Cart synced successfully", sync: syncResult, data });
    } catch (err) {
        console.error('Sync cart ERROR:', err);
        res.status(500).json({ status: "error", message: err.message });
    }
};
