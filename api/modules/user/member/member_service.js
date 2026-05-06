const {db} = require('../../../common/helper');

//get user profile from token
exports.get_profile = async (req, res) => {
    try {
        const user = req.user;
        console.log("user : ",user);
        const role = user.role;
        if(role != 'MEMBER'){
            return res.status(403).json({
                success: false,
                message: "You are not authorized to access this resource"
            });
        }
        res.status(200).json({
            success: true,
            data: user 
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

// get user profile by username (public)
exports.get_profile_by_username = async (username) => {
    const query = `SELECT id, username, email, phone, image_url, role, created_at FROM users WHERE username = $1`;
    const {rows} = await db.query(query, [username]);
    return rows[0];
}

// get my profile (with full details)
exports.get_my_profile = async (req, res) => {
    try {
        const user = req.user;
        console.log("get_my_profile called, user:", user);
        
        const query = `SELECT id, username, email, phone, image_url, role, created_at FROM users WHERE id = $1`;
        const {rows} = await db.query(query, [user.id]);
        
        if(rows.length === 0){
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        
        res.status(200).json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error("get_my_profile error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

// get my purchases (orders + invoice + product)
exports.get_my_purchases = async (req, res) => {
    try {
        const user = req.user;
        console.log("get_my_purchases called, user:", user);
        
        let query;
        const isAdmin = user.role === 'admin';
        
        if (isAdmin) {
            // Admin sees all purchases with buyer info
            query = `
                SELECT 
                    o.id as order_id,
                    o.created_at as purchase_date,
                    u.username as buyer,
                    p.title as product_name,
                    p.slug as product_slug,
                    o.amount as quantity,
                    o.subtotal,
                    i.total as total_price,
                    i.invoice_number,
                    i.issued_at,
                    o.payment_method,
                    o.payment_status
                FROM orders o
                JOIN products p ON o.product_id = p.id
                LEFT JOIN invoices i ON i.order_id = o.id
                JOIN users u ON o.user_id = u.id
                ORDER BY o.created_at DESC
            `;
            const {rows} = await db.query(query);
            return res.status(200).json({ success: true, data: rows });
        }
        
        // Member sees only their own purchases
        query = `
            SELECT 
                o.id as order_id,
                o.created_at as purchase_date,
                p.title as product_name,
                p.slug as product_slug,
                o.amount as quantity,
                o.subtotal,
                i.total as total_price,
                i.invoice_number,
                i.issued_at,
                o.payment_method,
                o.payment_status
            FROM orders o
            JOIN products p ON o.product_id = p.id
            LEFT JOIN invoices i ON i.order_id = o.id
            WHERE o.user_id = $1
            ORDER BY o.created_at DESC
        `;
        const {rows} = await db.query(query, [user.id]);
        console.log("Purchases rows:", rows);
        
        res.status(200).json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error("get_my_purchases error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

// get all purchases for admin
exports.get_all_purchases = async (req, res) => {
    try {
        const user = req.user;
        if(user.role !== 'ADMIN'){
            return res.status(403).json({
                success: false,
                message: "Admin only"
            });
        }
        const query = `
            SELECT 
                o.id as order_id,
                o.created_at as purchase_date,
                u.username as buyer_username,
                u.email as buyer_email,
                p.title as product_name,
                p.slug as product_slug,
                o.amount as quantity,
                o.subtotal,
                i.total as total_price,
                i.invoice_number,
                i.issued_at,
                o.payment_method,
                o.payment_status
            FROM orders o
            JOIN users u ON o.user_id = u.id
            JOIN products p ON o.product_id = p.id
            LEFT JOIN invoices i ON i.order_id = o.id
            ORDER BY o.created_at DESC
        `;
        const {rows} = await db.query(query);
        res.status(200).json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error("get_all_purchases error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}