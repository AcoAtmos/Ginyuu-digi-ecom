const service = require("./product_service");

exports.get_product = async (req, res) => {
    try {
        const products = await service.getProduct();

        return res.status(200).json({
            success: true,
            message: "success",
            data: products
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};
