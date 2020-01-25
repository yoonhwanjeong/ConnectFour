const game = function (id) {
    this.id = id;
    this.state = "0 PLAYER";
    this.startTime = 0;
    this.endTime = 0;
    this.players = [];
};

game.prototype.states = {};
game.prototype.states["0 PLAYER"] = 0;
game.prototype.states["1 PLAYER"] = 1;
game.prototype.states["2 PLAYERS"] = 2;
game.prototype.states["FIRST PLAYER WON"] = 3;
game.prototype.states["SECOND PLAYER WON"] = 4;
game.prototype.states["NO WINNER"] = 5;
game.prototype.states["PLAYER LEFT"] = 6;

game.prototype.addPlayer = function (connection) {
    console.assert(typeof connection === "object", "%s: Expected an object but got a %s", arguments.callee.name, typeof connection);
    this.players.push(connection);
    if (this.states[this.state] === 0) {
        this.state = "1 PLAYER";
    } else if (this.states[this.state] === 1) {
        this.state = "2 PLAYERS";
    }
};

game.prototype.hasTwoConnectedPlayers = function () {
    return this.states[this.state] === 2;
};

game.prototype.announce = function (message) {
    console.assert(typeof message === "string", "%s: Expected a string but got a %s", arguments.callee.name, typeof message);
    this.players.forEach(player => player.send(message));
};

game.prototype.getMinutesPlayed = function () {
    return parseFloat(((this.endTime - this.startTime) / 60000).toFixed(1));
};

module.exports = game;
