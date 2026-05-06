const { db } = require("../../common/helper");
const bcrypt = require("bcrypt");

// ============= CHECKOUT PROCESS (Multi-Product) =============

exports.capturePayload = async (data) => {
    let username = data?.username;
    let email = data?.email;
    let password = data?.password || null;
    let payment_method = data?.payment_method;
    let cart_items = data?.cart_items || [];
    let promo_code = data?.promo_code || null;
    let terms = data?.terms;
    let loggedInUserId = data?.loggedInUserId || null;

    let result = {
        payload: {
            username: username,
            email: email,
            password: password || null,
            payment_method: payment_method,
            cart_items: cart_items,
            promo_code: promo_code,
            discount_pct: 0,
            terms: terms || true,
            loggedInUserId: loggedInUserId,
            accountNumber: process.env.ACCOUNT_NUMBER || "1234567890"
        },
        code: 200,
        status: "success",
        message: "Success",
        data: {}
    }
    return result;
}

exports.validatePayload = async (result) => {
    if (result.status !== "success") {
        result.message = "Invalid payload";
        result.code = 400;
        result.status = "failed";
        return result;
    }

    if (!result.payload.cart_items || result.payload.cart_items.length === 0) {
        result.message = "Cart is empty";
        result.code = 400;
        result.status = "failed";
        return result;
    }

    if (!result.payload.payment_method) {
        result.message = "Payment method is required";
        result.code = 400;
        result.status = "failed";
        return result;
    }

    if (!result.payload.terms) {
        result.message = "Terms and conditions must be accepted";
        result.code = 400;
        result.status = "failed";
        return result;
    }

    // If guest (no loggedInUserId), require username, email, password
    if (!result.payload.loggedInUserId) {
        if (!result.payload.username) {
            result.message = "Username is required";
            result.code = 400;
            result.status = "failed";
            return result;
        }
        if (!result.payload.email) {
            result.message = "Email is required";
            result.code = 400;
            result.status = "failed";
            return result;
        }
        if (!result.payload.password) {
            result.message = "Password is required for new accounts";
            result.code = 400;
            result.status = "failed";
            return result;
        }
    }

    return result;
}

// Fetch all product prices in one query
exports.getPrices = async (result) => {
    if (result.status === 'failed') return result;
    try {
        const productIds = result.payload.cart_items.map(item => item.id);
        const queryResult = await db.query(
            "SELECT id, name, price FROM product WHERE id = ANY($1)",
            [productIds]
        );
        
        if (queryResult.rows.length !== productIds.length) {
            result.message = "One or more products not found";
            result.code = 400;
            result.status = "failed";
            return result;
        }

        const priceMap = {};
        const nameMap = {};
        queryResult.rows.forEach(row => {
            priceMap[row.id] = row.price;
            nameMap[row.id] = row.name;
        });

        result.payload.priceMap = priceMap;
        result.payload.nameMap = nameMap;
    } catch (err) {
        result.message = "Failed to fetch product prices";
        result.code = 400;
        result.status = "failed";
        console.error("Get prices failed:", err);
    }
    return result;
}

exports.applyPromo = async (result) => {
    if (result.status === 'failed') return result;
    if (!result.payload.promo_code) return result;

    try {
        const query = `
            SELECT id, code, discount_pct, max_usage, used_count, expires_at, is_active
            FROM promo_codes 
            WHERE code = $1 AND is_active = true
        `;
        const queryResult = await db.query(query, [result.payload.promo_code]);

        if (queryResult.rows.length === 0) {
            result.message = "Invalid promo code";
            result.code = 400;
            result.status = "failed";
            return result;
        }

        const promo = queryResult.rows[0];

        if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
            result.message = "Promo code has expired";
            result.code = 400;
            result.status = "failed";
            return result;
        }

        if (promo.max_usage && promo.used_count >= promo.max_usage) {
            result.message = "Promo code usage limit reached";
            result.code = 400;
            result.status = "failed";
            return result;
        }

        result.payload.discount_pct = parseFloat(promo.discount_pct);
        result.payload.promo_id = promo.id;
    } catch (err) {
        console.error("Apply promo failed:", err);
    }
    return result;
}

exports.checkout_add_unique_num = async (result) => {
    if (result.status === 'failed') return result;
    try {
        const unique_num = Math.floor(Math.random() * 999) + 1;
        result.payload.unique_num = unique_num;
    } catch (err) {
        result.status = "failed";
        result.code = 500;
        result.message = "Add unique number failed";
        console.error(err);
        return result;
    }
    return result;
}

exports.countTotal = async (result) => {
    if (result.status === 'failed') return result;
    try {
        let subtotal = 0;
        for (const item of result.payload.cart_items) {
            const price = result.payload.priceMap[item.id];
            if (price) {
                subtotal += price;
            }
        }

        const discountAmount = Math.floor(subtotal * result.payload.discount_pct);
        let total = subtotal - discountAmount - result.payload.unique_num;

        result.payload.subtotal = subtotal;
        result.payload.discount_amount = discountAmount;
        result.payload.total = total;
    } catch (err) {
        result.message = "Count total failed";
        result.code = 400;
        result.status = "failed";
        console.error("Count total failed:", err);
    }
    return result;
}

// ============= Begin Transaction ==============

exports.checkout_add_user = async (result) => {
    if (result.status === "failed") return result;

    try {
        // If user is already logged in, use their ID
        if (result.payload.loggedInUserId) {
            result.payload.idUser = result.payload.loggedInUserId;
            return result;
        }

        // Guest checkout: check if email already exists
        const userResult = await db.query(
            "SELECT id FROM users WHERE email = $1",
            [result.payload.email]
        );

        if (userResult.rows.length > 0) {
            result.status = "failed";
            result.code = 401;
            result.message = "EMAIL_ALREADY_REGISTERED";
            result.data = {
                message: "Email ini sudah terdaftar. Silakan login terlebih dahulu sebelum checkout."
            };
            return result;
        }

        // Create new user
        const hashedPassword = await bcrypt.hash(result.payload.password, 10);
        const insertResult = await db.query(
            `INSERT INTO users (email, username, password, terms)
            VALUES ($1, $2, $3, $4)
            RETURNING id`,
            [
                result.payload.email,
                result.payload.username,
                hashedPassword,
                result.payload.terms
            ]
        );

        result.payload.idUser = insertResult.rows[0].id;
    } catch (err) {
        result.status = "failed";
        result.code = 500;
        result.message = "Failed to create user";
        console.error("Checkout add user failed:", err);
        return result;
    }
    return result;
};

exports.checkout_create_order = async (result) => {
    if (result.status === 'failed') return result;
    try {
        // Insert order header
        const orderResult = await db.query(
            `INSERT INTO orders 
            (user_id, payment_method, subtotal, discount_amount, unique_num, total)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id`,
            [
                result.payload.idUser,
                result.payload.payment_method,
                result.payload.subtotal,
                result.payload.discount_amount,
                result.payload.unique_num,
                result.payload.total
            ]
        );
        result.payload.idOrder = orderResult.rows[0].id;

        // Insert order items (1 row per product)
        for (const item of result.payload.cart_items) {
            const price = result.payload.priceMap[item.id];
            await db.query(
                `INSERT INTO order_items (order_id, product_id, price)
                VALUES ($1, $2, $3)`,
                [result.payload.idOrder, item.id, price]
            );
        }
    } catch (err) {
        result.status = "failed";
        result.code = 500;
        result.message = "Create order failed";
        console.error("Create order failed:", err);
        return result;
    }
    return result;
}

exports.checkout_create_invoice = async (result) => {
    if (result.status === 'failed') return result;
    try {
        const invoice_number = "INV-" + Date.now() + result.payload.idUser + "-" + result.payload.idOrder;
        // Issued now, expires in 3 days
        const issued_at = new Date();
        const expires_at = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

        const invoiceResult = await db.query(
            `INSERT INTO invoices (
                order_id, 
                invoice_number,
                discount_amount,
                total, 
                issued_at,
                unique_num,
                status
            )
            VALUES ($1, $2, $3, $4, $5, $6, 'pending')
            RETURNING id, invoice_number`,
            [
                result.payload.idOrder,
                invoice_number,
                result.payload.discount_amount,
                result.payload.total,
                issued_at,
                result.payload.unique_num
            ]
        );

        result.payload.idInvoice = invoiceResult.rows[0].id;
        result.payload.invoice_number = invoiceResult.rows[0].invoice_number;
        result.payload.expires_at = expires_at;
    } catch (err) {
        result.status = "failed";
        result.code = 500;
        result.message = "Create invoice failed";
        console.error("Create invoice failed:", err);
        return result;
    }
    return result;
}

exports.checkout_clear_cart = async (result) => {
    if (result.status === 'failed') return result;
    try {
        await db.query(
            "DELETE FROM cart_items WHERE user_id = $1",
            [result.payload.idUser]
        );
    } catch (err) {
        console.error("Failed to clear cart:", err);
        // Non-fatal, don't fail the whole checkout
    }
    return result;
}

exports.checkout_add_queue = async (result) => {
    if (result.status === 'failed') return result;

    try {
        // Get product names for email
        const productQuery = await db.query(
            `SELECT p.name, oi.price 
            FROM order_items oi 
            JOIN product p ON oi.product_id = p.id 
            WHERE oi.order_id = $1`,
            [result.payload.idOrder]
        );

        let productListHtml = productQuery.rows.map(row => 
            `<li>${row.name} - Rp. ${row.price.toLocaleString('id-ID')}</li>`
        ).join('');

        let messageEmail = `
        <p>Halo ${result.payload.username}, terima kasih telah melakukan pembelian.</p>
        <p>Produk yang dibeli:</p>
        <ul>${productListHtml}</ul>
        <p>Subtotal: Rp. ${result.payload.subtotal.toLocaleString('id-ID')}</p>
        <p>Diskon: Rp. ${result.payload.discount_amount.toLocaleString('id-ID')}</p>
        <p>Potongan kode unik: Rp. ${result.payload.unique_num}</p>
        <p><strong>Total Tagihan: Rp. ${result.payload.total.toLocaleString('id-ID')}</strong></p>
        <p>Silahkan lakukan pembayaran ke rekening berikut:</p>
        <p>Bank: ${result.payload.payment_method.toUpperCase()}</p>
        <p>Nomor tagihan: ${result.payload.invoice_number}</p>
        <p>No. Rekening: ${result.payload.accountNumber} Bank Jago</p>
        <p>Atas Nama: PT. Ginyuu Teknologi Indonesia</p>
        <p>Setelah melakukan pembayaran, silahkan konfirmasi ke nomor WhatsApp berikut: 08123456789</p>
        <p>Terima kasih.</p>`;

        const queueResultEmail = await db.query(
            `INSERT INTO queue (
                order_id,
                destination,
                tipe,
                pesan,
                status,
                created_at
            )
            VALUES ($1, $2, $3, $4, $5, NOW())
            RETURNING id`,
            [
                result.payload.idOrder,
                result.payload.email,
                "email",
                messageEmail,
                "pending"
            ]
        );

        result.payload.idQueueEmail = queueResultEmail.rows[0].id;
    } catch (err) {
        result.status = "failed";
        result.code = 500;
        result.message = "Create queue failed";
        console.error(err);
        return result;
    }
    return result;
};

exports.checkout_send_email = async () => {
    try {
        const data = await db.query(
            `SELECT * FROM queue
            WHERE tipe = 'email'
            AND status = 'pending'
            FOR UPDATE SKIP LOCKED
            LIMIT 1;`
        );
        if (data.rows.length === 0) {
            console.log("No email to send");
            return;
        }
        const { send_email } = require("../email/email_service");
        await send_email(data.rows[0].destination, "Invoice berhasil dibuat", data.rows[0].pesan);
        console.log("Email sent");
        await db.query(
            `UPDATE queue SET status = 'sent' WHERE id = $1`,
            [data.rows[0].id]
        );
    } catch (err) {
        throw new Error(err);
    }
    return;
}

exports.createResponse = async (result) => {
    let res = {
        payload: result.payload,
        code: result.code,
        status: result.status,
        message: result.message,
        data: result
    }
    return res;
}
