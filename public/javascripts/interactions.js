function Game(socket, board, timer, messageBox) {
    console.assert(typeof socket === "object", "%s: Expected an object but got a %s", arguments.callee.name, typeof socket);
    console.assert(typeof board === "object", "%s: Expected an object but got a %s", arguments.callee.name, typeof board);
    console.assert(typeof timer === "object", "%s: Expected an object but got a %s", arguments.callee.name, typeof timer);
    console.assert(typeof messageBox === "object", "%s: Expected an object but got a %s", arguments.callee.name, typeof messageBox);
    this.gameId = -1;
    this.socket = socket;
    this.board = board;
    this.timer = timer;
    this.messageBox = messageBox;
    this.isTurn = false;

    this.update = (column, player) => {
        console.assert(typeof column === "number", "%s: Expected a number but got a %s", arguments.callee.name, typeof column);
        console.assert(typeof player === "number", "%s: Expected a number but got a %s", arguments.callee.name, typeof player);
        if (column >= 0 && column < 7 && this.board.fields[column][0] < 6 && player >= 0 && player < 2 && (this.isTurn || player === 1) && !this.board.isOver()) {
            var row = 5 - this.board.fields[column][0];
            this.board.setField(row, column, player);
            if (player === 0) {
                var message = Messages.PLAY;
                message.gameId = this.gameId;
                message.data = column;
                this.socket.send(JSON.stringify(message));
            }
        }
        if (this.board.isOver()) {
            this.timer.stop();
            var message = Messages.RESULT;
            message.gameId = this.gameId;
            if (this.board.hasWinner()) {
                if (this.board.isWinner(0)) {
                    this.messageBox.setMessage(Status["gameWon"]);
                    message.data = "player";
                } else {
                    this.messageBox.setMessage(Status["gameLost"]);
                    message.data = "opponent";
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
            console.log(message);
            messageBox.setMessage(Status["waiting"], false);
        } else if (message.type === Messages.START.type) {
            console.log(message);
            messageBox.close();
            timer.start();
            game.gameId = message.gameId;
        } else if (message.type === Messages.TURN.type) {
            console.log(message);
            game.setTurn(message.data);
        } else if (message.type === Messages.PLAY.type) {
            console.log(message);
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
        }
    };

    socket.onerror = function () {};
})();
