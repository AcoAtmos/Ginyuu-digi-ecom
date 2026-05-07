const { checkWhatsapp } = require("../../shared/services/whatsapp.service");

exports.check_whatsapp = async (req, res) => {
    try {
        const { phone } = req.params;
        const result = await checkWhatsapp(phone);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
