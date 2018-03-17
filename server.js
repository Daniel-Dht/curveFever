

var express = require('express');
var app = express();

var server = app.listen(3000);
app.use(express.static('public'));

var socket = require('socket.io');
var io = socket(server);

var id = 0;
var players = [] ; // liste des joueurs

function Player(id,pseudo) { // objet joueur coté serveur
	this.id = id;
	this.tail = [];
	this.pseudo = pseudo;
	//this.color = 
}

io.sockets.on('connection', 
	function (socket) { 
    	console.log("We have a new client: " + socket.id);

   	socket.on('start', 
   		function(pseudo) {	
   			socket.broadcast.to(socket.id).emit('synchroPlayers',players);	
			var player = new Player(id,pseudo);
			players.push(player);
			socket.id = id;
			id++ ;	
			console.log("son pseudo est : "+player.pseudo+", son id :"+player.id);
			socket.broadcast.emit('messageConnect',players);
			//console.log(players);
   	});

    socket.on('tailTabEmit',
    	function(data) {
    		//console.log(data);
    		//socket.broadcast.emit('tailTabReceived', data);
    		for (var index = 0; index < players.length; index++) {
    			if( players[index].id == socket.id) {
    				//console.log(data);
    				for (var i = 0; i < data.length; i++) {
    					players[index].tail.push(data[i]);
    				}
    				// console.log(players[index].tail);
    				socket.broadcast.emit('tailOfOfAll',[data,players[index].id]);
    			}
    		}
    	}
    );

    socket.on('disconnect',
    	function() {
    		for (var index = 0; index < players.length; index++) {
    			if(players[index].id == socket.id){
    				console.log("Client has disconnected ("+players[index].pseudo+")");
      				socket.broadcast.emit('messageDisconnect',players[index].id);
    				players.splice(index,1);
    				//console.log(players);
    			} 
    		}    		
      	}
    );

});















