var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var port = process.env.PORT || 3000;

// app.get('/', (req, res) => {
//   res.sendFile(__dirname + '/index.html');
// });

// -----------------------------------------------------------
// List of all players
// -----------------------------------------------------------
var Players = [];

function Player(id, nick, skin, position){
    this.id = id;
    this.nick = nick;
    this.skin = skin;
    this.index = Players.length;
    this.position = position
}

Player.prototype = {
    getId: function(){
        return {id: this.id};
    },
    getNick: function(){
      return {nick: this.nick};
    },
    getSkin: function(){
      return {skin: this.skin};
    },
    getIndex: function(){
      return {index: this.index};
    },
    getPosition: function(){
      return {position: this.position};
    }
};

function createPlayer(message) {
      console.log("CREATE PLAYER: ", message)
      let player = new Player(Players.length, message.data.nick, message.data.skin, {"x": 12,"y": 10});
      Players.push(player);
      console.log("PLAYERS DISPONÍVEIS: ", Players)
      return player;
}

function existeNick(nickPlayer) {
  let lRetorno = false;
  if(Players.length > 0) {
    Players.forEach(function(player) {
      console.log("EXISTE O NICK? ", player.nick, nickPlayer)
      if(player.nick.toLowerCase() == nickPlayer.toLowerCase()) {
        lRetorno = true;
        return;
      }
    })
  }
  return lRetorno;
}

io.on('connection', function(client) {

  console.log("Cliente conectado:: ", client);

    client.on('message', function(message) {

      switch(message.action){
        case 'CREATE':
          let playerCreated = null;
          if(!existeNick(message.data.nick)) {
            playerCreated = createPlayer(message);
          } else {
            let error = {
              "action":"CREATE",
              "error": true,
              "msg":"Nick de usuário já existe"
            }
            client.emit('message', error);
            return;
          }

          let player = {
            "action": "PLAYER_JOIN",
            "data":  {
                "nick": playerCreated.nick,
                "skin": playerCreated.skin,
                "id": playerCreated.id,
                "position": playerCreated.position,
                "playersON": Players
            },
            "error": false,
            "msg":""
          }
          io.emit('message', player);
          playerCreated = null;
          break;

        case 'MOVE':
          let playerMove = {
            "action": "MOVE",
            "data":  {
                "player_id": message.data.player_id,
                "direction": message.data.direction,
                "position": {
                  "x": message.data.position.x,
                  "y": message.data.position.y
                }
            },
            "error": false,
            "msg":""
          }
          //Atualizando a posição do player
          Players[message.data.player_id].position = message.data.position;
          console.log("PLAYER MOVE TO: ", playerMove);
          client.broadcast.emit('message', playerMove);
          break;
      }

      // user disconnected
      client.on('disconnect', function(connection) {
        console.log('DISCONNECT: ', connection)
        console.log("MESSAGE:: ", message)
        let playerLeaved = {
          "action": "PLAYER_LEAVED",
          "data":  {
              "nick": message.data.nick,
              "id": message.data.player_id,
          },
          "error": false,
          "msg":""
        }
        client.broadcast.emit('message', playerLeaved);
        delete Players[message.data.player_id];

      });

    });
  
  });


http.listen(port, function(){
  console.log('Mountain Fight on *:' + port);
});
