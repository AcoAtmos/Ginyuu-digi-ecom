const {
    capturePayload,
    validatePayload,
    getPrice,
    countTotal
} =require('./checkout_service');



exports.checkout = async (req, res) => {
    try {
        let result = await capturePayload(req.body);
        result = await validatePayload(result);
        result = await getPrice(result); 

        result = await countTotal(result); 
        console.log(result);
        return res.status(200).json({
            code: 200,
            message: "Success",
            data: result
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            code: 500,
            message: "Internal Server Error",
            data: error
        });
    }
}