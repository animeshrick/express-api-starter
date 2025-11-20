const express = require("express");
const router = express.Router();
const multer = require("multer");
const uploadController = require("../controllers/upload.controller");

// Configure multer for memory storage (buffer)
const upload = multer({ storage: multer.memoryStorage() });

// Single-file upload route
router.post("/", upload.single("avatar"), uploadController.uploadToCloudinary);

module.exports = router;