const redisHelper = require("../helper/redis.helper");
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductsByIds
} = require("../models/product.model");

// Create product
exports.createProduct = async (req, res, next) => {
  try {
    const product = await createProduct(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

// Get all products
exports.getProducts = async (req, res, next) => {
  try {
    const products = await getAllProducts();
    res.json({ success: true, data: products });
  } catch (err) {
    next(err);
  }
};

// Get single product
exports.getProductById = async (req, res, next) => {
  try {
    const product = await getProductById(req.params.id);

    const key = `recent:${req.user?.id || "guest"}`;
    const productId = req.params.id;

    // remove if product already exists in list
    await redisHelper.lRem(key, 0, productId);

    // add to the beginning
    await redisHelper.lPush(key, productId);

    // keep only last 10 products
    await redisHelper.lTrim(key, 0, 9);

    // fetch updated list
    // const p_ids = await redisHelper.lRange(key, 0, 9);
    // console.log("Recently viewed IDs:", p_ids);

    if (!product) return res.status(404).json({ message: "Not found" });
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

// Update product
exports.updateProduct = async (req, res, next) => {
  try {
    await updateProduct(req.params.id, req.body);
    const updated = await getProductById(req.params.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

// Delete product
exports.deleteProduct = async (req, res, next) => {
  try {
    await deleteProduct(req.params.id);
    
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    next(err);
  }
};

// Get recently viewed products
exports.recentlyViewedProducts = async (req, res, next) => {
  try {
    const key = `recent:${req.body.user_id || "guest"}`;

    // fetch updated list
    const p_ids = await redisHelper.lRange(key, 0, 9);

    console.log("Recently viewed IDs:", p_ids);

    if (!p_ids || p_ids.length === 0) {
      return res.json({ success: true, viewed: [] });
    }
    const productIds = await getProductsByIds(p_ids);
    
    // Maintain the order of recently viewed items
    const products = p_ids
      .map(id => productIds.find(p => p._id.toString() === id))
      .filter(p => p); // Remove any nulls (if product was deleted)

    res.json({ success: true, viewed: products });
  } catch (err) {
    next(err);
  }
};
