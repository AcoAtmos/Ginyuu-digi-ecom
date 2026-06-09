const { db } = require("../../config/db");
const { eq, sql, inArray } = require("drizzle-orm");
const { users, product, orders, orderItems, invoices } = require("../../../db/schema");

exports.getList = async ({ search, status, sort, page, limit }) => {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));
    const offset = (pageNum - 1) * limitNum;
    const orderDir = sort === 'asc' ? 'ASC' : 'DESC';
    const searchPattern = search && search.trim() ? `%${search.trim()}%` : null;
    const statusFilter = status && status.trim() ? status.trim() : null;

    const searchCondition = searchPattern
        ? sql`(i.invoice_number ILIKE ${searchPattern} OR u.username ILIKE ${searchPattern} OR u.email ILIKE ${searchPattern})`
        : sql`TRUE`;
    const statusCondition = statusFilter
        ? sql`o.status = ${statusFilter}`
        : sql`TRUE`;

    const countResult = await db.execute(sql`
        SELECT COUNT(DISTINCT o.id)
        FROM orders o
        LEFT JOIN invoices i ON i.order_id = o.id
        JOIN users u ON o.user_id = u.id
        WHERE ${searchCondition}
          AND ${statusCondition}
    `);
    const total = parseInt(countResult.rows[0].count);

    const result = await db.execute(sql`
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
        WHERE ${searchCondition}
          AND ${statusCondition}
        GROUP BY o.id, i.id, u.id
        ORDER BY o.created_at ${sql.raw(orderDir)}
        LIMIT ${limitNum} OFFSET ${offset}
    `);

    return {
        success: true,
        data: result.rows,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum)
        }
    };
};

exports.getDetail = async (id) => {
    const [orderResult, itemsResult, invoiceResult] = await Promise.all([
        db.execute(sql`SELECT o.*, u.username, u.email, u.phone FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ${id}`),
        db.execute(sql`SELECT oi.*, p.name as product_name, p.slug as product_slug FROM order_items oi JOIN product p ON oi.product_id = p.id WHERE oi.order_id = ${id} ORDER BY oi.id`),
        db.execute(sql`SELECT * FROM invoices WHERE order_id = ${id}`),
    ]);

    const [order] = orderResult.rows;
    if (!order) return null;
    const items = itemsResult.rows;
    const [invoice] = invoiceResult.rows;

    return { order, items, invoice };
};

exports.create = async ({ user_id, payment_method, items, discount_amount }) => {
    const ids = items.map(i => i.product_id);
    const products = await db.select({ id: product.id, name: product.name, price: product.price }).from(product).where(inArray(product.id, ids));

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

    const [order] = (await db.execute(sql`
        INSERT INTO orders (user_id, payment_method, subtotal, discount_amount, total, status)
        VALUES (${user_id}, ${payment_method}, ${subtotal}, ${discount_amount}, ${total}, 'pending')
        RETURNING *
    `)).rows;

    for (const oi of orderItems) {
        await db.execute(sql`
            INSERT INTO order_items (order_id, product_id, price) VALUES (${order.id}, ${oi.product_id}, ${oi.price})
        `);
    }

    const invoice_number = "INV-" + Date.now() + user_id + "-" + order.id;
    const expires_at = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const [invoice] = (await db.execute(sql`
        INSERT INTO invoices (order_id, invoice_number, discount_amount, total, expires_at, status_payment)
        VALUES (${order.id}, ${invoice_number}, ${discount_amount}, ${total}, ${expires_at}, 'pending')
        RETURNING *
    `)).rows;

    return { order, invoice, items: orderItems };
};

exports.update = async (id, fields) => {
    const allowed = ['payment_method', 'status', 'discount_amount'];

    // updated status 
    if (fields.status) {
        const validStatuses = ['pending', 'completed', 'cancelled'];
        if (!validStatuses.includes(fields.status)) {
            throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }
    }

    // if items are provided then do a full recalculation in a transaction
    if (fields.items && Array.isArray(fields.items) && fields.items.length > 0) {
        const ids = fields.items.map(i => i.product_id);
        const products = await db.select({ id: product.id, name: product.name, price: product.price }).from(product).where(inArray(product.id, ids));
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

        return await db.transaction(async (tx) => {
            // Delete old items
            await tx.execute(sql`DELETE FROM order_items WHERE order_id = ${id}`);

            // Insert new items
            for (const oi of orderItems) {
                await tx.execute(sql`INSERT INTO order_items (order_id, product_id, price) VALUES (${id}, ${oi.product_id}, ${oi.price})`);
            }

            // Build update SET for other fields + subtotal + total
            const otherFields = allowed.filter(k => fields[k] !== undefined);
            const setItems = [];
            for (const k of otherFields) {
                setItems.push(sql`${sql.raw(k)} = ${fields[k]}`);
            }
            setItems.push(sql`subtotal = ${subtotal}`);
            setItems.push(sql`total = ${total}`);

            if (fields.created_at) {
                setItems.push(sql`created_at = ${fields.created_at}`);
            }

            const [order] = (await tx.execute(sql`UPDATE orders SET ${sql.join(setItems, sql`, `)} WHERE id = ${id} RETURNING *`)).rows;

            if (fields.status === 'cancelled') {
                await tx.execute(sql`UPDATE invoices SET status_payment = 'cancelled' WHERE order_id = ${id} AND status_payment = 'pending'`);
            }

            return order || null;
        });
    }

    // No items — update scalar fields only
    const setItems = [];

    for (const key of allowed) {
        if (fields[key] !== undefined) {
            setItems.push(sql`${sql.raw(key)} = ${fields[key]}`);
        }
    }

    if (fields.created_at) {
        setItems.push(sql`created_at = ${fields.created_at}`);
    }

    if (setItems.length === 0) {
        const [order] = (await db.execute(sql`SELECT * FROM orders WHERE id = ${id}`)).rows;
        return order || null;
    }

    if (fields.discount_amount !== undefined) {
        const [current] = (await db.execute(sql`SELECT subtotal FROM orders WHERE id = ${id}`)).rows;
        if (current) {
            const newTotal = Math.max(0, current.subtotal - fields.discount_amount);
            setItems.push(sql`total = ${newTotal}`);
        }
    }

    const [order] = (await db.execute(sql`UPDATE orders SET ${sql.join(setItems, sql`, `)} WHERE id = ${id} RETURNING *`)).rows;

    if (order && fields.status === 'cancelled') {
        await db.execute(sql`UPDATE invoices SET status_payment = 'cancelled' WHERE order_id = ${id} AND status_payment = 'pending'`);
    }

    return order || null;
};

exports.remove = async (id) => {
    const [order] = await db.select({ id: orders.id }).from(orders).where(eq(orders.id, id));
    if (!order) return false;
    await db.delete(orders).where(eq(orders.id, id));
    return true;
};
