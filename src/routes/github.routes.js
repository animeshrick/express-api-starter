const express = require("express");
const router = express.Router();
const githubController = require("../controllers/github.controller");


// CRUD Routes
router.get("/:username", githubController.getUserEvents);

module.exports = router;