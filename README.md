# ConnectFour

[Connect Four](https://en.wikipedia.org/wiki/Connect_Four) is a two-player connection rack game, in which the players choose a color and then take turns dropping colored tokens into a seven-column, six-row vertically suspended grid.
This is web-based implementation of the game.

## Running

Run `node start` to start the server. Open browser and go to `localhost:3000` to play the gmae.

## Configuration

Change cookieSecret in [credentials.js](credentials.js).
If the server is running on a remote server, make sure to change `WEB_SOCKET_URL` in [config.js](public/javascripts/config.js) accordingly.