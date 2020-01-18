var Messages = require("messages.js");

function Game(socket) {
    this.fields = [[0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0]];
    this.isOver = false;
    this.canPlay = false;

    this.setIsOver = function (isOver) {
        console.assert(typeof isOver === "boolean", "%s: Expected a boolean, got a %s", arguments.callee.name, typeof isOver);
        this.isOver = isOver;
        if (isOver) {

        } else {

        }
    };

    this.setCanPlay = function (canPlay) {
        console.assert(typeof canPlay === "boolean", "%s: Expected a boolean, got a %s", arguments.callee.name, typeof canPlay);
        this.canPlay = canPlay;
        var on = "div_player_turn_rect";
        var off = "div_player_turn_rect";
        if (canPlay) {
            on += 1;
            off += 2;
        } else {
            on += 2;
            off += 1;
        }
        document.getElementById(on).style.display = "";
        document.getElementById(off).style.display = "none";
    };

    this.play = function (column) {
        console.assert(typeof column === "number", "%s: Expected a number, got a %s", arguments.callee.name, typeof column);
        if (column >= 0 && column <= 6 && !this.isOver && this.canPlay && this.fields[column][0] < 6) {
            var row = 5 - fields[column][0];
            fields[column][row + 1] = 1;
            fields[column][0]++;
            var ellipse = document.createElement("ellipse");
            ellipse.cx = "50%";
            ellipse.cy = "50%";
            ellipse.rx = "24%";
            ellipse.ry = "44%";
            var svg = document.createElement("svg");
            svg.className = "chip player row-" + row + " col-" + column;
            svg.appendChild(ellipse);
            document.getElementById("container").appendChild(svg);
            this.setCanPlay(false);
            var play = Messages.PLAY;
            play.data = column;
            socket.send(JSON.stringify(play));
        }
    };
}

(function setup() {
    var socket = new WebSocket(Setup.WEB_SOCKET_URL);
    var game = new Game(socket);
    socket.onmessage = function (event) {
        var message = JSON.parse(event.data);
        if (message.type === Messages.TURN.type) {
            game.setCanPlay(true);
        } else if (message.type === Messages.PLAY.type) {
            var row = 5 - game.fields[message.data][0];
            fields[message.data][row + 1] = 2;
            fields[message.data][0]++;
            game.setCanPlay(true);
        } else if (message.type === Messages.GAME_OVER.type) {

        }
    };

    socket.onopen = function () {
        socket.send(JSON.stringify(Messages.JOIN));
    };

    socket.onclose = function () {

    }
})();