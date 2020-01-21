const express = require("express");
const http = require("http");
const ws = require("ws");
const credentials = require("./credentials");
const cookieParser = require("cookie-parser");
const expressSession = require("express-session");

const index = require("./routes/index");
const messages = require("./public/javascripts/messages");

const statTracker = require("./statTracker");
const Game = require("./game");

const port = process.argv[2] || process.env.port || 3000;
const app = express();

app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(cookieParser(credentials.cookieSecret));
app.use(expressSession({
    secret: credentials.cookieSecret,
    resave: false,
    saveUninitialized: true
}));

app.get("/play", index);

app.get("/", (req, res) => {
    const session = req.session;
    if (session.timesVisited) {
        session.timesVisited++;
    } else {
        session.timesVisited = 1;
    }
    res.render("splash.ejs", {
        gamesCompleted: statTracker.gamesCompleted,
        gamesOngoing: statTracker.gamesOngoing,
        timesVisited: session.timesVisited,
        hoursPlayed: statTracker.hoursPlayed
    });
});

const server = http.createServer(app);
const wsServer = new ws.Server({
    server
});

const games = {};

setInterval(function () {
    let count = 0;
    for (const id in games) {
        if (Object.prototype.hasOwnProperty.call(games, id)) {
            if (games[id].states[games[id].state] >= 3) {
                delete games[id];
                count++;
            }
        }
    }
    console.log("[%s] [Server]: Deleted %s finished games", new Date().toTimeString().substring(0, 8), count);
}, 50000);

let currentGame = new Game(statTracker.gamesInitialized++);
let id = 0;

wsServer.on("connection", function (socket) {
    const connection = socket;
    connection.id = id++;
    currentGame.addPlayer(connection);

    console.log("[%s] [Server]: Placed player %s in game %s", new Date().toTimeString().substring(0, 8), connection.id, currentGame.id);

    connection.send(JSON.stringify(messages.WAIT));

    if (currentGame.hasTwoConnectedPlayers()) {
        games[currentGame.id] = currentGame;
        const message = messages.START;
        message.gameId = currentGame.id;
        currentGame.announce(JSON.stringify(message));
        const turn = messages.TURN;
        turn.data = true;
        currentGame.players[0].send(JSON.stringify(turn));
        turn.data = false;
        currentGame.players[1].send(JSON.stringify(turn));
        currentGame.startTime = Date.now();
        currentGame = new Game(statTracker.gamesInitialized++);
        statTracker.gamesOngoing++;
        console.log("[%s] [Server]: Started game %s", new Date().toTimeString().substring(0, 8), currentGame.id);
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
            } else if (message.type === "RESULT" && game.states[game.state] < 3) {
                if (message.data === "player") {
                    game.state = player === 0 ? "FIRST PLAYER WON" : "SECOND PLAYER WON";
                } else if (message.data === "opponent") {
                    game.state = player === 0 ? "SECOND PLAYER WON" : "FIRST PLAYER WON";
                } else if (message.data === null) {
                    game.state = "NO WINNER";
                }
                game.endTime = Date.now();
                statTracker.gamesCompleted++;
                statTracker.gamesOngoing--;
                statTracker.hoursPlayed += game.getHoursPlayed();
                console.log("[%s] [Server]: State of game %s was set to %s", new Date().toTimeString().substring(0, 8), game.id, game.state);
            }
        }
    });

    connection.on("close", function (code) {
        console.log("[%s] [Server]: Player %s disconnected", new Date().toTimeString().substring(0, 8), connection.id);

        if (code === 1001) {
            const game = (function () {
                for (const id in games) {
                    if (games[id].players.find(value => {
                        return value.id === connection.id;
                    }) !== undefined) {
                        return games[id];
                    }
                }
                return null;
            })();

            if (game === null && currentGame.states[currentGame.state] === 1) {
                console.log("[%s] [Server]: Player %s left game %s before having 2 players, thus aborted", new Date().toTimeString().substring(0, 8), connection.id, currentGame.id);
                currentGame = new Game(statTracker.gamesInitialized++);
            } else if (game !== null && game.states[game.state] < 3) {
                game.state = "PLAYER LEFT";
                statTracker.gamesOngoing--;
                console.log("[%s] [Server]: Player %s left game %s before end, thus aborted", new Date().toTimeString().substring(0, 8), connection.id, game.id);
                game.players.forEach(value => {
                    try {
                        value.close();
                    } catch (e) {
                        console.log("[%s] [Server]: Caught exception while closing player %s", new Date().toTimeString().substring(0, 8), value.id);
                    }
                });
            }
        }
    });
});
server.listen(port);
console.log("[%s] [Server]: Started server on %s", new Date().toTimeString().substring(0, 8), port);
