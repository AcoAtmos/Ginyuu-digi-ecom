const { db } = require("../../config/database");

exports.getInvoiceByNumber = async (invoice_number) => {
    let result = { code: 200, status: "success", message: "Success", data: {} };
    try {
        const query = `
            SELECT i.id AS invoice_id, i.invoice_number, i.discount_amount, i.total, i.expires_at, i.status_payment, 
                o.id AS order_id, 
                o.subtotal, 
                o.payment_method, 
                o.created_at AS order_date,
                u.username, 
                u.email, 
                u.phone
            FROM invoices i
            JOIN orders o ON o.id = i.order_id
            JOIN users u ON u.id = o.user_id
            WHERE i.invoice_number = $1
        `;
        const invoiceResult = await db.query(query, [invoice_number]);
        if (invoiceResult.rows.length === 0) {
            return { code: 404, status: "failed", message: "Invoice not found", data: null };
        }
        const itemsQuery = `
            SELECT p.name AS product_name, p.slug AS product_slug, oi.price
            FROM order_items oi
            JOIN product p ON oi.product_id = p.id
            WHERE oi.order_id = $1
        `;
        const itemsResult = await db.query(itemsQuery, [invoiceResult.rows[0].order_id]);
        const invoiceData = invoiceResult.rows[0];
        invoiceData.items = itemsResult.rows;
        invoiceData.product_name = itemsResult.rows.map(r => r.product_name).join(', ');
        invoiceData.amount = itemsResult.rows.length;
        return { code: 200, status: "success", message: "Invoice found", data: invoiceData };
    } catch (err) {
        console.error("getInvoiceByNumber error:", err);
        return { code: 500, status: "failed", message: "Internal server error", data: null };
    }
};

// PAYMENT GATEWAY TRANSACTIONS 
exports.saveGatewayTransaction = async ({invoiceId, gatewayOrderId, signature, qrisUrl, directUrl, amount, expiredAt}) => {
    const query = `
        INSERT INTO payment_gateway_transactions 
            (invoice_id, gateway, gateway_order_id, signature, qris_url, direct_url, amount, status, gateway_expired_at)
        values ($1, 'klikqris', $2, $3, $4, $5, $6, 'pending', $7)
        RETURNING id
    `;
    const values = [
        invoiceId,
        gatewayOrderId,
        signature,
        qrisUrl,
        directUrl,
        amount,
        expiredAt
    ]
    const result = await db.query(query, values);
    return result.rows[0].id;
}

exports.getGatewayTransactionByInvoiceId = async (invoiceId) =>{
    const query = `
        SELECT * FROM payment_gateway_transactions WHERE invoice_id = $1 ORDER  BY created_at DESC LIMIT 1
    `;
    const result = await db.query(query, [invoiceId]);
    return result.rows[0];
}

exports.updateInvoiceToPaid = async (invoiceId) =>{
    const client = await db.connect();
    try {
        await client.query("BEGIN");
        const inv = await client.query("SELECT order_id FROM invoices WHERE id = $1", [invoiceId]);
        if (inv.rows.length === 0) {
            await client.query("ROLLBACK");
            throw new Error("Invoice not found");
        }
        await client.query("UPDATE invoices SET status_payment = 'paid' WHERE id = $1", [invoiceId]);
        await client.query("UPDATE orders SET status = 'completed' WHERE id = $1", [inv.rows[0].order_id]);
        await client.query("COMMIT");
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
}

