
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
	var canvas = createCanvas(600, 400);
	canvas.parent('sketch-holder'); // on place le canvas dans la div 
	background(200);
	socket = io.connect();
	pseudo = prompt('Quel est votre pseudo ?');
	player1 = new Snake(); // vous
	
	disconnexionManager(); //socket.on('messageDisconnect',dataID) !
	socket.on('tailOfOfAll', treatReceivedDataTail); // on reçoit les données des tail de tous
	socket.on('playerReady', playersReady ); 
	socket.on('beforeStart', treatReceivedDataHead); // avant la partie
	

	var testButton = select('#test'); // boutton pour commencer à dessiner le serpent
	testButton.mousePressed(function() {
		start = true;
		socket.emit('playerReady');
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
		player1.displayHead();	// à retraiter
		player1.holeManager();
		player1.deathManager();	// par rapport à nous
		deathManager(); // par rapport aux autres
		emitTail(); // on envoit nos données au serveur

		noFill();
		stroke(80,70,50);
		rect(0,0,width,height);
	} 
	if(!alive) {
		noFill();
		stroke(250,110,80);
		rect(0,0,width,height);
	}
	if(!start) { // on veut afficher ici les têtes de tout le monde

		player1.controlKey(); // pour pouvoir bouger avant de commencer ! :
		socket.emit('beforeStart', [player1.x,player1.y]);	 
		drawPointOfAll();

		strokeWeight(2);
		stroke(0);
		player1.vect.setMag(50);
		line(player1.x,  player1.y,  player1.vect.x+player1.x,  player1.vect.y+player1.y)

		player1.x += player1.vect.x/25 ;
		player1.y += player1.vect.y/25 ;
		player1.borderManagerAtStart();
	}

	drawTailOfAllPlayer() ; // on dessine les tails de toous le monde sauf nous

	// if(mouseIsPressed ) { // clique pour stopper le loop et faire des test #DEBUG
	// 	noLoop();
	// 	console.log("finish (taille du tableau : "+player1.tail.length+")");
	// }
}

function drawPointOfAll(){
	noStroke();
	
	for (var k = 0; k < playersClient.length; k++) { 	
		fill(playersClient[k].color);			
		ellipse(playersClient[k].x , playersClient[k].y ,8,8);
	}
		
	
}

function displayListOfPlayer() { // affiche les jouerus dans une div
	for (var i = 0; i < playersClient.length; i++) {
		var divCheck = select("#player"+playersClient[i].id);
		if( divCheck == null) { // on créé la div que si elle n'existe pas
			var div1 = createDiv('Player : '+playersClient[i].pseudo+", id : "+playersClient[i].id);
			div1.parent('playerList'); // use id
			div1.id("player"+playersClient[i].id);
		}
	}
}

function disconnexionManager() {
	socket.on('messageDisconnect', function(dataID) { // quand qq se déco, on l'enlève de la liste
		for (var i = 0; i < playersClient.length; i++) {
			if(playersClient[i].id == dataID ){
				var divToRemove = select("#player"+playersClient[i].id);
				console.log(playersClient[i].pseudo+" s'est déco, c'est le client qui le dit !");
				playersClient.splice(i,1);
				//console.log(playersClient);
			} 
		}  
		divToRemove.remove(); // on enleve le joueur de la liste de div affichant les joueurs connectés
	});	
}

function deathManager() { 
	var mindist = player1.thickness;  // ATTENTION THICKNESS & HEAD
	for (var i = 0; i < playersClient.length; i++) {
		if(playersClient[i].pseudo != pseudo && playersClient[i].tail.length>2) { // si c'est ps nous ATTENTION PSEUDO ET ID

			for(k=0 ; k < playersClient[i].tail.length; k ++) {	
				if( playersClient[i].tail[k] && dist(player1.x,player1.y, playersClient[i].tail[k][0],playersClient[i].tail[k][1]) < mindist  ) {
					player1.vect.setMag(0); // le serpent n'avance plus
					alive = false;
				}
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
			displayListOfPlayer();
		});
		socket.emit('start',pseudo); //

	}
}


function drawTailOfAllPlayer() { // ou de tous, surement mieux

	for (var k = 0; k < playersClient.length; k++) { // on boucle sur tous les joueurs
		//if(playersClient[k].pseudo != pseudo ){  // on dessine sauf si c'est nous
		stroke(playersClient[k].color);	
		if( playersClient[k].tail.length > 1 ){
			for(j = 0 ; j<playersClient[k].tail.length-1  ; j++){ // puis on affiche la tête			

				strokeWeight(8);
			 	line(playersClient[k].tail[j][0],playersClient[k].tail[j][1],playersClient[k].tail[j+1][0],playersClient[k].tail[j+1][1]  );
			 	// noStroke();
			 	// fill(255,100,80);
			 	// ellipse(playersClient[k].tail[j][0],playersClient[k].tail[j][1],2,2);
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

function playersReady(playerId){
	for (var k = 0; k < playersClient.length; k++) { // jouerus par joueurs on remplie leur tail[] avec les données reçues
		if(playersClient[k].id == playerId ){  //on ajoute les données  au joueur qui correspond
			playersClient[k].start = true ;
		}
	}	
}

function treatReceivedDataTail(data) {
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

function treatReceivedDataHead(dataXYid) {
// data[1] est l'id du joueur corresondant aux data émises : data[0]
	for (var k = 0; k < playersClient.length; k++) { // jouerus par joueurs on remplie leur tail[] avec les données reçues
		if(playersClient[k].id == dataXYid[2] ){  //on ajoute les données  au joueur qui correspond

			playersClient[k].x = dataXYid[0];
			playersClient[k].y = dataXYid[1];
		}
	}	
}













