(function (exports) {
    exports.JOIN = {
        type: "JOIN"
    };

    exports.WAIT = {
        type: "WAIT"
    };

    exports.START = {
        type: "START",
        gameId: null
    };

    exports.TURN = {
        type: "TURN",
        data: null
    };

    exports.PLAY = {
        type: "PLAY",
        gameId: null,
        data: null
    };

    exports.RESULT = {
        type: "RESULT",
        gameId: null,
        data: null
    };

    exports.ERROR = {
        type: "ERROR"
    };
})(typeof exports === "undefined" ? this.Messages = {} : exports);