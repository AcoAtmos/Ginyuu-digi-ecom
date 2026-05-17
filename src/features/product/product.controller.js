const service = require("./product.service");

exports.get_all_product = async (req, res) => {
    try {
        const results = await service.getProduct();
        return res.status(200).json({ success: true, message: "success", data: results });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.get_product = async (req, res) => {
    try {
        const slug = req.params.slug || "";
        if (!slug || slug === "") {
            const results = await service.getProduct();
            return res.status(200).json({ success: true, message: "success", data: results });
        } else {
            const results = await service.getProductbyslug(slug);
            return res.status(200).json({ success: true, message: "success", data: results });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.get_product_home = async (req, res) => {
    try {
        const results = await service.getProductHome();
        return res.status(200).json({ success: true, message: "success", data: results });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.get_recommendations = async (req, res) => {
    try {
        const cartIds = req.query.cart_ids
            ? req.query.cart_ids.split(",").map(Number).filter((id) => !isNaN(id))
            : [];
        const limit = parseInt(req.query.limit) || 3;

        if (cartIds.length === 0) {
            return res.status(200).json({ success: true, message: "success", data: [] });
        }

        const results = await service.getRecommendations(cartIds, limit);
        return res.status(200).json({ success: true, message: "success", data: results });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.get_products_batch = async (req, res) => {
    try {
        const ids = req.body.ids || [];
        if (ids.length === 0) {
            return res.status(200).json({ success: true, message: "success", data: [] });
        }
        const results = await service.getProductsByIds(ids);
        return res.status(200).json({ success: true, message: "success", data: results });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.get_product_category = async (req, res) => {
    try {
        const page = req.params.page || 1;
        const limit = req.params.limit || 12;
        const results = await service.getProductCategory(page, limit);
        return res.status(200).json({ success: true, message: "success", data: results });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
