(function (exports) {
    exports.JOIN = {
        type: "JOIN"
    };

    exports.WAIT = {
        type: "WAIT"
    };

    exports.START = {
        type: "START"
    };

    exports.TURN = {
        type: "TURN",
        data: null
    };

    exports.PLAY = {
        type: "PLAY",
        data: null
    };

    exports.RESULT = {
        type: "RESULT",
        data: null
    };

    exports.ERROR = {
        type: "ERROR"
    };

    exports.CHAT = {
        type: "CHAT",
        data: null
    };
})(typeof exports === "undefined" ? this.Messages = {} : exports);