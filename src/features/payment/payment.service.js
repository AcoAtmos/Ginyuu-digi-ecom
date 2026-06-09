const { db } = require("../../../db");
const { invoices, orders, orderItems, product, users, paymentGatewayTransactions } = require("../../../db/schema");
const { eq, desc, sql } = require("drizzle-orm");

exports.getInvoiceByNumber = async (invoice_number) => {
    let result = { code: 200, status: "success", message: "Success", data: {} };
    try {
        const invoiceResult = await db.execute(sql`
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
            WHERE i.invoice_number = ${invoice_number}
        `);
        if (invoiceResult.rows.length === 0) {
            return { code: 404, status: "failed", message: "Invoice not found", data: null };
        }
        const itemsResult = await db.execute(sql`
            SELECT p.name AS product_name, p.slug AS product_slug, oi.price
            FROM order_items oi
            JOIN product p ON oi.product_id = p.id
            WHERE oi.order_id = ${invoiceResult.rows[0].order_id}
        `);
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
    const [result] = await db.insert(paymentGatewayTransactions).values({
        invoiceId,
        gateway: 'klikqris',
        gatewayOrderId,
        signature,
        qrisUrl,
        directUrl,
        amount,
        status: 'pending',
        gatewayExpiredAt: expiredAt ? new Date(expiredAt) : null
    }).returning({ id: paymentGatewayTransactions.id });
    return result.id;
}

exports.getGatewayTransactionByInvoiceId = async (invoiceId) =>{
    const [result] = await db.select().from(paymentGatewayTransactions).where(eq(paymentGatewayTransactions.invoiceId, invoiceId)).orderBy(desc(paymentGatewayTransactions.createdAt)).limit(1);
    return result;
}

exports.updateInvoiceToPaid = async (invoiceId) =>{
    await db.transaction(async (tx) => {
        const [inv] = await tx.select({ orderId: invoices.orderId }).from(invoices).where(eq(invoices.id, invoiceId));
        if (!inv) {
            throw new Error("Invoice not found");
        }
        await tx.update(invoices).set({ statusPayment: 'paid' }).where(eq(invoices.id, invoiceId));
        await tx.update(orders).set({ status: 'completed' }).where(eq(orders.id, inv.orderId));
    });
}

