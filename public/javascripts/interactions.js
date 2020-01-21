function Game(socket, board, timer, messageBox) {
    console.assert(typeof socket === "object", "%s: Expected an object but got a %s", arguments.callee.name, typeof socket);
    console.assert(typeof board === "object", "%s: Expected an object but got a %s", arguments.callee.name, typeof board);
    console.assert(typeof timer === "object", "%s: Expected an object but got a %s", arguments.callee.name, typeof timer);
    console.assert(typeof messageBox === "object", "%s: Expected an object but got a %s", arguments.callee.name, typeof messageBox);
    this.socket = socket;
    this.board = board;
    this.timer = timer;
    this.messageBox = messageBox;
    this.isTurn = false;

    this.update = (column, player) => {
        let message;
        console.assert(typeof column === "number", "%s: Expected a number but got a %s", arguments.callee.name, typeof column);
        console.assert(typeof player === "number", "%s: Expected a number but got a %s", arguments.callee.name, typeof player);
        if (column >= 0 && column < 7 && this.board.fields[column][0] < 6 && player >= 0 && player < 2 && (this.isTurn || player === 1) && !this.board.isOver()) {
            const row = 5 - this.board.fields[column][0];
            this.board.setField(row, column, player);
            if (player === 0) {
                message = Messages.PLAY;
                message.data = column;
                this.socket.send(JSON.stringify(message));
            }
            new Audio("../data/chip_fall.wav").play();
        }
        if (this.board.isOver()) {
            this.timer.stop();
            message = Messages.RESULT;
            if (this.board.hasWinner()) {
                if (this.board.isWinner(0)) {
                    this.messageBox.setMessage(Status["gameWon"]);
                    message.data = "player";
                    new Audio("../data/game_won.wav").play();
                } else {
                    this.messageBox.setMessage(Status["gameLost"]);
                    message.data = "opponent";
                    new Audio("../data/game_lost.wav").play();
                }
            } else {
                this.messageBox.setMessage(Status["gameDrew"]);
            }
            this.socket.send(JSON.stringify(message));
        }
    };

    this.setTurn = (isTurn) => {
        this.isTurn = isTurn;
        this.board.setTurn(isTurn);
    };
}

function enterFullscreen() {
    const element = document.documentElement;
    if (element.requestFullscreen) {
        element.requestFullscreen();
    } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
    } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
    } else if (element.mozRequestFullscreen) {
        element.mozRequestFullscreen();
    }
}

function quitFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    } else if (document.mozCancelFullscreen) {
        document.mozCancelFullsreen();
    }
}

(function setup() {
    var socket = new WebSocket(Setup.WEB_SOCKET_URL);

    var board = new Board();
    var timer = new Timer();
    var messageBox = new MessageBox();

    var game = new Game(socket, board, timer, messageBox);

    (function registerClickables(game) {
        var clickables = document.getElementById("clickables").children;
        for (var i = 0; i < clickables.length; i++) {
            var item = clickables.item(i);
            var column = parseInt(item.getAttribute("data-column"));
            item.onclick = ((game, column) => {
                return () => game.update(column, 0);
            })(game, column);
        }
    })(game);

    socket.onmessage = function (event) {
        var message = JSON.parse(event.data);
        if (message.type === Messages.WAIT.type) {
            messageBox.setMessage(Status["waiting"], false);
        } else if (message.type === Messages.START.type) {
            messageBox.close();
            timer.start();
            const audio = new Audio("../data/gameplay.mp3");
            audio.loop = true;
            audio.play();
        } else if (message.type === Messages.TURN.type) {
            game.setTurn(message.data);
        } else if (message.type === Messages.PLAY.type) {
            game.update(message.data, 1);
        }
    };

    socket.onopen = function () {
        socket.send(JSON.stringify(Messages.JOIN));
    };

    socket.onclose = function () {
        if (!game.board.isOver()) {
            timer.stop();
            messageBox.setMessage(Status["aborted"]);
            new Audio("../data/game_aborted.wav");
        }
    };

    socket.onerror = function () {
    };
})();
