const {
    getInvoiceByNumber,
    saveGatewayTransaction,
    getGatewayTransactionByInvoiceId,
    updateInvoiceToPaid 
} = require("./payment.service");

const { createNotification } = require("../notification/notification.service");
const klikQris = require("./payment.gateway");
const { db } = require("../../../db");
const { paymentGatewayTransactions, invoices, orders } = require("../../../db/schema");
const { eq, sql } = require("drizzle-orm");

exports.getInvoice = async (req, res) => {
    const { invoice_number } = req.params;
    if (!invoice_number) {
        return res.status(400).json({ code: 400, status: "failed", message: "Invoice number is required" });
    }
    try {
        const result = await getInvoiceByNumber(invoice_number);
        res.status(result.code).json(result);
    } catch (err) {
        console.error("getInvoice error:", err);
        res.status(500).json({ code: 500, status: "failed", message: "Internal server error", data: null });
    }
};

exports.createQris = async (req, res) => {
    try{
        //7 get invoice 
        const {invoice_number} = req.body;
        if (!invoice_number){
            return res.status(400).json({code:400, status:"failed", message:"invoiceNumber required"});
        }
        
        // get invoice & order data 
        const invoice = await getInvoiceByNumber(invoice_number);
        if (invoice.code !== 200){
            return res.status(404).json({code:404, status:"failed", message:"Invoice not found"});
        }
        
        

        const invoiceData = invoice.data;

        // check if theres a Qris transaction before create a new one 
        const existing = await getGatewayTransactionByInvoiceId(invoiceData.invoice_id);
        if (existing && existing.qrisUrl){
            return res.status(200).json({
                code:200, status:"success", message:"QRIS already created", 
                data: {
                    qris_url : existing.qrisUrl,
                    direct_url : existing.directUrl,
                    gateway_order_id : existing.gatewayOrderId,
                    expired_at : existing.gatewayExpiredAt
                }
            });
        }

        // call gateway klikQris
        const result = await klikQris.createTransaction({
            orderId : invoiceData.invoice_number,
            amount : invoiceData.total,
            description : `Pembayaran invoice  ${invoice_number}`
        });

        if (!result.status){
            return res.status(500).json({code:500, status:"failed", message:result.message || "KlikQRIS request failed"});
        }

        console.log("result :", result);
        //hasil console log
        console.log("invoiceData :", invoiceData);
        // save to database
        await saveGatewayTransaction({
            invoiceId: invoiceData.invoice_id,
            gatewayOrderId: result.data.order_id,
            signature: result.data.signature,
            qrisUrl: result.data.qris_url,
            directUrl: result.data.direct_url,
            amount: Math.round(result.data.amount),
            expiredAt: result.data.expired_at
        });


//       invoiceData : {
    //   invoice_id: 65,
    //   invoice_number: "INV-177865876574825-69",
    //   discount_amount: 0,
    //   total: 74000,
    //   expires_at: 2026-05-16T07:52:45.748Z,
    //   status_payment: "pending",
    //   order_id: 69,
    //   subtotal: 74000,
    //   payment_method: "qris",
    //   order_date: 2026-05-13T07:52:45.743Z,
    //   username: "aco atmos",
    //   email: "acoatmos@gmail.com",
    //   phone: null,
    //   items: [
    //     {
    //       product_name: "Python Basics for Non-Programmers",
    //       product_slug: "python-basics-for-non-programmers",
    //       price: 74000,
    //     }
    //   ],
    //   product_name: "Python Basics for Non-Programmers",
    //   amount: 1,
    // }

        // make queue 
        const {checkout_add_queue}= require("../checkout/checkout.service")
        await checkout_add_queue(invoiceData, result.data.qris_url); 

        return res.status(200).json({
            code:200, 
            status:"success", 
            message:"QRIS created successfully", 
            data:{
                qris_url : result.data.qris_url,
                direct_url : result.data.direct_url,
                gateway_order_id : result.data.order_id,
                expired_at : result.data.expired_at
            }
        });
        
    }catch(err){
        console.error("createQris error:", err);
        if (err.response?.status === 422) {
            const existing = await getGatewayTransactionByInvoiceId(invoiceData.invoice_id);
            if (existing && existing.qrisUrl) {
                return res.status(200).json({
                    code:200, status:"success", message:"QRIS already created",
                    data: {
                        qris_url: existing.qrisUrl,
                        direct_url: existing.directUrl,
                        gateway_order_id: existing.gatewayOrderId,
                        expired_at: existing.gatewayExpiredAt
                    }
                });
            }
        }
        return res.status(500).json({code:500, status:"failed", message:"Internal server error", data:null});
    }
};

exports.webhookHandler = async (req, res) =>{
    try{
        const data = req.body;

        if(!data || !data.order_id || !data.signature){
            return res.status(400).json({
                code:400, status:"failed", message:"Invalid webhook payload"
            });
        }

        //search transaction in db
        const result = await db.execute(sql`
            SELECT pgt.*, i.invoice_number, i.order_id 
            FROM payment_gateway_transactions pgt
            JOIN invoices i ON i.id = pgt.invoice_id
            WHERE pgt.gateway_order_id = ${data.order_id} LIMIT 1 
        `);

        if (result.rows.length === 0){
            return res.status(404).json({
                code:404, status:"failed", message:"Transaction not found"
            })
        }
        const transaction = result.rows[0];

        // Verify signature
        if (!klikQris.verifySignature(data.signature, transaction.signature)){
            return res.status(400).json({
                code:403, status:"failed", message:"Invalid signature"
            });
        }

        // prevent double (if unpaid , or skiped)
        if (transaction.status === "paid" || transaction.status === "SUCCESS"){
            return res.status(200).json({
                code:200, status:"success", message:"Transaction already processed"
            })
        }

        //update gateway transaction status 
        await db.update(paymentGatewayTransactions).set({ status: data.status, updatedAt: sql`NOW()` }).where(eq(paymentGatewayTransactions.id, transaction.id));

        // if status paid/ success update invoice to paid
        if(data.status === "PAID" || data.status === "SUCCESS"){
            await updateInvoiceToPaid(transaction.invoice_id);

            const [orderRow] = await db.select({ userId: orders.userId }).from(orders).where(eq(orders.id, transaction.order_id));
            const userId = orderRow?.userId;

            if (userId) {
                await createNotification({
                    user_id: userId,
                    icon: "✅",
                    message: `Pembayaran invoice ${transaction.invoice_number} berhasil dikonfirmasi`,
                    action_url: `/checkout/waiting-payment?invoice=${transaction.invoice_number}`
                });
            }
        }

        return res.status(200).json({
            code:200,
            status:"success",
            message:"Webhook processed successfully",
            data:{
                invoice_number: transaction.invoice_number,
                status: data.status
            }
        })

    }catch(err){ 
        console.error("webhookHandler error:", err);
        return res.status(500).json({ code: 500, status: "failed", message: "Internal server error" });
    }
}
