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

exports.sendOrderSuccessEmail = async (invoiceId) => {
    try {
        const result = await db.execute(sql`
            SELECT i.invoice_number, i.total, i.discount_amount, o.subtotal,
                o.payment_method, u.email, u.phone, u.username,
                oi.product_name, oi.price
            FROM invoices i
            JOIN orders o ON o.id = i.order_id
            JOIN users u ON u.id = o.user_id
            JOIN LATERAL (
                SELECT p.name AS product_name, oi2.price
                FROM order_items oi2
                JOIN product p ON p.id = oi2.product_id
                WHERE oi2.order_id = o.id
            ) oi ON TRUE
            WHERE i.id = ${invoiceId}
        `);

        const rows = result.rows;
        if (rows.length === 0) return;

        const email = rows[0].email;
        const username = rows[0].username;
        const invoiceNumber = rows[0].invoice_number;
        const subtotal = rows[0].subtotal;
        const discount = rows[0].discount_amount;
        const total = rows[0].total;
        const paymentMethod = rows[0].payment_method;
        const phone = rows[0].phone;

        const productListHtml = rows.map((r, i) => `
            <tr>
                <td style="padding:10px 0; border-bottom:${i < rows.length - 1 ? '1px solid #f0f0f0' : 'none'};">
                    <span style="font-size:15px;color:#333;">${r.product_name}</span>
                </td>
                <td align="right" style="padding:10px 0; border-bottom:${i < rows.length - 1 ? '1px solid #f0f0f0' : 'none'};">
                    <span style="font-size:15px;color:#333;">Rp ${Number(r.price).toLocaleString('id-ID')}</span>
                </td>
            </tr>
        `).join('');

        const messageEmail = `
            <div style="background-color:#f6f6f6; padding:40px 20px; font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
                <div style="max-width:640px; margin:0 auto; background:#ffffff; border-radius:24px; overflow:hidden;">
                    <div style="padding:40px 40px 0 40px; text-align:center;">
                        <div style="font-family:'Syne',sans-serif; font-size:28px; font-weight:800; letter-spacing:-1px; margin-bottom:4px;">
                            <span style="color:#111111;">GIN</span><span style="color:#999999;">YUU</span>
                        </div>
                        <div style="font-size:12px; color:#aaaaaa; letter-spacing:2px; margin-bottom:30px;">DIGITAL PRODUCTS</div>
                        <h1 style="margin:0 0 8px 0; font-size:24px; color:#111111; font-weight:700;">Payment Successful!</h1>
                        <p style="margin:0 0 4px 0; font-size:14px; color:#888888;">Invoice #${invoiceNumber}</p>
                    </div>

                    <div style="padding:40px;">
                        <p style="font-size:16px; line-height:1.8; color:#555555; margin:0 0 8px 0;">
                            Hi <strong>${username}</strong>,
                        </p>
                        <p style="font-size:15px; line-height:1.8; color:#666666; margin-bottom:35px;">
                            Thank you for your purchase at GINYUU. Your payment has been confirmed and your order is now complete. You can access your products anytime from your profile page.
                        </p>

                        <div style="border:1px solid #eeeeee; border-radius:18px; overflow:hidden; margin-bottom:28px;">
                            <div style="padding:18px 24px; background:#fafafa; border-bottom:1px solid #eeeeee;">
                                <h3 style="margin:0; font-size:13px; letter-spacing:1px; text-transform:uppercase; color:#999999;">Order Summary</h3>
                            </div>
                            <div style="padding:24px; font-size:15px; color:#444444;">
                                <table style="width:100%; border-collapse:collapse;">
                                    ${productListHtml}
                                </table>
                            </div>
                        </div>

                        <table style="width:100%; border-collapse:collapse; margin-bottom:30px; font-size:15px;">
                            <tr>
                                <td style="padding:6px 0; color:#777;">Subtotal</td>
                                <td align="right">Rp ${Number(subtotal).toLocaleString('id-ID')}</td>
                            </tr>
                            <tr>
                                <td style="padding:6px 0; color:#777;">Discount</td>
                                <td align="right" style="color:#999;">- Rp ${Number(discount).toLocaleString('id-ID')}</td>
                            </tr>
                            <tr>
                                <td colspan="2">
                                    <div style="border-top:1px dashed #dddddd; margin:16px 0;"></div>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding-top:10px; font-size:18px; font-weight:700; color:#111;">Total Paid</td>
                                <td align="right" style="padding-top:10px; font-size:24px; font-weight:800; color:#111;">
                                    Rp ${Number(total).toLocaleString('id-ID')}
                                </td>
                            </tr>
                            <tr>
                                <td style="padding-top:10px; color:#777;">Payment Method</td>
                                <td align="right" style="padding-top:10px; color:#555; text-transform:uppercase;">${paymentMethod}</td>
                            </tr>
                        </table>

                        <div style="text-align:center; margin-bottom:45px;">
                            <a href="https://wa.me/6281333477041"
                            style="background:#111111; color:#ffffff; text-decoration:none; padding:14px 32px; border-radius:12px; display:inline-block; font-size:14px; font-weight:700;">
                                Contact Us
                            </a>
                        </div>

                        <div style="border-top:1px solid #f0f0f0; padding-top:30px;">
                            <table width="100%">
                                <tr>
                                    <td>
                                        <strong style="display:block; font-size:15px; color:#111111; margin-bottom:4px;">
                                            GINYUU Team
                                        </strong>
                                        <span style="font-size:13px; color:#999999;">
                                            PT. Ginyuu Digital Product
                                        </span>
                                    </td>
                                    <td align="right">
                                        <div style="font-family:'Syne',sans-serif; font-size:18px; font-weight:800; letter-spacing:-1px;">
                                            <span style="color:#111111;">GIN</span><span style="color:#999999;">YUU</span>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </div>

                        <div style="margin-top:45px; text-align:center; border-top:1px solid #f0f0f0; padding-top:24px;">
                            <p style="font-size:12px; color:#999999; margin-bottom:12px; letter-spacing:.5px;">
                                HELP CENTER &bull; SUPPORT 24/7 &bull; ACCOUNT
                            </p>
                            <p style="font-size:11px; color:#aaaaaa; line-height:1.8; margin:0;">
                                Copyright &copy; 2026 PT. Ginyuu Digital Product.<br>
                                All Rights Reserved.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const { queue } = require("../../../db/schema");
        await db.insert(queue).values({
            destination: email,
            tipe: "email_payment",
            pesan: messageEmail,
            status: "pending"
        });
        console.log("success email queued for", email);

        if (phone) {
            const itemsList = rows.map(r => `• ${r.product_name} - Rp ${Number(r.price).toLocaleString('id-ID')}`).join('\n');
            const waMessage = `Hi ${username},

Payment for invoice #${invoiceNumber} has been successfully confirmed 

Thank you for shopping at GINYUU.

Total paid: Rp ${Number(total).toLocaleString('id-ID')}

${itemsList}

Access your product at: ${process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 4100}`}/profile/purchases

For inquiries, please contact us.`;

            await db.insert(queue).values({
                destination: phone,
                tipe: "whatsapp",
                pesan: waMessage,
                status: "pending"
            });
            console.log("success whatsapp queued for", phone);
        }
    } catch (err) {
        console.error("sendOrderSuccessEmail error:", err);
    }
};

