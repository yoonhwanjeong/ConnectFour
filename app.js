const express = require("express");
const http = require("http");
const ws = require("ws");

const index = require("./routes/index");
const messages = require("./public/javascripts/messages");

const statTracker = require("./statTracker");
const Game = require("./game");

const port = process.argv[2];
const app = express();

app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

app.get("/play", index);

app.get("/", (req, res) => {
  res.render("splash.ejs", {
    gamesCompleted: statTracker.gamesCompleted,
    gamesOngoing: statTracker.gamesOngoing,
    hoursPlayed: statTracker.hoursPlayed
  });
});

const server = http.createServer(app);
const wsServer = new ws.Server({
  server
});

const games = {};

setInterval(function () {
  for (const id in games) {
    if (Object.prototype.hasOwnProperty.call(games, id)) {
      if (games[id].state >= 3) {
        delete games[id];
      }
    }
  }
}, 50000);

let game = new Game(statTracker.gamesInitialized++);
let id = 0;

wsServer.on("connection", function (socket) {
  const connection = socket;
  connection.id = id++;
  game.addPlayer(connection);

  console.log("Placed player %s in game %s", connection.id, game.id);

  connection.send(JSON.stringify(messages.WAIT));

  if (game.hasTwoConnectedPlayers()) {
    games[game.id] = game;
    const message = messages.START;
    message.gameId = game.id;
    game.announce(JSON.stringify(message));
    var turn = messages.TURN;
    turn.data = true;
    game.players[0].send(JSON.stringify(turn));
    turn.data = false;
    game.players[1].send(JSON.stringify(turn));
    game.startTime = Date.now();
    game = new Game(statTracker.gamesInitialized++);
    statTracker.gamesOngoing++;
  }

  connection.on("message", function incoming(messageString) {
    const message = JSON.parse(messageString);
    if (message.type === messages.PLAY.type || message.type === messages.RESULT.type) {
      const game = games[message.gameId];
      const player = game.players[0].id === connection.id ? 0 : 1;
      if (message.type === "PLAY") {
        game.players[1 - player].send(messageString);
        const turn = messages.TURN;
        turn.data = true;
        game.players[1 - player].send(JSON.stringify(turn));
        turn.data = false;
        game.players[player].send(JSON.stringify(turn));
      } else if (message.type === "RESULT") {
        game.endTime = Date.now();
        if (game.states[game.state] < 3) {
          statTracker.gamesCompleted++;
          statTracker.gamesOngoing--;
          statTracker.hoursPlayed += game.getHoursPlayed();
        }
        if (message.data === "player") {
          game.state = player === 0 ? "FIRST PLAYER WON" : "SECOND PLAYER WON";
        } else if (message.data === "opponent") {
          game.state = player === 0 ? "SECOND PLAYER WON" : "FIRST PLAYER WON";
        } else if (message.data === null) {
          game.state = "NO WINNER";
        }
      }
    }
  });

  connection.on("close", function (code) {
    console.log("Player %s disconnected", connection.id);

    if (code === 1001) {
      const game = (function () {
        for (const id in games) {
          if (games[id].players.find(value => {
            return value.id === connection.id;
          }) !== undefined) {
            return games[id];
          }
        }
      })();

      game.state = "PLAYER LEFT";
      game.endTime = Date.now();
      statTracker.gamesOngoing--;
      statTracker.hoursPlayed += game.getHoursPlayed();

      game.players.forEach(value => {
        try {
          value.close();
        } catch (e) {
          console.log("%s: Exception caught while closing player %s", arguments.callee.name, value.id);
        }
      });
    }
  });
});

server.listen(3000);
