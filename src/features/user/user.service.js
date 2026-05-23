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

exports.update_my_profile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { username, phone } = req.body;

        const query = `UPDATE users SET username = $1, phone = $2 WHERE id = $3 RETURNING id, username, email, phone, image_url, role, created_at`;
        const { rows } = await db.query(query, [username, phone, userId]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({ success: true, data: rows[0] });
    } catch (error) {
        console.error("update_my_profile error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.get_my_purchases = async (req, res) => {
    try {
        const user = req.user;
        const isAdmin = user.role === 'ADMIN';
        const { search, status, sort = 'desc', page = 1, limit = 10 } = req.query;

        if (isAdmin) {
            const orderDir = sort === 'asc' ? 'ASC' : 'DESC';
            const adminQuery = `
                SELECT o.id as order_id,
                       o.created_at as purchase_date,
                       o.subtotal,
                       o.discount_amount,
                       o.unique_num,
                       o.total as total_price,
                       o.payment_method,
                       o.status as order_status,
                       i.invoice_number,
                       i.status_payment,
                       i.expires_at,
                       u.username as buyer,
                       COALESCE(
                         json_agg(
                           json_build_object(
                             'product_name', p.name,
                             'product_slug', p.slug,
                             'price', oi.price
                           ) ORDER BY oi.id
                         ) FILTER (WHERE p.id IS NOT NULL),
                         '[]'::json
                       ) as items
                FROM orders o
                LEFT JOIN invoices i ON i.order_id = o.id
                JOIN order_items oi ON oi.order_id = o.id
                JOIN product p ON oi.product_id = p.id
                JOIN users u ON o.user_id = u.id
                GROUP BY o.id, i.id, u.id
                ORDER BY o.created_at ${orderDir}
            `;
            const { rows } = await db.query(adminQuery);
            return res.status(200).json({ success: true, data: rows });
        }

        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
        const offset = (pageNum - 1) * limitNum;
        const orderDir = sort === 'asc' ? 'ASC' : 'DESC';

        const searchPattern = search && search.trim() ? `%${search.trim()}%` : null;
        const statusFilter = status && status.trim() ? status.trim() : null;

        // Count total matching orders
        const countQuery = `
            SELECT COUNT(DISTINCT o.id)
            FROM orders o
            LEFT JOIN invoices i ON i.order_id = o.id
            WHERE o.user_id = $1
              AND ($2::text IS NULL OR i.invoice_number ILIKE $2
                OR EXISTS (
                  SELECT 1 FROM order_items oi2
                  JOIN product p2 ON oi2.product_id = p2.id
                  WHERE oi2.order_id = o.id AND p2.name ILIKE $2
                ))
              AND ($3::text IS NULL OR o.status = $3)
        `;
        const countResult = await db.query(countQuery, [user.id, searchPattern, statusFilter]);
        const total = parseInt(countResult.rows[0].count);

        // Fetch paginated data
        const dataQuery = `
            SELECT o.id as order_id,
                   o.created_at as purchase_date,
                   o.subtotal,
                   o.discount_amount,
                   o.unique_num,
                   o.total as total_price,
                   o.payment_method,
                   o.status as order_status,
                   i.invoice_number,
                   i.status_payment,
                   i.expires_at,
                   COALESCE(
                     json_agg(
                       json_build_object(
                         'product_name', p.name,
                         'product_slug', p.slug,
                         'price', oi.price
                       ) ORDER BY oi.id
                     ) FILTER (WHERE p.id IS NOT NULL),
                     '[]'::json
                   ) as items
            FROM orders o
            LEFT JOIN invoices i ON i.order_id = o.id
            JOIN order_items oi ON oi.order_id = o.id
            JOIN product p ON oi.product_id = p.id
            WHERE o.user_id = $1
              AND ($2::text IS NULL OR i.invoice_number ILIKE $2
                OR EXISTS (
                  SELECT 1 FROM order_items oi2
                  JOIN product p2 ON oi2.product_id = p2.id
                  WHERE oi2.order_id = o.id AND p2.name ILIKE $2
                ))
              AND ($3::text IS NULL OR o.status = $3)
            GROUP BY o.id, i.id
            ORDER BY o.created_at ${orderDir}
            LIMIT $4 OFFSET $5
        `;
        const { rows } = await db.query(dataQuery, [user.id, searchPattern, statusFilter, limitNum, offset]);

        res.status(200).json({
            success: true,
            data: rows,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        });
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
