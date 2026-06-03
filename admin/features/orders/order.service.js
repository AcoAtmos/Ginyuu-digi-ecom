const { db } = require("../../config/db");

exports.getList = async ({ search, status, sort, page, limit }) => {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));
    const offset = (pageNum - 1) * limitNum;
    const orderDir = sort === 'asc' ? 'ASC' : 'DESC';
    const searchPattern = search && search.trim() ? `%${search.trim()}%` : null;
    const statusFilter = status && status.trim() ? status.trim() : null;

    const countQuery = `
        SELECT COUNT(DISTINCT o.id)
        FROM orders o
        LEFT JOIN invoices i ON i.order_id = o.id
        JOIN users u ON o.user_id = u.id
        WHERE ($1::text IS NULL OR i.invoice_number ILIKE $1
            OR u.username ILIKE $1 OR u.email ILIKE $1)
          AND ($2::text IS NULL OR o.status = $2)
    `;
    const countResult = await db.query(countQuery, [searchPattern, statusFilter]);
    const total = parseInt(countResult.rows[0].count);

    const dataQuery = `
        SELECT o.id as order_id,
               o.created_at as purchase_date,
               o.subtotal,
               o.discount_amount,
               o.unique_num,
               o.total as total_price,
               o.payment_method,
               o.status as order_status,
               u.id as user_id,
               u.username as buyer_username,
               u.email as buyer_email,
               i.invoice_number,
               i.status_payment,
               i.expires_at,
               COALESCE(
                 json_agg(
                   json_build_object(
                     'product_id', p.id,
                     'product_name', p.name,
                     'product_slug', p.slug,
                     'price', oi.price
                   ) ORDER BY oi.id
                 ) FILTER (WHERE p.id IS NOT NULL),
                 '[]'::json
               ) as items
        FROM orders o
        JOIN users u ON o.user_id = u.id
        LEFT JOIN invoices i ON i.order_id = o.id
        JOIN order_items oi ON oi.order_id = o.id
        JOIN product p ON oi.product_id = p.id
        WHERE ($1::text IS NULL OR i.invoice_number ILIKE $1
            OR u.username ILIKE $1 OR u.email ILIKE $1)
          AND ($2::text IS NULL OR o.status = $2)
        GROUP BY o.id, i.id, u.id
        ORDER BY o.created_at ${orderDir}
        LIMIT $3 OFFSET $4
    `;
    const { rows } = await db.query(dataQuery, [searchPattern, statusFilter, limitNum, offset]);

    return {
        success: true,
        data: rows,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum)
        }
    };
};

exports.getDetail = async (id) => {
    const orderQuery = `
        SELECT o.*, u.username, u.email, u.phone
        FROM orders o
        JOIN users u ON o.user_id = u.id
        WHERE o.id = $1
    `;
    const { rows: [order] } = await db.query(orderQuery, [id]);
    if (!order) return null;

    const itemsQuery = `
        SELECT oi.*, p.name as product_name, p.slug as product_slug
        FROM order_items oi
        JOIN product p ON oi.product_id = p.id
        WHERE oi.order_id = $1
        ORDER BY oi.id
    `;
    const { rows: items } = await db.query(itemsQuery, [id]);

    const invoiceQuery = `
        SELECT * FROM invoices WHERE order_id = $1
    `;
    const { rows: [invoice] } = await db.query(invoiceQuery, [id]);

    return { order, items, invoice };
};

exports.create = async ({ user_id, payment_method, items, discount_amount }) => {
    const ids = items.map(i => i.product_id);
    const productQuery = `SELECT id, name, price FROM product WHERE id = ANY($1)`;
    const { rows: products } = await db.query(productQuery, [ids]);

    const priceMap = {};
    for (const p of products) {
        priceMap[p.id] = p.price;
    }

    let subtotal = 0;
    const orderItems = items.map(item => {
        const price = item.price || priceMap[item.product_id] || 0;
        subtotal += price;
        return { product_id: item.product_id, price };
    });

    const total = Math.max(0, subtotal - discount_amount);

    const insertOrder = `
        INSERT INTO orders (user_id, payment_method, subtotal, discount_amount, total, status)
        VALUES ($1, $2, $3, $4, $5, 'pending')
        RETURNING *
    `;
    const { rows: [order] } = await db.query(insertOrder, [user_id, payment_method, subtotal, discount_amount, total]);

    for (const oi of orderItems) {
        await db.query(
            `INSERT INTO order_items (order_id, product_id, price) VALUES ($1, $2, $3)`,
            [order.id, oi.product_id, oi.price]
        );
    }

    const invoice_number = "INV-" + Date.now() + user_id + "-" + order.id;
    const expires_at = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const insertInvoice = `
        INSERT INTO invoices (order_id, invoice_number, discount_amount, total, expires_at, status_payment)
        VALUES ($1, $2, $3, $4, $5, 'pending')
        RETURNING *
    `;
    const { rows: [invoice] } = await db.query(insertInvoice, [order.id, invoice_number, discount_amount, total, expires_at]);

    return { order, invoice, items: orderItems };
};

exports.update = async (id, fields) => {
    const allowed = ['payment_method', 'status', 'discount_amount'];

    if (fields.status) {
        const validStatuses = ['pending', 'completed', 'cancelled'];
        if (!validStatuses.includes(fields.status)) {
            throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }
    }

    // if items are provided then do a full recalculation in a transaction
    if (fields.items && Array.isArray(fields.items) && fields.items.length > 0) {
        const ids = fields.items.map(i => i.product_id);
        const { rows: products } = await db.query(
            `SELECT id, name, price FROM product WHERE id = ANY($1)`, [ids]
        );
        const priceMap = {};
        for (const p of products) priceMap[p.id] = p.price;

        let subtotal = 0;
        const orderItems = fields.items.map(item => {
            const price = Number(item.price) || priceMap[item.product_id] || 0;
            subtotal += price;
            return { product_id: Number(item.product_id), price };
        });

        const discount = fields.discount_amount !== undefined ? Number(fields.discount_amount) : 0;
        const total = Math.max(0, subtotal - discount);

        const client = await db.connect();
        try {
            await client.query('BEGIN');

            // Delete old items
            await client.query(`DELETE FROM order_items WHERE order_id = $1`, [id]);

            // Insert new items
            for (const oi of orderItems) {
                await client.query(
                    `INSERT INTO order_items (order_id, product_id, price) VALUES ($1, $2, $3)`,
                    [id, oi.product_id, oi.price]
                );
            }

            // Build update SET for other fields + subtotal + total
            const otherFields = allowed.filter(k => fields[k] !== undefined);
            const setParts = [];
            const vals = [];
            let vi = 1;
            for (const k of otherFields) {
                setParts.push(`${k} = $${vi++}`);
                vals.push(fields[k]);
            }
            setParts.push(`subtotal = $${vi++}`);
            vals.push(subtotal);
            setParts.push(`total = $${vi++}`);
            vals.push(total);

            if (fields.created_at) {
                setParts.push(`created_at = $${vi++}`);
                vals.push(fields.created_at);
            }

            vals.push(id);
            const { rows: [order] } = await client.query(
                `UPDATE orders SET ${setParts.join(', ')} WHERE id = $${vi} RETURNING *`,
                vals
            );

            if (fields.status === 'cancelled') {
                await client.query(
                    `UPDATE invoices SET status_payment = 'cancelled' WHERE order_id = $1 AND status_payment = 'pending'`,
                    [id]
                );
            }

            await client.query('COMMIT');
            return order || null;
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    // No items — update scalar fields only
    const setClauses = [];
    const values = [];
    let idx = 1;

    for (const key of allowed) {
        if (fields[key] !== undefined) {
            setClauses.push(`${key} = $${idx++}`);
            values.push(fields[key]);
        }
    }

    if (fields.created_at) {
        setClauses.push(`created_at = $${idx++}`);
        values.push(fields.created_at);
    }

    if (setClauses.length === 0) {
        const { rows: [order] } = await db.query(`SELECT * FROM orders WHERE id = $1`, [id]);
        return order || null;
    }

    if (fields.discount_amount !== undefined) {
        const { rows: [current] } = await db.query(`SELECT subtotal FROM orders WHERE id = $1`, [id]);
        if (current) {
            const newTotal = Math.max(0, current.subtotal - fields.discount_amount);
            setClauses.push(`total = $${idx++}`);
            values.push(newTotal);
        }
    }

    values.push(id);
    const query = `UPDATE orders SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`;
    const { rows: [order] } = await db.query(query, values);

    if (order && fields.status === 'cancelled') {
        await db.query(
            `UPDATE invoices SET status_payment = 'cancelled' WHERE order_id = $1 AND status_payment = 'pending'`,
            [id]
        );
    }

    return order || null;
};

exports.remove = async (id) => {
    const { rows: [order] } = await db.query(`SELECT id FROM orders WHERE id = $1`, [id]);
    if (!order) return false;
    await db.query(`DELETE FROM orders WHERE id = $1`, [id]);
    return true;
};
