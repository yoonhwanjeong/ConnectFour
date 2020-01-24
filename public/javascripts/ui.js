function Board() {
    this.fields = [[0, -1, -1, -1, -1, -1, -1], [0, -1, -1, -1, -1, -1, -1], [0, -1, -1, -1, -1, -1, -1], [0, -1, -1, -1, -1, -1, -1], [0, -1, -1, -1, -1, -1, -1], [0, -1, -1, -1, -1, -1, -1], [0, -1, -1, -1, -1, -1, -1]];

    this.checkFields = (player, coordinates) => {
        console.assert(typeof player === "number" && player >= 0 && player < 2, "%s: Expected a number between 0 and 1 but got a %s", arguments.callee.name, typeof player);
        console.assert(coordinates instanceof Array && coordinates.length === 4 && coordinates.every(element => {
            return element instanceof Array && element.length === 2;
        }), "%s: Expected an array of arrays but got a %s", arguments.callee.name, typeof coordinates);
        return coordinates.every(element => {
            return this.fields[element[1]][element[0] + 1] === player;
        });
    };

    this.hasRow = (player) => {
        console.assert(typeof player === "number" && player >= 0 && player < 2, "%s: Expected a number between 0 and 1 but got a %s", arguments.callee.name, typeof player);
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 4; j++) {
                if (this.checkFields(player, [[i, j], [i, j + 1], [i, j + 2], [i, j + 3]])) {
                    return true;
                }
            }
        }
        return false;
    };

    this.hasColumn = (player) => {
        console.assert(typeof player === "number" && player >= 0 && player < 2, "%s: Expected a number between 0 and 1 but got a %s", arguments.callee.name, typeof player);
        for (let i = 0; i < 7; i++) {
            for (let j = 0; j < 3; j++) {
                if (this.checkFields(player, [[j, i], [j + 1, i], [j + 2, i], [j + 3, i]])) {
                    return true;
                }
            }
        }
        return false;
    };

    this.hasDiagonal = (player) => {
        let i;
        let j;
        console.assert(typeof player === "number" && player >= 0 && player < 2, "%s: Expected a number between 0 and 1 but got a %s", arguments.callee.name, typeof player);
        // top left to bottom right
        for (i = 0; i < 3; i++) {
            for (j = 0; j < 4; j++) {
                if (this.checkFields(player, [[i, j], [i + 1, j + 1], [i + 2, j + 2], [i + 3, j + 3]])) {
                    return true;
                }
            }
        }
        // top right to bottom left
        for (i = 0; i < 3; i++) {
            for (j = 0; j < 4; j++) {
                if (this.checkFields(player, [[i, j + 3], [i + 1, j + 2], [i + 2, j + 1], [i + 3, j]])) {
                    return true;
                }
            }
        }
        return false;
    };

    this.isWinner = (player) => {
        console.assert(typeof player === "number" && player >= 0 && player < 2, "%s: Expected a number between 0 and 1 but got a %s", arguments.callee.name, typeof player);
        return this.hasRow(player) || this.hasColumn(player) || this.hasDiagonal(player);
    };

    this.hasWinner = () => {
        return this.isWinner(0) || this.isWinner(1);
    };

    this.isFull = () => {
        let sum = 0;
        for (let i = 0; i < 7; i++) {
            sum += this.fields[i][0];
        }
        return sum === 42;
    };

    this.isOver = () => {
        return this.hasWinner() || this.isFull();
    };

    this.setField = (row, column, player) => {
        this.fields[column][row + 1] = player;
        this.fields[column][0]++;
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("class", "chip " + (player === 0 ? "player" : "enemy") + " row-" + row + " col-" + column);
        const ellipse = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
        ellipse.setAttribute("cx", "50%");
        ellipse.setAttribute("cy", "50%");
        ellipse.setAttribute("rx", "24%");
        ellipse.setAttribute("ry", "44%");
        svg.appendChild(ellipse);
        document.getElementById("chips").appendChild(svg);
    };

    this.setTurn = (turn) => {
        console.assert(typeof turn === "boolean", "%s: Expected a boolean but got a %s", arguments.callee.name, typeof turn);
        this.turn = turn;
        const player = document.getElementById("div_player_turn_rect1");
        const enemy = document.getElementById("div_player_turn_rect2");
        if (this.turn) {
            player.style.display = "block";
            enemy.style.display = "none";
        } else {
            player.style.display = "none";
            enemy.style.display = "block";
        }
    };
}

function MessageBox() {
    this.setMessage = function (message, isButtonVisible = true) {
        document.getElementById("pop_up_text").innerHTML = message;
        if (!isButtonVisible) {
            document.getElementById("loading").style.display = "block";
            document.getElementById("play_again_button").style.display = "none";
        } else {
            document.getElementById("loading").style.display = "none";
            document.getElementById("play_again_button").style.display = "table";
        }
        document.getElementById("pop_up_bg").style.display = "table";
    };

    this.close = function () {
        document.getElementById("pop_up_bg").style.display = "none";
    };
}

function Timer() {
    this.element = document.getElementById("time");
    this.id = null;

    this.reset = function () {
        this.stop();
        this.element.innerHTML = "0 : 0";
    };

    this.start = function () {
        this.reset();
        this.id = setInterval(() => {
            const time = this.element.innerHTML;
            const index = time.indexOf(":");
            let minute = parseInt(time.substring(0, index - 1));
            let second = parseInt(time.substring(index + 2)) + 1;
            if (second === 60) {
                minute++;
                second = 0;
            }
            this.element.innerHTML = (minute < 10 ? "0" : "") + minute + " : " + (second < 10 ? "0" : "") + second;
        }, 1000);
    };

    this.stop = function () {
        if (this.id !== null) {
            clearInterval(this.id);
            this.id = null;
        }
    };
}

function Chat(socket) {
    document.getElementById("chat-display").value = "";
    document.getElementById("chat-input").value = "";
    document.getElementById("chat-icon").addEventListener("click", () => {
        this.open();
    });
    document.getElementById("chat-alert").addEventListener("click", () => {
        this.open();
    });
    document.getElementById("chat-close").addEventListener("click", () => {
        this.close();
    });
    document.getElementById("chat-input").addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            this.send();
        }
    });
    document.getElementById("chat-send").addEventListener("click", () => {
        this.send();
    });
    this.open = () => {
        document.getElementById("chat-icon").style.display = "none";
        document.getElementById("chat").style.display = "block";
        document.getElementById("chat-alert").style.display = "none";
    };
    this.close = () => {
        document.getElementById("chat").style.display = "none";
        document.getElementById("chat-icon").style.display = "block";
    };
    this.send = () => {
        document.getElementById("chat-display").value += "You: " + document.getElementById("chat-input").value + "\n";
        document.getElementById("chat-display").scrollTop = document.getElementById("chat-display").scrollHeight;
        Messages.CHAT.data = document.getElementById("chat-input").value;
        socket.send(JSON.stringify(Messages.CHAT));
        document.getElementById("chat-input").value = "";
    };
    this.showIcon = () => {
        document.getElementById("chat-icon").style.display = "block";
    };
    this.append = (message) => {
        document.getElementById("chat-display").value += message;
    };
    this.isOpened = () => {
        return document.getElementById("chat").style.display === "block";
    };
    this.showAlert = () => {
        document.getElementById("chat-alert").style.display = "block";
    };
}
