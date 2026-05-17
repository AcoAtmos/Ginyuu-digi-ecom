const { db } = require("../../config/database");
const bcrypt = require("bcrypt");

exports.capturePayload = async (data) => {
    let loggedInUserId = data?.loggedInUserId || null;
    let result = {
        payload: {
            username: data?.username,
            email: data?.email,
            password: data?.password || null,
            payment_method: data?.payment_method,
            cart_items: data?.cart_items || [],
            promo_code: data?.promo_code || null,
            discount_pct: 0,
            terms: data?.terms || true,
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
        const queryResult = await db.query(
            `SELECT id, code, discount_pct, max_usage, used_count, expires_at, is_active
             FROM promo_codes WHERE code = $1 AND is_active = true`,
            [result.payload.promo_code]
        );
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

exports.countTotal = async (result) => {
    if (result.status === 'failed') return result;
    try {
        let subtotal = 0;
        for (const item of result.payload.cart_items) {
            const price = result.payload.priceMap[item.id];
            if (price) subtotal += price;
        }
        const discountAmount = Math.floor(subtotal * result.payload.discount_pct);
        let total = subtotal - discountAmount;
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

exports.checkout_add_user = async (result) => {
    if (result.status === "failed") return result;
    try {
        if (result.payload.loggedInUserId) {
            result.payload.idUser = result.payload.loggedInUserId;
            return result;
        }
        const userResult = await db.query("SELECT id FROM users WHERE email = $1", [result.payload.email]);
        if (userResult.rows.length > 0) {
            result.status = "failed";
            result.code = 401;
            result.message = "EMAIL_ALREADY_REGISTERED";
            result.data = { message: "Email ini sudah terdaftar. Silakan login terlebih dahulu sebelum checkout." };
            return result;
        }
        const hashedPassword = await bcrypt.hash(result.payload.password, 10);
        const insertResult = await db.query(
            `INSERT INTO users (email, username, password, terms) VALUES ($1, $2, $3, $4) RETURNING id`,
            [result.payload.email, result.payload.username, hashedPassword, result.payload.terms]
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
        const orderResult = await db.query(
            `INSERT INTO orders (user_id, payment_method, subtotal, discount_amount, total)
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [result.payload.idUser, result.payload.payment_method, result.payload.subtotal, result.payload.discount_amount, result.payload.total]
        );
        result.payload.idOrder = orderResult.rows[0].id;
        for (const item of result.payload.cart_items) {
            const price = result.payload.priceMap[item.id];
            await db.query(
                `INSERT INTO order_items (order_id, product_id, price) VALUES ($1, $2, $3)`,
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
        const expires_at = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
        const invoiceResult = await db.query(
            `INSERT INTO invoices (order_id, invoice_number, discount_amount, total, expires_at, status_payment)
             VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING id, invoice_number`,
            [result.payload.idOrder, invoice_number, result.payload.discount_amount, result.payload.total, expires_at]
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
        await db.query("DELETE FROM cart_items WHERE user_id = $1", [result.payload.idUser]);
    } catch (err) {
        console.error("Failed to clear cart:", err);
    }
    return result;
}

// on called from payment controller
exports.checkout_add_queue = async (invoiceData, payment_url) => {
    try { 

        let productListHtml = invoiceData.items.map(row =>
            `<li>${row.product_name} - Rp. ${row.price.toLocaleString('id-ID')}</li>`
        ).join('');
        
        let paymentTemplate;

        if (invoiceData.payment_method === "qris") {
            paymentTemplate = `
                <div style="text-align:center; padding:30px 20px;">
                    <p style="font-size:15px; color:#555; margin:0 0 20px 0; line-height:1.7;">
                        Silakan scan QR Code berikut untuk melakukan pembayaran.
                    </p>
                    <div style="background:#ffffff; border:1px solid #eeeeee; border-radius:16px; padding:20px; display:inline-block; margin-bottom:18px;">
                        <img src="${payment_url}" alt="QR Code" style="width:220px; max-width:100%; display:block; margin:auto;">
                    </div>
                    <p style="font-size:13px; color:#999999; margin:0;">
                        QR Code akan otomatis kadaluarsa dalam 15 menit.
                    </p>
                </div>
            `;
        } else {
            paymentTemplate = `
                <div style="background:#ffffff; border:1px solid #eeeeee; border-radius:14px; padding:20px; margin-top:20px;">
                    <p style="margin-top:0; margin-bottom:18px; color:#555; line-height:1.7;">
                        Silakan transfer ke rekening berikut untuk melakukan pembayaran:
                    </p>
                    <table style="width:100%; border-collapse:collapse; font-size:14px; line-height:1.9; color:#444;">
                        <tr>
                            <td width="40%" style="color:#888;">Bank</td>
                            <td>: ${invoiceData.payment_method.toUpperCase()}</td>
                        </tr>
                        <tr>
                            <td style="color:#888;">No. Rekening</td>
                            <td>: ${invoiceData.no_rek}</td>
                        </tr>
                        <tr>
                            <td style="color:#888;">Atas Nama</td>
                            <td>: A.N. Ginyuu</td>
                        </tr>
                        <tr>
                            <td style="color:#888;">Jumlah Transfer</td>
                            <td>: Rp ${invoiceData.total.toLocaleString('id-ID')}</td>
                        </tr>
                        <tr>
                            <td style="color:#888;">No. Order</td>
                            <td>: ${invoiceData.invoice_number}</td>
                        </tr>
                    </table>
                </div>
            `;
        }

        let messageEmail = `
    <div style="background-color:#f6f6f6; padding:40px 20px; font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; color:#333333;">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');
        </style>
        
        <div style="max-width:640px; margin:0 auto; background:#ffffff; border:1px solid #ebebeb; border-radius:24px; overflow:hidden;">
            
            <!-- HEADER -->
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#fafafa; border-bottom:1px solid #f0f0f0;">
                <tr>
                    <td style="padding:35px 40px 25px 40px;">
                        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                            <tr>
                                <!-- Logo -->
                                <td>
                                    <h1 style="font-family:'Syne',sans-serif; font-weight:800; font-size:32px; margin:0; letter-spacing:-1.5px; line-height:1; color:#111111;">
                                        GIN<span style="color:#999999;">YUU</span>
                                    </h1>
                                </td>
                                <!-- Invoice Info -->
                                <td align="right" valign="top">
                                    <p style="margin:0 0 4px 0; font-size:13px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; color:#999999;">
                                        INVOICE
                                    </p>
                                    <p style="margin:0; font-size:17px; font-weight:700; color:#111111;">
                                        #${invoiceData.invoice_number}
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>

            <!-- BODY -->
            <div style="padding:40px;">
                <h2 style="font-size:30px; line-height:1.2; color:#111111; margin:0 0 18px 0; letter-spacing:-1px;">
                    Konfirmasi Pembelian
                </h2>
                
                <p style="font-size:16px; line-height:1.8; color:#555555; margin:0 0 8px 0;">
                    Halo <strong>${invoiceData.username}</strong>,
                </p>
                <p style="font-size:15px; line-height:1.8; color:#666666; margin-bottom:40px;">
                    Terima kasih telah melakukan pembelian di GINYUU. Berikut adalah rincian pesanan dan instruksi pembayaran Anda.
                </p>
                        <!-- PRODUCT -->
                        <div style="border:1px solid #eeeeee; border-radius:18px; overflow:hidden; margin-bottom:28px;">
                            <div style="padding:18px 24px; background:#fafafa; border-bottom:1px solid #eeeeee;">
                                <h3 style="margin:0; font-size:13px; letter-spacing:1px; text-transform:uppercase; color:#999999;">
                                    Detail Produk
                                </h3>
                            </div>
                            <div style="padding:24px; font-size:15px; color:#444444; line-height:1.9;">
                                ${productListHtml}
                            </div>
                        </div>

                        <!-- PAYMENT SUMMARY -->
                        <table style="width:100%; border-collapse:collapse; margin-bottom:30px; font-size:15px;">
                            <tr>
                                <td style="padding:10px 0; color:#777;">Subtotal</td>
                                <td align="right">Rp ${invoiceData.subtotal.toLocaleString('id-ID')}</td>
                            </tr>
                            <tr>
                                <td style="padding:10px 0; color:#777;">Diskon</td>
                                <td align="right" style="color:#999;">- Rp ${invoiceData.discount_amount.toLocaleString('id-ID')}</td>
                            </tr>
                            <tr>
                                <td colspan="2">
                                    <div style="border-top:1px dashed #dddddd; margin:16px 0;"></div>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding-top:10px; font-size:18px; font-weight:700; color:#111;">
                                    Total Tagihan
                                </td>
                                <td align="right" style="padding-top:10px; font-size:24px; font-weight:800; color:#111;">
                                    Rp ${invoiceData.total.toLocaleString('id-ID')}
                                </td>
                            </tr>
                        </table>

                        <!-- PAYMENT METHOD -->
                        <div style="background:#fafafa; border:1px solid #eeeeee; border-radius:20px; padding:30px; margin-bottom:35px;">
                            <h3 style="margin-top:0; margin-bottom:25px; font-size:16px; color:#111111;">
                                Instruksi Pembayaran
                            </h3>
                            <table style="width:100%; font-size:14px; line-height:2; color:#555555; margin-bottom:10px;">
                                <tr>
                                    <td width="40%">Nomor Invoice</td>
                                    <td>: ${invoiceData.invoice_number}</td>
                                </tr>
                                <tr>
                                    <td>Atas Nama</td>
                                    <td>: ${invoiceData.username}</td>
                                </tr>
                                <tr>
                                    <td>Metode Pembayaran</td>
                                    <td>: ${invoiceData.payment_method.toUpperCase()}</td>
                                </tr>
                            </table>
                            ${paymentTemplate}
                        </div>

                        <!-- BUTTON -->
                        <div style="text-align:center; margin-bottom:45px;">
                            <a href="https://wa.me/6281333477041" 
                            style="background:#111111; color:#ffffff; text-decoration:none; padding:14px 32px; border-radius:12px; display:inline-block; font-size:14px; font-weight:700;">
                                Hubungi Kami
                            </a>
                        </div>

                        <!-- FOOTER -->
                        <div style="border-top:1px solid #f0f0f0; padding-top:30px;">
                            <table width="100%">
                                <tr>
                                    <td>
                                        <strong style="display:block; font-size:15px; color:#111111; margin-bottom:4px;">
                                            Admin Finance
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

                        <!-- COPYRIGHT -->
                        <div style="margin-top:45px; text-align:center; border-top:1px solid #f0f0f0; padding-top:24px;">
                            <p style="font-size:12px; color:#999999; margin-bottom:12px; letter-spacing:.5px;">
                                HELP CENTER • SUPPORT 24/7 • ACCOUNT
                            </p>
                            <p style="font-size:11px; color:#aaaaaa; line-height:1.8; margin:0;">
                                Copyright © 2026 PT. Ginyuu Digital Product.<br>
                                All Rights Reserved.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const queueinvoiceDataEmail = await db.query(
            `INSERT INTO queue 
            (order_id, destination, tipe, pesan, status, created_at, qris_url)
            VALUES ($1, $2, $3, $4, $5, NOW(), $6) RETURNING id`,
            [
                invoiceData.order_id,
                invoiceData.email,
                "email",
                messageEmail,
                "pending",
                payment_url || null,
            ]
        );
        console.log("email berhasil di queue")
    } catch (err) {
        console.error(err);
    }
};


exports.checkout_create_notification = async (result) => {
    if (result.status === 'failed') return result;
    try {
        const { createNotification } = require('../notification/notification.service');
        const data = await createNotification({
            user_id: result.payload.idUser,
            icon: "🔔",
            message: "Thank you for your purchase, please make your payment",
            action_url: `/checkout/waiting-payment?invoice=${result.payload.invoice_number}`
        });
        result.payload.idNotification = data.id;
    } catch (err) {
        result.status = "failed";
        result.code = 500;
        result.message = "Create notification failed";
        console.error(err);
        return result;
    }
    return result;
}

exports.createResponse = async (result) => {
    return {
        payload: result.payload,
        code: result.code,
        status: result.status,
        message: result.message,
        data: result
    };
}
