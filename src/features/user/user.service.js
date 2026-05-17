const { db } = require("../../config/database");

exports.get_profile = async (req, res) => {
    try {
        const user = req.user;
        console.log("user : ", user);
        const role = user.role;
        if (role != 'MEMBER') {
            return res.status(403).json({ success: false, message: "You are not authorized to access this resource" });
        }
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.get_profile_by_username = async (username) => {
    const query = `SELECT id, username, email, phone, image_url, role, created_at FROM users WHERE username = $1`;
    const { rows } = await db.query(query, [username]);
    return rows[0];
};

exports.get_my_profile = async (req, res) => {
    try {
        const user = req.user;
        console.log("get_my_profile called, user:", user);
        const query = `SELECT id, username, email, phone, image_url, role, created_at FROM users WHERE id = $1`;
        const { rows } = await db.query(query, [user.id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.status(200).json({ success: true, data: rows[0] });
    } catch (error) {
        console.error("get_my_profile error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.get_my_purchases = async (req, res) => {
    try {
        const user = req.user;
        console.log("get_my_purchases called, user:", user);
        let query;
        const isAdmin = user.role === 'admin';
        if (isAdmin) {
            query = `
                SELECT o.id as order_id, o.created_at as purchase_date,
                       u.username as buyer, p.name as product_name,
                       p.slug as product_slug, oi.price as item_price,
                       o.subtotal, i.total as total_price, i.invoice_number,
                       i.expires_at, o.payment_method, o.status as order_status,
                       i.status_payment
                FROM orders o
                JOIN order_items oi ON oi.order_id = o.id
                JOIN product p ON oi.product_id = p.id
                LEFT JOIN invoices i ON i.order_id = o.id
                JOIN users u ON o.user_id = u.id
                ORDER BY o.created_at DESC
            `;
            const { rows } = await db.query(query);
            return res.status(200).json({ success: true, data: rows });
        }
        query = `
            SELECT o.id as order_id, 
                   o.created_at as purchase_date,
                   p.name as product_name,
                   u.username as buyer, 
                   p.slug as product_slug,
                   oi.price as item_price, 
                   o.subtotal, 
                   i.total as total_price,
                   i.invoice_number, 
                   i.expires_at,   
                   o.payment_method, 
                   o.status as order_status,
                   i.status_payment
            FROM orders o
            JOIN order_items oi ON oi.order_id = o.id
            JOIN product p ON oi.product_id = p.id
            JOIN users u ON o.user_id = u.id
            LEFT JOIN invoices i ON i.order_id = o.id
            WHERE o.user_id = $1
            ORDER BY o.created_at DESC
        `;
        const { rows } = await db.query(query, [user.id]);
        console.log("Purchases rows:", rows);
        res.status(200).json({ success: true, data: rows, ket: "ini adalah data get my purchases" });
    } catch (error) {
        console.error("get_my_purchases error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.get_all_purchases = async (req, res) => {
    try {
        const user = req.user;
        if (user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, message: "Admin only" });
        }
        const query = `
            SELECT o.id as order_id, o.created_at as purchase_date,
                   u.username as buyer_username, u.email as buyer_email,
                   p.name as product_name, p.slug as product_slug,
                   oi.price as item_price, o.subtotal, i.total as total_price,
                   i.invoice_number, i.expires_at, o.payment_method, o.status as order_status,
                   i.status_payment
            FROM orders o
            JOIN users u ON o.user_id = u.id
            JOIN order_items oi ON oi.order_id = o.id
            JOIN product p ON oi.product_id = p.id
            LEFT JOIN invoices i ON i.order_id = o.id
            ORDER BY o.created_at DESC
        `;
        const { rows } = await db.query(query);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("get_all_purchases error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
