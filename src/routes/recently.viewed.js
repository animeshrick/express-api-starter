const express = require("express");
const router = express.Router();
const productController = require("../controllers/product.controller");

// CRUD Routes
router.get("/", productController.recentlyViewedProducts);

module.exports = router;