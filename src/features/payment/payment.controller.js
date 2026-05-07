const { getInvoiceByNumber, getNotification, verifyPayment, createResponse, getInvoiceByTotal } = require("./payment.service");

exports.getInvoice = async (req, res) => {
    const { invoice_number } = req.params;
    if (!invoice_number) {
        return res.status(400).json({ code: 400, status: "failed", message: "Invoice number is required" });
    }
    try {
        const result = await getInvoiceByNumber(invoice_number);
        res.status(result.code).json(result);
        console.log(result);
    } catch (err) {
        console.error("getInvoice error:", err);
        res.status(500).json({ code: 500, status: "failed", message: "Internal server error", data: null });
    }
};

exports.paymentProcess = async (req, res) => {
    let result = { code: 500, status: "failed", message: "Internal server error" };
    try {
        result = await getNotification(req.body);
        result = await getInvoiceByTotal(result);
        result = await verifyPayment(result);
        result = await createResponse(result);
        res.status(result.code).json({ code: result.code, status: result.status, message: result.message, data: result.data });
    } catch (err) {
        console.error("getNotification error:", err);
        res.status(result.code).json({ code: result.code, status: result.status, message: result.message, data: result.data });
    }
};
