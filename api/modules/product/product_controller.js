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

exports.get_product_home = async (req, res) => {
    try {
        const results = await service.getProductHome();
        return res.status(200).json({
            success: true,
            message: "success",
            data: results
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

exports.get_product_category = async (req, res) => {
    try {
        const page = req.params.page || 1;
        const limit = req.params.limit || 12;
        const results = await service.getProductCategory(page, limit);
        return res.status(200).json({
            success: true,
            message: "success",
            data: results
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};