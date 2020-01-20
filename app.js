var express = require("express");
var http = require("http");
var websocket = require("ws");

var indexRouter = require("./routes/index");
var messages = require("./public/javascripts/messages");

var gameStatus = require("./statTracker");
var Game = require("./game");

var port = process.argv[2];
var app = express();

// app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

app.get("/play", indexRounter);

app.get("/", (req, res) => {

})