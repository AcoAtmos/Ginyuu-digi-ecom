const whatsappService = require("./whatsapp_service");

exports.check_whatsapp = async (req, res) => {
    try {
        const { phone } = req.params;
        const formattedPhone = phone.startsWith('0') ? phone : `0${phone}`;
        const result = await whatsappService.check_whatsapp(formattedPhone);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};