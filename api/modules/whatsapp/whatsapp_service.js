const axios = require("axios");

exports.check_whatsapp = async (phone) => {
    const dt = {
        data: null,
        message: "valid",
        status: "success",
        code: 200
    };

    try {
        const baseUrl = process.env.API_URL;
        const apiKey = process.env.API_KEY;

        if (!baseUrl || !apiKey) {
            throw new Error("API_URL or API_KEY is not defined");
        }

        const payload = {
            phone_no: phone,
            key: apiKey
        };

        const response = await axios.post(`${baseUrl}/check_number`, payload, {
            headers: { 'Content-Type': 'application/json' }
        });
        console.log('response : ', response.data)

        if (response?.data?.code === 200) {
            if (response?.data?.results?.message == 'Registered number on whatsapp') {
                dt.message = "number is valid";
                dt.status = "success";
                dt.code = 200;
            } else {
                dt.message = "Number is not found";
                dt.status = "fail";
                dt.code = 404;
            }
        } else {
            dt.message = "Invalid response from WhatsApp API";
            dt.status = "fail";
            dt.code = response?.data?.code || 500;
        }

    } catch (error) {
        dt.message = error.response?.data?.message || error.message;
        dt.status = "error";
        dt.code = error.response?.status || 500;
        dt.phone = phone;
    }

    return dt;
};

exports.send_whatsapp = async(no_phone, message) => {
    // hit api and check number
    try{
        const baseUrl = process.env.API_URL;
        const apiKey = process.env.API_KEY;

        if (!baseUrl || !apiKey) {
            throw new Error("API_URL or API_KEY is not defined");
        }

        const payload = {
            phone_no: no_phone,
            key: apiKey,
            message: message,
        };

        const response = await axios.post(`${baseUrl}/send_message`, payload, {
            headers: { 'Content-Type': 'application/json' }
        });
        console.log('response : ', response.data)

        // return response
        return response.data;

    }catch(err){
        throw new Error(err);
    }
};

