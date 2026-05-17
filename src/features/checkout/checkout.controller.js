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
const { db } = require("../../config/database");

exports.checkout = async (req, res) => {
    const client = await db.connect();
    let result = { code: 500, status: "failed", message: "Internal Server Error" };

    try {
        let loggedInUserId = null;
        let loggedInUser = null;
        const token = req.cookies?.token;
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                loggedInUserId = decoded.id;
                const userResult = await db.query("SELECT id, username, email, phone FROM users WHERE id = $1", [loggedInUserId]);
                if (userResult.rows.length > 0) {
                    loggedInUser = userResult.rows[0];
                }
            } catch (err) {}
        }

        const body = { ...req.body };
        if (loggedInUser) {
            body.loggedInUserId = loggedInUser.id;
            body.username = loggedInUser.username;
            body.email = loggedInUser.email;
        }

        result = await capturePayload(body);
        result = await validatePayload(result);
        result = await getPrices(result);
        result = await applyPromo(result);
        result = await countTotal(result);

        await client.query("BEGIN");
        result = await checkout_add_user(result);
        result = await checkout_create_order(result);
        result = await checkout_create_invoice(result);
        result = await checkout_clear_cart(result);
        await client.query("COMMIT");

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
        await client.query("ROLLBACK");
        console.error('Checkout error:', err);
        res.status(result.code || 500).json({
            code: result.code || 500,
            status: result.status || "failed",
            message: result.message,
            debug_error: err.toString(),
            stack: err.stack
        });
    } finally {
        client.release();
    }
};

exports.cancelOrder = async (req, res) => {
    const { invoice_number } = req.body;
    if (!invoice_number) {
        return res.status(400).json({ code: 400, status: "failed", message: "Invoice number is required" });
    }

    const client = await db.connect();
    try {
        await client.query("BEGIN");
        const invoiceResult = await client.query(
            "SELECT id, order_id, status_payment FROM invoices WHERE invoice_number = $1",
            [invoice_number]
        );
        if (invoiceResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ code: 404, status: "failed", message: "Invoice not found" });
        }
        const invoice = invoiceResult.rows[0];
        if (invoice.status_payment !== 'pending') {
            await client.query("ROLLBACK");
            return res.status(400).json({ code: 400, status: "failed", message: `Cannot cancel order with status '${invoice.status_payment}'` });
        }
        await client.query("UPDATE invoices SET status_payment = 'cancelled' WHERE id = $1", [invoice.id]);
        await client.query("UPDATE orders SET status = 'cancelled' WHERE id = $1", [invoice.order_id]);
        await client.query("COMMIT");

        try {
            const orderResult = await db.query("SELECT user_id FROM orders WHERE id = $1", [invoice.order_id]);
            if (orderResult.rows.length > 0) {
                const { createNotification } = require('../notification/notification.service');
                await createNotification({
                    user_id: orderResult.rows[0].user_id,
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
        await client.query("ROLLBACK");
        console.error('Cancel order error:', err);
        res.status(500).json({ code: 500, status: "failed", message: "Failed to cancel order" });
    } finally {
        client.release();
    }
};
