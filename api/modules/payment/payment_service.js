const { db } = require("../../common/helper");

// ================= GET INVOICE =================
exports.getInvoiceByNumber = async (invoice_number) => {
    let result = {
        code: 200,
        status: "success",
        message: "Success",
        data: {}
    }
    try {
        const query = `
            SELECT 
                i.id AS invoice_id,
                i.invoice_number,
                i.discount_amount,
                i.total,
                i.issued_at,
                i.unique_num,
                i.status,
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
            return {
                code: 404,
                status: "failed",
                message: "Invoice not found",
                data: null
            };
        }

        // Get order items (multi-product)
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

        return {
            code: 200,
            status: "success",
            message: "Invoice found",
            data: invoiceData
        };
    } catch (err) {
        console.error("getInvoiceByNumber error:", err);
        return {
            code: 500,
            status: "failed",
            message: "Internal server error",
            data: null
        };
    }
};

// ================= PAYMENT PROCESS =================
exports.getNotification = async (result) => {
    try{

        
        return {
            code: 200,
            status: "success",
            message: "Success",
            data: result.payload.notification
        };
    } catch (err) {
        console.error("getNotification error:", err);
        return {
            code: 500,
            status: "failed",
            message: "Get Notification Failed",
            data: null
        };
    }
}

exports.getInvoiceByTotal = async (result) => {
    try{
        

        return {
            code: 200,
            status: "success",
            message: "Success",
            data: result
        };
    } catch (err) {
        console.error("getNotification error:", err);
        return {
            code: 500,
            status: "failed",
            message: "Get Invoice By Total Failed",
            data: null
        };
    }
}

exports.verifyPayment = async (result) => {
    try{
        
        return {
            code: 200,
            status: "success",
            message: "Success",
            data: result
        };
    } catch (err) {
        console.error("getNotification error:", err);
        return {
            code: 500,
            status: "failed",
            message: "Payment Process Failed",
            data: null
        };
    }
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
