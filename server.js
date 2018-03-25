

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

var countScore = 0; // Score de la partie

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
   			if(pseudo == null || pseudo=="" || pseudo.length > 20) pseudo = 'HorseWithNoName_' + id ;
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
            data = [players[0].tail.length, players[0].tail.length+100] ;
            for (var i = 0; i < players.length; i++) {
                if( players[i].id != socket.id && !players[i].dead) {
                    players[i].thicknessTab.push(data[0],data[1]);
                }
            }
            socket.broadcast.emit('malusHit', [data[0],data[1],idOftheSender]);
            //console.log("malus detecté coté server");
        }
    });

    socket.on('deathOfPlayer', function() {
        socket.broadcast.emit('deathOfPlayer',socket.id);
        countScore ++ ;
        if( countScore != players.length) { // on ne fait rien si il reste 1 seul joueur vivant
        	for (var index = 0; index < players.length; index++) { 
    			if( players[index].id == socket.id) {
    				players[index].dead = true ;
                    players[index].score += countScore ;
                    console.log(countScore+' dead'  )
    			}
        	}
        }  
        checkIfEveryoneIsDead();
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

function emitThicknessMalus() { // émet la coordonnée du malus
    var chance = getRandomInt(1000);
    if(chance < 500) {
        var x = getRandomInt(600);
        var y = getRandomInt(400);
        console.log('Malus'+x+" "+y);
        io.emit('thicknessMalus',[x,y]) ;
        thicknessMalusOn = true;
        var heart = heartbeats.createHeart(1000); // on attend 15 secondes avant un nouveau malus
        heart.createEvent(1, {countTo: 15}, function(count, last){
            if(last === true){
                thicknessMalusOn = false ;
            }           
        });           
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

	if( countScore == players.length-1 ){   // la partie finis si il reste 1 joueur vivant seul, !!! attention bug due à lenteur (si tt le monde est mort)
		console.log('only one remain')
        for (var i = 0; i < players.length; i++) {
            if(! players[i].dead) players[i].score += players.length; // on donne le max de point au dernier vivant
        }

        var heart = heartbeats.createHeart(1000); // on attend 3 secondes avant une nouvelle game
        heart.createEvent(1, {countTo: 5}, function(count, last){
            if(last === true)  prepNextGame() ; 
        });  
	} 

    if( players.length == 1 ){ // si 1 seul joueur
        var heart = heartbeats.createHeart(1000); // on attend 3 secondes avant une nouvelle game
        heart.createEvent(1, {countTo: 3}, function(count, last){
            if(last === true) {
                players[0].score ++ ;
                prepNextGame() ;  
            }              
        }); 
    }
}

function prepNextGame() { 
	for (var i = 0; i < players.length; i++) {
		players[i].tail = [] ;
        players[i].thicknessTab = [] ;
		players[i].start = false ;
		players[i].dead = false ;
	}
    countScore = 0 ;
    gameOn = false ;
    thicknessMalusOn = false ;
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











