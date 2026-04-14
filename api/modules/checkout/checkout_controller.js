const {
    capturePayload,
    validatePayload,
    getPrice,
    countTotal,
    checkout_add_user,
    checkout_create_order,
    checkout_create_invoice,
    checkout_add_queue,
    createResponse,
    getInvoiceByNumber
} =require('./checkout_service');
const {db} = require("../../common/helper");


exports.checkout = async (req, res) => {
    const client = await db.connect();
    let result = { 
        code: 500, 
        status: "failed", 
        message: "Internal Server Error" 
    };

    try {
        result = await capturePayload(req.body);
        result = await validatePayload(result);
        result = await getPrice(result); 
        result = await countTotal(result); 
        await client.query("BEGIN");
        result = await checkout_add_user(result);
        result = await checkout_create_order(result);
        result = await checkout_create_invoice(result);
        result = await checkout_add_queue(result);
        await client.query("COMMIT");
        result = await createResponse(result);
        res.status(result.code).json({
            code: result.code,
            status: result.status,
            message: result.message,
            data: result.data
        });
    }catch(err){
        await client.query("ROLLBACK");
        console.log(err);
        res.status(result.code).json({
            code: result.code,
            status: result.status ,
            message: result.message,
            debug_error: err.toString(),
            stack: err.stack
        });
    } finally {
        client.release();
    }

}

exports.getInvoice = async (req, res) => {
    const { invoice_number } = req.params;
    
    if (!invoice_number) {
        return res.status(400).json({
            code: 400,
            status: "failed",
            message: "Invoice number is required"
        });
    }

    const result = await getInvoiceByNumber(invoice_number);
    res.status(result.code).json(result);
};