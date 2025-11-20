const express = require("express");
const cors = require("cors");

const productRoutes = require("./routes/product.routes");
const githubRoutes = require("./routes/github.routes");
const uploadRoutes = require("./routes/upload.routes");
const errorHandler = require("./middlewares/error.middleware");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json()); // Parse JSON body

// Routes
app.use("/api/products", productRoutes);
app.use("/api/github", githubRoutes);
app.use("/api/upload", uploadRoutes);

// Health Check Route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// 404 Route Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
