const { getDB } = require("../config/db");
const { ObjectId } = require("mongodb");

const COLLECTION_NAME = "products";

// Get the products collection
function getProductsCollection() {  
  const db = getDB();
  return db.collection(COLLECTION_NAME);
}

// Create a new product
async function createProduct(productData) {
  const collection = getProductsCollection();
  const doc = {
    name: productData.name,
    price: productData.price,
    stock: productData.stock || 0,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  const result = await collection.insertOne(doc);
  return { _id: result.insertedId, ...doc };
}

// Find all products
async function getAllProducts() {
  const collection = getProductsCollection();
  return await collection.find({}).toArray();
}

// Find product by ID
async function getProductById(id) {
  const collection = getProductsCollection();
  
  // Validate ObjectId format
  if (!ObjectId.isValid(id)) {
    return null;
  }
  
  return await collection.findOne({ _id: new ObjectId(id) });
}

// Update product
async function updateProduct(id, updateData) {
  const collection = getProductsCollection();
  const result = await collection.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        ...updateData,
        updatedAt: new Date()
      }
    }
  );
  return result;
}

// Delete product
async function deleteProduct(id) {
  const collection = getProductsCollection();
  return await collection.deleteOne({ _id: new ObjectId(id) });
}

// Find products by multiple IDs
async function getProductsByIds(ids) {
  const collection = getProductsCollection();
  const objectIds = ids
    .filter(id => ObjectId.isValid(id))
    .map(id => new ObjectId(id));
    
  if (objectIds.length === 0) return [];
  
  return await collection.find({ _id: { $in: objectIds } }).toArray();
}

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductsByIds
};
