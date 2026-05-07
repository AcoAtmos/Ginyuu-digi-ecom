const axios = require("axios");
const { db } = require("../../config/database");

exports.checkWhatsapp = async (phone) => {
    const { data } = await axios.post(
        process.env.API_URL + "/check-number",
        {
            api_key: process.env.API_KEY,
            sender: "6287879878393",
            number: phone
        }
    );
    return data;
};

exports.sendWhatsApp = async (phone, message) => {
    const { data } = await axios.post(
        process.env.API_URL + "/send-message",
        {
            api_key: process.env.API_KEY,
            sender: "6287879878393",
            number: phone,
            message: message
        }
    );
    return data;
};
