
var player1 ; // Vous même

var socket;

var playersClient = [] ; // liste de tous les joueurs connectés

var temp = 0; // trouver comment s'en passer si possible
var co = true; 
var pseudo ; // pseudo de cette session
var alive = true ;
var start = false ;
var idClient = Math.floor(1000*Math.random());

var showRestartButton = false;
var reStartButton ; 

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
	socket.on('restartGame', restartAGame);
	

	var startButton = select('#startGame'); // boutton pour commencer à dessiner le serpent
	startButton.mousePressed(function() {
		start = true;
		socket.emit('playerReady');
	});	
	reStartButton = select('#reStartGame');
	reStartButton.mousePressed(function() {
		newGame();
		showRestartButton = false;
	});
}


function draw() {
	background(200);
	onConnection() ;
	if(!showRestartButton) reStartButton.hide() ;
	if(showRestartButton) reStartButton.show() ;

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
		if(typeof player1.color !='undefined') stroke(player1.color);
		strokeWeight(6);
		rect(0,0,width,height);
	} 
	if(!alive) {
		
		stroke(player1.color);
		strokeWeight(6);
		rect(0,0,width,height);

		strokeWeight(4);
		stroke('#DB0A0A');
		rect(4,4,width-8,height-8);
	}
	if(!start) { // on veut afficher ici les têtes de tout le monde

		player1.controlKey(); // pour pouvoir bouger avant de commencer ! :
		socket.emit('beforeStart', [player1.x,player1.y]);	 
		drawPointOfAll();

		player1.x += player1.vect.x ;
		player1.y += player1.vect.y ;
		player1.borderManagerAtStart();

		if(typeof player1.color !='undefined'){  
			noFill();
			stroke(player1.color);
			strokeWeight(6);
			rect(0,0,width,height);
		}
	}

	drawTailOfAllPlayer() ; 

}

function restartAGame() {
	// utile car implaçable dans le socket.on
	showRestartButton = true ;
}

function newGame() {
	for (var k = 0; k < playersClient.length; k++) { 	 
		playersClient[k].tail = [];
	}	
	//playersClient = players ; // les joueurs ont été réinit de la même manière coté serveur
	player1.tail = [];
	player1.head= [] ;
	alive = true ;
	start = false;
	console.log('nouvelle partie !');
}

function drawPointOfAll(){
	noStroke();
	
	for (var k = 0; k < playersClient.length; k++) { 	
		fill(playersClient[k].color);			
		ellipse(playersClient[k].x , playersClient[k].y ,8,8);
	}		
}

function displayListOfPlayer() { // affiche les joueurs dans une div
	for (var i = 0; i < playersClient.length; i++) {
		var divCheck = select("#player"+playersClient[i].id);
		if( divCheck == null) { // on créé la div que si elle n'existe pas
			var div1 = createDiv(playersClient[i].pseudo+"  (id : "+playersClient[i].id+")");
			div1.parent('playerList'); // use id
			div1.id("player"+playersClient[i].id);
			div1.style('padding','5px');
			if(typeof playersClient[i] !='undefined') {
				div1.style('background-color', playersClient[i].color);
				div1.style('border-radius',' 5px') ;
				div1.style('margin',' 10px') ;
				div1.style('width',' 100%') ;
				//div1.style('color', playersClient[i].color);
			} else {
				div1.style('color', '#fffff');
			}

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
					//player1.vect.setMag(0); // le serpent n'avance plus
					//socket.emit('deathOfPlayer'); // wtf ce bout de code marche aps ici
					alive = false;
					player1.tempDifference = []  ;
				}
			}
		}
	}
	if(!alive) socket.emit('deathOfPlayer');
}

function onConnection() {
	if(co) { // inutile sauf pour le emit j'ai l'impression
		co = false ;
		socket.on('messageConnect', function(players) {
			//a chaque fois qu'un gus se connecte tous les joueurs sont remis a jours
			console.log("un joueur s'est connecté ("+players[players.length-1].pseudo+")");
			playersClient = players ; //players est la liste de jouerus du serveurs 
			displayListOfPlayer();
			for (var k = 0; k < playersClient.length; k++) { 
				if(playersClient[k].pseudo == pseudo && playersClient[k].idClient==idClient){ 
					player1.color = playersClient[k].color ;
				}
			}
		});
		socket.emit('start',[pseudo,idClient]); //
	}	
}

function drawTailOfAllPlayer() { // ou de tous, surement mieux

	for (var k = 0; k < playersClient.length; k++) { // on boucle sur tous les joueurs
		//if(playersClient[k].pseudo != pseudo ){  // on dessine sauf si c'est nous
		stroke(playersClient[k].color);	
		if( playersClient[k].tail.length > 2 ){
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
			//console.log(playersClient[k].x);
		}
	}	
}













