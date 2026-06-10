const axios = require("axios");
const { db } = require("../../../db");
const { sql } = require("drizzle-orm");
const { normalizePhone } = require("../helpers/phone");

exports.sendWhatsApp = async (phone, message) => {
    const baseUrl = process.env.ENDPOINT_URL || process.env.API_URL;
    const apiKey = process.env.WHATSAPP_API_KEY || process.env.API_KEY_WOOWA;
    const normalized = normalizePhone(phone) || phone;

    const payload = {
        phone_no: normalized,
        key: apiKey,
        message: message,
    };

    const response = await axios.post(`${baseUrl}/send_message`, payload, {
        headers: { 'Content-Type': 'application/json' },
    });

    return response.data;
};

exports.checkWhatsapp = async (phone) => {
    const baseUrl = process.env.ENDPOINT_URL || process.env.API_URL;
    const apiKey = process.env.WHATSAPP_API_KEY || process.env.API_KEY_WOOWA;
    const normalized = normalizePhone(phone) || phone;

    const { data } = await axios.post(
        `${baseUrl}/check-number`,
        { phone_no: normalized, key: apiKey },
        { headers: { 'Content-Type': 'application/json' } }
    );
    return data;
};

exports.sendWaWorker = async () => {
    try {
        const [row] = (await db.execute(sql`
            SELECT id, pesan, destination
            FROM queue
            WHERE tipe = 'whatsapp'
            AND status = 'pending'
            ORDER BY id ASC
            LIMIT 1
        `)).rows;

        if (!row) return;

        const result = await exports.sendWhatsApp(row.destination, row.pesan);
        const status = (result && result.code === 200) ? 'success' : 'failed';
        await db.execute(sql`UPDATE queue SET status = ${status} WHERE id = ${row.id}`);
    } catch (err) {
        console.error("sendWaWorker error:", err);
    }
};
