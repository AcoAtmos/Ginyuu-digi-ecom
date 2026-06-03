const service = require("./order.service");

exports.list = async (req, res) => {
    try {
        const { search, status, sort, page, limit } = req.query;
        const result = await service.getList({ search, status, sort, page, limit });
        res.status(200).json(result);
    } catch (error) {
        console.error("order list error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.detail = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await service.getDetail(id);
        if (!result) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error("order detail error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { user_id, payment_method, items, discount_amount } = req.body;
        if (!user_id || !payment_method || !items || !items.length) {
            return res.status(400).json({ success: false, message: "user_id, payment_method, and items are required" });
        }
        const result = await service.create({ user_id, payment_method, items, discount_amount: discount_amount || 0 });
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        console.error("order create error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const fields = req.body;
        const result = await service.update(id, fields);
        if (!result) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error("order update error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.remove = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await service.remove(id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }
        res.status(200).json({ success: true, message: "Order deleted successfully" });
    } catch (error) {
        console.error("order delete error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
