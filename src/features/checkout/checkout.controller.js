const jwt = require("jsonwebtoken");
const {
    capturePayload,
    validatePayload,
    getPrices,
    applyPromo,
    countTotal,
    checkout_add_user,
    checkout_create_order,
    checkout_create_invoice,
    checkout_clear_cart,
    checkout_create_notification,
    createResponse
} = require('./checkout.service');
const { db } = require("../../../db");
const { users, invoices, orders } = require("../../../db/schema");
const { eq } = require("drizzle-orm");

exports.checkout = async (req, res) => {
    let result = { code: 500, status: "failed", message: "Internal Server Error" };

    try {
        let loggedInUserId = null;
        let loggedInUser = null;
        const token = req.cookies?.token;
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                loggedInUserId = decoded.id;
                const [userRow] = await db.select({ id: users.id, username: users.username, email: users.email, phone: users.phone }).from(users).where(eq(users.id, loggedInUserId));
                if (userRow) {
                    loggedInUser = userRow;
                }
            } catch (err) {}
        }

        const body = { ...req.body };
        if (loggedInUser) {
            body.loggedInUserId = loggedInUser.id;
            body.username = loggedInUser.username;
            body.email = loggedInUser.email;
            body.phone = loggedInUser.phone;
        }

        result = await capturePayload(body);
        result = await validatePayload(result);
        result = await getPrices(result);
        result = await applyPromo(result);
        result = await countTotal(result);

        result = await checkout_add_user(result);
        result = await checkout_create_order(result);
        result = await checkout_create_invoice(result);
        result = await checkout_clear_cart(result);

        await checkout_create_notification(result);

        // Auto-login guest after checkout
        if (!loggedInUser) {
            const token = jwt.sign(
                { id: result.payload.idUser, username: result.payload.username, email: result.payload.email },
                process.env.JWT_SECRET,
                { expiresIn: "24h" }
            );
            res.cookie("token", token, {
                httpOnly: true,
                sameSite: "lax",
                maxAge: 24 * 60 * 60 * 1000,
                path: "/",
            });
        }

        result = await createResponse(result);
        
        res.status(result.code).json({
            code: result.code,
            status: result.status,
            message: result.message,
            data: {
                invoice_number: result.payload.invoice_number,
                total: result.payload.total,
                payment_method: result.payload.payment_method,
                expires_at: result.payload.expires_at
            }
        });
    } catch (err) {
        console.error('Checkout error:', err);
        res.status(result.code || 500).json({
            code: result.code || 500,
            status: result.status || "failed",
            message: result.message,
            debug_error: err.toString(),
            stack: err.stack
        });
    }
};

exports.cancelOrder = async (req, res) => {
    const { invoice_number } = req.body;
    if (!invoice_number) {
        return res.status(400).json({ code: 400, status: "failed", message: "Invoice number is required" });
    }

    let invoiceData;
    try {
        await db.transaction(async (tx) => {
            const [invoice] = await tx.select({ id: invoices.id, orderId: invoices.orderId, statusPayment: invoices.statusPayment }).from(invoices).where(eq(invoices.invoiceNumber, invoice_number));
            if (!invoice) {
                throw new Error("INVOICE_NOT_FOUND");
            }
            if (invoice.statusPayment !== 'pending') {
                throw new Error("CANNOT_CANCEL_" + invoice.statusPayment.toUpperCase());
            }
            invoiceData = invoice;
            await tx.update(invoices).set({ statusPayment: 'cancelled' }).where(eq(invoices.id, invoice.id));
            await tx.update(orders).set({ status: 'cancelled' }).where(eq(orders.id, invoice.orderId));
        });

        try {
            const [orderRow] = await db.select({ userId: orders.userId }).from(orders).where(eq(orders.id, invoiceData.orderId));
            if (orderRow) {
                const { createNotification } = require('../notification/notification.service');
                await createNotification({
                    user_id: orderRow.userId,
                    icon: "🗑️",
                    message: `Pesanan ${invoice_number} telah dibatalkan`,
                    action_url: `/checkout/waiting-payment?invoice=${invoice_number}`
                });
            }
        } catch (notifErr) {
            console.error('Create cancel notification failed:', notifErr);
        }

        res.status(200).json({ code: 200, status: "success", message: "Order cancelled successfully" });
    } catch (err) {
        if (err.message === "INVOICE_NOT_FOUND") {
            return res.status(404).json({ code: 404, status: "failed", message: "Invoice not found" });
        }
        if (err.message && err.message.startsWith("CANNOT_CANCEL_")) {
            const status = err.message.replace("CANNOT_CANCEL_", "").toLowerCase();
            return res.status(400).json({ code: 400, status: "failed", message: `Cannot cancel order with status '${status}'` });
        }
        console.error('Cancel order error:', err);
        res.status(500).json({ code: 500, status: "failed", message: "Failed to cancel order" });
    }
};
