const express = require("express");
const router = express.Router();

router.get("/splash", function (req, res) {
  res.sendFile("splash.html", {
    root: "./public"
  });
});

router.get("/play", function (req, res) {
  res.sendFile("game.html", {
    root: "./public"
  });
});

module.exports = router;
