

var express = require('express');
var app = express();

var server = app.listen(3000);
app.use(express.static('public'));

var socket = require('socket.io');
var io = socket(server);

var heartbeats = require('heartbeats'); // permet de gérer le temps

var id = 0;
var players = [] ; // liste des joueurs
// var colors = ['#DB0A0A','#06A50E','#FF8E05','#053BFF','#FF02EE','#02FFE5','#FFFF02'];
var colors = ['#851433','#BC3262','#F9B86C','#E44D29','#EC8D29','#FF6563','#79B299','#8E9091','#D9AAB9','#8A9D5C'];
var countDownBeforeNewGame = 500;

var gameOn = false ;
var thicknessMalusOn = false ;

function Player(id, idClient, pseudo) { // objet joueur coté serveur
	this.id = id;
	this.idClient = idClient ;
	this.tail = [];
	this.pseudo = pseudo;
	this.start = false ;
	this.color = pickColor() ;
	this.dead = false ;
    this.thickness = 8; // 8 = default
    this.thicknessTab = [] ; // test
    this.score = 0; // aa traiter

}

io.sockets.on('connection', 
	function (socket) { 
    	console.log("We have a new client: " + socket.id);

   	socket.on('start', 
   		function(data) {// data = [pseudo,idClient]
   			//socket.broadcast.to(socket.id).emit('synchroPlayers',players);	

   			var pseudo =data[0];
   			if(pseudo == null || pseudo=="") pseudo = 'HorseWithNoName_' + id ;
			var player = new Player(id,data[1],pseudo );
			players.push(player);
			socket.id = id;

			id++ ;	
			console.log("son pseudo est : "+player.pseudo+", son id :"+player.id);
			socket.broadcast.emit('messageConnect',players);
			//console.log(players);
   	});

    socket.on('beforeStart', 
    	function(dataXY) {
    		for (var index = 0; index < players.length; index++) {
    			if( players[index].id == socket.id) {
    				socket.broadcast.emit('beforeStart',[dataXY[0],dataXY[1],socket.id]);
 
    			}
    		}
    	}
    );

    socket.on('playerReady',
    	function() {
    		for (var index = 0; index < players.length; index++) {
    			if( players[index].id == socket.id) {
    				players[index].start = true ;
    				socket.broadcast.emit('playerReady',players[index].id);
                    checkIfEveryoneIsReady();
    			}
    		}
    	}
    );

    socket.on('tailTabEmit', // AUSSI GESTION DES MALUS
    	function(data) {
    		for (var index = 0; index < players.length; index++) { 
    			if( players[index].id == socket.id) {
    				for (var i = 0; i < data.length; i++) {
    					players[index].tail.push(data[i]);         
    				}
    				socket.broadcast.emit('tailOfOfAll',[data,players[index].id]);
    			}
    		}     
            if(gameOn && !thicknessMalusOn ) emitThicknessMalus()  ;    
    	}
    );

    socket.on('malusHit', function(idOftheSender) {
        if (players.length != 0) { 
            data = [players[0].tail.length, players[0].tail.length+200] ;
            for (var i = 0; i < players.length; i++) {
                if( players[i].id != socket.id) {
                    players[i].thicknessTab.push(data[0],data[1]);
                }
            }
            socket.broadcast.emit('malusHit', [data[0],data[1],idOftheSender]);
            //console.log("malus detecté coté server");
        }
    });

    socket.on('deathOfPlayer', function() {
    	for (var index = 0; index < players.length; index++) { 
			if( players[index].id == socket.id) {
				players[index].dead = true ;
				checkIfEveryoneIsDead();
			}
    	}
    });

    socket.on('disconnect',
    	function() {
    		for (var index = 0; index < players.length; index++) {
    			if(players[index].id == socket.id){
    				console.log("Client has disconnected ("+players[index].pseudo+")");
      				socket.broadcast.emit('messageDisconnect',players[index].id);
      				colors.push(players[index].color); // on remet la couleur dans la liste
    				players.splice(index,1);
    				//console.log(colors);
                    if( players.length) { 
                        checkIfEveryoneIsReady(); // si qq se déco alors qu'il était seul pas prêt, ça part !
                        checkIfEveryoneIsDead(); // pareil pour la mort
                    }
    			} 
    		}    		
      	}
    );

});

function emitThicknessMalus() { // envois les index de tail concernés par le malus
    //var chance = getRandomInt(1000);
    if(1) {
        var x = getRandomInt(600);
        var y = getRandomInt(400);
        console.log('MAlus'+x+" "+y);
        io.emit('thicknessMalus',[x,y]) ;
        thicknessMalusOn = true;            // A REMETTRE EN FALSE
    }
}

function checkIfEveryoneIsReady() { // Heartbeats !! dinguerie !!
    var count = 0;
    for (var i = 0; i < players.length; i++) {
        if(players[i].start) count ++ ;
    }
    if( count == players.length ){ // => if everyone is ready
        console.log('all ready')    

        var heart = heartbeats.createHeart(1000); // 1000 => 1s
        heart.createEvent(1, {countTo: 3}, function(count, last){
            //console.log('...Every Single Beat for 3 beats only');
            io.emit('heartbeat',count);
            if(last === true){
                //console.log('...the last time.')
                io.emit('everyoneReady'); // on fait partir la game à la fin du décompte !
                heart.kill();
                gameOn = true ;
            }           
        });
    } 
}

function checkIfEveryoneIsDead() {
	var count = 0;
	for (var i = 0; i < players.length; i++) {
		if(players[i].dead) count ++ ;

	}
	if( count == players.length ){
		clearTails() ;
		console.log('all dead')
	} 
}

function clearTails() { 
	for (var i = 0; i < players.length; i++) {
		players[i].tail = [] ;
		players[i].start = false ;
		players[i].dead = false ;
	}
    gameOn = false ;
	io.emit('restartGame',players);
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function pickColor() {
	var indexColor = Math.floor(getRandomInt(colors.length));
	var colorPicked = colors[indexColor];

	colors.splice(indexColor,1);
	//console.log(colors);
	return colorPicked ;
}











