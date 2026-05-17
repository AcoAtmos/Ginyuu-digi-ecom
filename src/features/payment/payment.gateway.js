const axios = require("axios");

class klikQrisClient {
    constructor() {
        this.apiUrl = process.env.BASE_URL_SANDBOX_API
        this.apiKey = process.env.X_API_KEY
        this.merchantId = process.env.ID_MERCHANT
    }

    async createTransaction({orderId, amount, description}){
        const body = {
            order_id : orderId,
            id_merchant : this.merchantId,
            amount,
            keterangan : description || "Order payment"  
        };

        try {
            const response = await axios.post(this.apiUrl, body, {
                headers : {
                    'Content-Type' : 'application/json',
                    'x-api-key' : this.apiKey,
                    'id_merchant' : this.merchantId
                }
            });
            return response.data;
        } catch (err) {
            if (err.response) {
                console.error("KlikQRIS response error:", err.response.status, JSON.stringify(err.response.data, null, 2));
            }
            throw err;
        }
    }

    verifySignature(incomingSignature, storedSignature){
        if(!incomingSignature || !storedSignature){
            return false;
        }
        return incomingSignature === storedSignature;
    }
}
 
module.exports = new klikQrisClient();