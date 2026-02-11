const {
    capturePayload,
    validatePayload,
    getPrice,
    countTotal,
    checkout_add_user,
    checkout_create_order,
    checkout_send_whatsapp,
    createResponse
} =require('./checkout_service');
const {db} = require("../../common/helper");


exports.checkout = async (req, res) => {
    const client = await db.connect();

    try {
        let result = await capturePayload(req.body);
        result = await validatePayload(result);
        result = await getPrice(result); 
        result = await countTotal(result); 
        await client.query("BEGIN");
        result = await checkout_add_user(result);
        result = await checkout_create_order(result);
        result = await checkout_send_whatsapp(result);
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
        res.status(result.code).json({
            code: result.code,
            status: result.status,
            message: result.message,
            data: result.data
        });
    } finally {
        client.release();
    }

}