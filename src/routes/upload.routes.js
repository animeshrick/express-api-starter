const express = require("express");
const router = express.Router();
const multer = require("multer");
const uploadController = require("../controllers/upload.controller");

// Configure multer for memory storage (buffer)
const upload = multer({ storage: multer.memoryStorage() });

// Single-file upload route
router.post("/single", upload.single("avatar"), uploadController.uploadToCloudinary);
router.post("/multiple", upload.array("avatars", 2), uploadController.uploadMultipleToCloudinary);

module.exports = router;