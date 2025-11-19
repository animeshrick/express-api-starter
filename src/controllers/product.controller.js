const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct
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
