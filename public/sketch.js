
var player1 ; // Vous même

var socket;

//var tailCopie = [] ;

var playersClient = [] ; // liste de tous les joueurs connectés

var temp = 0; // trouver comment s'en passer si possible
var co = true; 
var pseudo ; // pseudo de cette session
var alive = true ;
var start = false ;

function setup() {
	createCanvas(600, 400);
	background(200);
	socket = io.connect();
	pseudo = prompt('Quel est votre pseudo ?');
	player1 = new Snake(); // vous
	
	socket.on('messageDisconnect', function(dataID) { // quand qq se déco, on l'enlève de la liste
		for (var i = 0; i < playersClient.length; i++) {
			if(playersClient[i].id == dataID ){
				console.log(playersClient[i].pseudo+" s'est déco, c'est le client qui le dit !");
				playersClient.splice(i,1);
				//console.log(playersClient);
			} 
		}  
	});
	socket.on('tailOfOfAll', treatReceivedData); // on reçoit les données des tail de tous

	var testButton = select('#test');
	testButton.mousePressed(function() {
		start = true;
	});
}


function draw() {
	background(200);
	onConnection() ;
	if(alive && start) {
		player1.vect.setMag(player1.v);
		player1.controlKey();
		player1.shiftHead();
		player1.borderManager();
		player1.displayHead();	
		player1.holeManager();
		//player1.deathManager();	// pour le moment la mort bouffe trop de mémoire
		deathManager();
		emitTail(); // on envoit nos données au serveur
	} 
	if(!alive) {
		noFill();
		stroke(250,110,80);
		rect(0,0,width,height);
	}
	if(!start) {
		fill(242,100,80);
		noStroke();
		ellipse(player1.x,player1.y,player1.thickness,player1.thickness);

		player1.controlKey();
		strokeWeight(2);
		stroke(0);
		player1.vect.setMag(50);
		line(player1.x,  player1.y,  player1.vect.x+player1.x,  player1.vect.y+player1.y)
		player1.x += player1.vect.x/25 ;
		player1.y += player1.vect.y/25 ;
	}

	drawTailOfOtherPlayer() ; // on dessine les tails de toous le monde sauf nous

	// if(mouseIsPressed ) { // clique pour stopper le loop et faire des test #DEBUG
	// 	noLoop();
	// 	console.log("finish (taille du tableau : "+player1.tail.length+")");
	// }
}

function deathManager() { 
	var mindist = player1.thickness/2-0.5;  // ATTENTION THICKNESS & HEAD
	for (var i = 0; i < playersClient.length; i++) {

		for(k=0 ; k < playersClient[i].tail.length-player1.sizeHead-player1.thickness; k ++) {	// ATTENTION THICKNESS & HEAD

			if(  player1.tail[k] && dist(player1.x,player1.y, playersClient[i].tail[k][0],playersClient[i].tail[k+1][1]) < mindist  ) {
				player1.vect.setMag(0); // le serpent n'avance plus
				alive = false;
			}
		}
	}
}


function onConnection() {
	if(co) { // inutile sauf pour le emit j'ai l'impression
		co = false ;
		socket.on('messageConnect', function(players) {
			//a chaque fois qu'un gus se connecte tous les joueurs sont remis a jours
			console.log("un joueur s'est connecté ("+players[players.length-1].pseudo+")");
			playersClient = players ; //players est la liste de jouerus du serveurs 
		});
		socket.emit('start',pseudo); //

	}
}


function drawTailOfOtherPlayer() { // ou de tous, surement mieux

	for (var k = 0; k < playersClient.length; k++) { // on boucle sur tous les joueurs
		//if(playersClient[k].pseudo != pseudo ){  // on dessine sauf si c'est nous
		if(playersClient[k].pseudo == pseudo ) {
			stroke(242,100,80); 
		} else {
			stroke(0,0,255);
		}
		//var tailCopie = playersClient[k].tail ; // on copie la queue du joueur considéré
		if( playersClient[k].tail.length > 1 ){
			for(j = 0 ; j<playersClient[k].tail.length-1  ; j++){ // puis on affiche la tête			

				strokeWeight(8);
			 	line(playersClient[k].tail[j][0],playersClient[k].tail[j][1],playersClient[k].tail[j+1][0],playersClient[k].tail[j+1][1]  );
			}	
		}	
		//}		
	}
}

function emitTail() {
	var data = player1.tempDifference ;   // On envoie que si on est pas à jour 
	if( player1.tempDifference.length>0){
		socket.emit('tailTabEmit', data);
		player1.tempDifference = []; // on vide les données déja envoyées
	}	
}

function treatReceivedData(data) {
// data[1] est l'id du joueur corresondant aux data émises : data[0]
	for (var k = 0; k < playersClient.length; k++) { // jouerus par joueurs on remplie leur tail[] avec les données reçues
		if(playersClient[k].id == data[1] ){  //on ajoute les données  au joueur qui correspond

			for (var i = 0; i < data[0].length; i++) {
				append(playersClient[k].tail,data[0][i]);
				//console.log("received from "+playersClient[k].pseudo+" :" + data[0]);
			}
		}
	}	
}















