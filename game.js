var game = function (gameId) {
    this.playerA = null;
    this.playerB = null;
    this.id = gameId;
    this.fields = [[0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0]];
    this.gameState = "0_joined";
};


game.prototype.states = {
    "0_joined" : 0,
    "1_joined" : 1,
    "2_joined" : 2,
    "game_Awon" : 3,
    "game_Bwon" : 4,
    "game_draw" : 5,
    "player_left" : 6
};

game.prototype.addPlayer = function (player) {
    console.assert(player instanceof Object, "%s: Expecting an object (WebSocket), got a %s", arguments.callee.name, typeof player);

    if (this.gameState != "0_joined" && this.gameState != "1_joined") {
        return new Error("Invalid call to addPlayer, current state is %s", this.gameState);
    }

    if (this.playerA == null) {
        this.playerA = player;
        this.gameState = "1_joined";
    } else {
        this.playerB = player;
        this.gameState = "2_joined";
    }
};


game.prototype.hasTwoConnectedPlayers = function() {
    return this.gameState == "2_joined";
}

module.exports = game;