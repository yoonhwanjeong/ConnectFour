(function (exports) {
    /*
     * Client to server: when a client connects to the server
     */
    exports.JOIN = {
        type: "JOIN"
    };

    /*
     * Server to client: when it is a player's turn
     */
    exports.TURN = {
        type: "TURN"
    };

    /*
     * Client to server or server to client: when a player makes a move
     */
    exports.PLAY = {
        type: "PLAY",
        data: null
    };

    /*
     * Server to client: when a player makes an invalid move
     */
    exports.PLAY_ERROR = {
        type: "PLAY_ERROR"
    };

    /*
     * Server to client: when the game is over
     */
    exports.GAME_OVER = {
        type: "GAME_OVER",
        data: null
    };

    /*
     * Server to client: when a player leaves
     */
    exports.ERROR = {
        type: "ERROR"
    }
})(typeof exports === "undefined" ? this.Messages = {} : exports);