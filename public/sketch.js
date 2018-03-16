
var player1 ; // Vous même

var socket;

//var tailCopie = [] ;

var playersClient = [] ; // liste de tous les joueurs connectés

var temp = 0; // trouver comment s'en passer si possible
var co = true; 
var pseudo ; // pseudo de cette session

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
}


function draw() {
	background(200);
	onConnection() ;
	player1.controlKey();
	player1.shiftHead();
	player1.borderManager();
	player1.displayTail();	
	player1.holeManager();
	//player1.deathManager();	// pour le moment la mort bouffe trop de mémoire
	//deathManager();
	drawTailOfOtherPlayer() ; // on dessine les tails de toous le monde sauf nous
	emitTail(); // on envois nos données au serveur


	if(mouseIsPressed ) { // clique pour stopper le loop et faire des test #DEBUG
		noLoop();
		console.log("finish (taille du tableau : "+player1.tail.length+")");
		for (var i = player1.tail.length-100; i < player1.tail.length; i++) {
			//console.log(player1.tail[i]);
		}
	}
}

function deathManager() { 
	var mindist = player1.thickness/2-0.5;
	for (var k = 0; k < playersClient.length; k++) {
		var tailCopie = playersClient[k].tail ;

		for(k=0 ; k < player1.tail.length-player1.sizeHead-player1.thickness; k ++) {					
			if(  player1.tail[k] && dist(player1.x,player1.y,tailCopie[k][0],tailCopie[k][1]) < mindist  ) {
				player1.vect.setMag(0); // le serpent n'avance plus
			}
		}
	}
}


function onConnection() {
	if(co) { // inutile saul pour le emit j'ai l'impression
		co = false ;
		socket.on('messageConnect', function(players) {
			//a chaque fois qu'un gus se connecte tous les joueurs sont remis a jours
			console.log("un joueur s'est connecté ("+players[players.length-1].pseudo+")");
			playersClient = players ; //players est la liste de jouerus du serveurs 
		});
		socket.emit('start',pseudo); //
	}
}


function drawTailOfOtherPlayer() {

	for (var k = 0; k < playersClient.length; k++) { // on boucle sur tous les joueurs
		if(playersClient[k].pseudo != pseudo ){  // on dessine sauf si c'est nous

			var tailCopie = playersClient[k].tail ; // on copie la queue du joueur considéré
			if( tailCopie.length > 1 ){
				for(j = 0 ; j<tailCopie.length-1  ; j++){ // puis on affiche la tête
					stroke(0,0,255);
					strokeWeight(8);
				 	line(tailCopie[j][0],tailCopie[j][1],tailCopie[j+1][0],tailCopie[j+1][1]);
				}	
			}	
		}		
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















