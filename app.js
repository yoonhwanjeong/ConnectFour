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

const port = process.env.PORT || 3000;
const app = express();

const fs = require("fs");

const stat = fs.readFileSync("./stat.txt").toString();
statTracker.gamesCompleted = parseInt(stat.substring(16, stat.indexOf("\n")));
statTracker.minutesPlayed = parseFloat(stat.substring(stat.indexOf("\n") + 15));
console.log("[%s] [Server]: Loaded stats from stat.txt", getTime());

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
        minutesPlayed: statTracker.minutesPlayed
    });
});

const server = http.createServer(app);
const wsServer = new ws.Server({
    server
});

const connections = {};

let currentGame = new Game(statTracker.gamesInitialized++);
let id = 0;

wsServer.on("connection", function (socket) {
    const connection = socket;
    connection.id = id++;
    currentGame.addPlayer(connection);
    connections[connection.id] = currentGame;

    console.log("[%s] [Server]: Placed player %s in game %s", getTime(), connection.id, currentGame.id);

    connection.send(JSON.stringify(messages.WAIT));

    if (currentGame.hasTwoConnectedPlayers()) {
        currentGame.announce(JSON.stringify(messages.START));
        const turn = messages.TURN;
        turn.data = true;
        currentGame.players[0].send(JSON.stringify(turn));
        turn.data = false;
        currentGame.players[1].send(JSON.stringify(turn));
        currentGame.startTime = Date.now();
        statTracker.gamesOngoing++;
        console.log("[%s] [Server]: Started game %s", getTime(), currentGame.id);
        currentGame = new Game(statTracker.gamesInitialized++);
    }

    connection.on("message", function incoming(messageString) {
        const message = JSON.parse(messageString);
        if (message.type === messages.PLAY.type || message.type === messages.RESULT.type || message.type === messages.CHAT.type) {
            const game = connections[connection.id];
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
                statTracker.minutesPlayed += game.getMinutesPlayed();
                console.log("[%s] [Server]: State of game %s was set to %s", getTime(), game.id, game.state);
            } else if (message.type === messages.CHAT.type) {
                game.players[1 - player].send(messageString);
            }
        }
    });

    connection.on("close", function (code) {
        console.log("[%s] [Server]: Player %s disconnected", getTime(), connection.id);

        if (code === 1001) {
            const game = connections[connection.id];
            if (game.states[game.state] === 1) {
                console.log("[%s] [Server]: Player %s left game %s before start, thus aborted", getTime(), connection.id, game.id);
                currentGame = new Game(statTracker.gamesInitialized++);
            } else if (game.states[game.state] === 2) {
                console.log("[%s] [Server]: Player %s left game %s before end, thus aborted", getTime(), connection.id, game.id);
                statTracker.gamesOngoing--;
                game.players.forEach(currentValue => {
                    try {
                        currentValue.close();
                    } catch (e) {
                        console.log("[%s] [Server]: Caught exception while closing player %s", getTime(), currentValue.id);
                    }
                });
            }
            delete connections[connection.id];
        }
    });
});
server.listen(port);
console.log("[%s] [Server]: Started server on %s", getTime(), port);

process.on("SIGINT", () => {
    fs.writeFileSync("./stat.txt", "gamesCompleted: " + statTracker.gamesCompleted + "\nminutesPlayed: " + statTracker.minutesPlayed);
    console.log("[%s] [Server]: Saved current stats to stat.txt", getTime());
    process.exit(0);
});

function getTime() {
    return new Date().toTimeString().substring(0, 8);
}
