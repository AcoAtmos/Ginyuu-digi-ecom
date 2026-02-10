    const service = require("./product_service");

exports.get_product = async (req, res) => {
    try {
        const slug = req.params.slug || "";
        
        if (!slug || slug === ""){
            const results = await service.getProduct();
            return res.status(200).json({
                success: true,
                message: "success",
                data: results
            });
        }else{
            const results = await service.getProductbyslug(slug);
            return res.status(200).json({
                success: true,
                message: "success",
                data: results
            });
        }       

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};
