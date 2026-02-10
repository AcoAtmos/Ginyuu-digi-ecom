const {
    capturePayload,
    validatePayload,
    getPrice,
    countTotal,
    checkout_add_user,
    checkout_send_whatsapp,
    createResponse
} =require('./checkout_service');



exports.checkout = async (req, res) => {
    let result = await capturePayload(req.body);
    result = await validatePayload(result);
    result = await getPrice(result); 
    result = await countTotal(result); 
    result = await checkout_add_user(result);
    result = await checkout_send_whatsapp(result);
    result = await createResponse(result);
    res.status(result.code).json({
        code: result.code,
        status: result.status,
        message: result.message,
        data: result.data
    });

}