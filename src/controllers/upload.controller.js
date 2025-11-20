const cloudinary = require("../config/cloudinary");
const stream = require("stream");
const multer = require("multer");

// Multer instance for export if needed
// const upload = multer({ storage: multer.memoryStorage() });
// exports.upload = upload;

// Upload controller
exports.uploadToCloudinary = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    console.log("uploadToCloudinary res:", res);

    // Convert buffer → readable stream
    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    // Upload using Cloudinary stream
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "uploads" },
      (error, result) => {
        if (error) {
          return res.status(500).json({
            success: false,
            message: "Cloudinary upload failed",
            error,
          });
        }

        console.log("Cloudinary Result:", result);

        return res.status(200).json({
          success: true,
          message: "Uploaded successfully",
          url: result.secure_url,
          display_name: result.display_name,
          name: "",
        });
      }
    );

    // Pipe buffer → Cloudinary stream
    bufferStream.pipe(uploadStream);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error });
  }
};

// Multiple Upload controller

exports.uploadMultipleToCloudinary = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded",
      });
    }

    // Helper: upload a single buffer to Cloudinary using upload_stream and return a Promise
    const uploadBuffer = (buffer) => {
      return new Promise((resolve, reject) => {
        const bufferStream = new stream.PassThrough();
        bufferStream.end(buffer);

        const uploadStream = cloudinary.uploader.upload_stream({ folder: "uploads" }, (error, result) => {
          if (error) return reject(error);
          resolve(result);
        });

        bufferStream.pipe(uploadStream);
      });
    };

    // Upload all files in parallel
    const uploadPromises = req.files.map((file) => uploadBuffer(file.buffer));
    const results = await Promise.all(uploadPromises);

    const files = results.map((r) => ({
      url: r.secure_url,
      public_id: r.public_id,
      filename: r.display_name || null,
    }));

    return res.status(200).json({ success: true, message: `Uploaded successfully for ${req.body.name}`, files });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error });
  }
};
