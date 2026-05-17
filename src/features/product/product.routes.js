const router = require("express").Router();
const controller = require("./product.controller");

router.get("/", controller.get_all_product);
router.get("/home", controller.get_product_home);
router.get("/recommendations", controller.get_recommendations);
router.post("/batch", controller.get_products_batch);
router.get("/category/:page/:limit", controller.get_product_category);

module.exports = { router, prefix: "/product" };
