
var player1 ; // Vous même

var socket;

var playersClient = [] ; // liste de tous les joueurs connectés

var temp = 0; // trouver comment s'en passer si possible
var co = true; 
var pseudo ; // pseudo de cette session
var alive = true ;
var start = false ;
var idClient = Math.floor(10000*Math.random());

var showRestartButton = false;
var showStartButton = true;
var reStartButton ; 
var startButton ; 

var thicknessMalusOn = false ;
var thicknessMalusPos ;


function setup() {
	var canvas = createCanvas(600, 400);
	canvas.parent('sketch-holder'); // on place le canvas dans la div 
	background(220);
	socket = io.connect();
	pseudo = prompt('Quel est votre pseudo ?');
	player1 = new Snake(); // vous
	
	disconnexionManager(); //socket.on('messageDisconnect',dataID) !
	socket.on('tailOfOfAll', treatReceivedDataTail); // on reçoit les données des tail de tous
	socket.on('playerReady', playerReady ); // permet seulement de savoir quand qq est prêt et modifier sa div
	socket.on('beforeStart', treatReceivedDataHead); // avant la partie
	socket.on('restartGame', function(){showRestartButton = true});
	socket.on('everyoneReady', startGame) ;
	socket.on('heartbeat', function(count){
		console.log("heartbeat : " +count);
		var div = select("#countDown");
		div.html(3-count);
	});
	socket.on('thicknessMalus', function(dataXY){
		thicknessMalusPos = dataXY ;
		console.log("malus "+dataXY);
		thicknessMalusOn = true ;
	}) ;
	socket.on('malusHit', function(data){ // data = [x,y,id]
		thicknessMalusOn = false ;
		for (var i = 0; i < playersClient.length; i++) {
			//console.log("playersClient.idClient != data[2] :: "+ )
			if(playersClient[i].idClient != data[2]) {
				playersClient[i].thicknessTab.push(data[0],data[1]);
			}
		}
		console.log("malus detected 222");
	}) ;

	startButton = select('#startGame'); // boutton pour commencer à dessiner le serpent
	startButton.mousePressed(startButtonAction ) ;

	reStartButton = select('#reStartGame'); // bouton pour recommencer une partie
	reStartButton.mousePressed(reStartButtonAction );
}


function draw() {
	background(220);
	onConnection() ;
	if(thicknessMalusOn){
		drawThicknessMalus() ;
		detectMalus();
	} 
	if(showStartButton) {
		if (keyIsDown(13)) startButtonAction(); // appuyer sur Entré = activé le bouton
	}
	if(!showRestartButton) reStartButton.hide() ;
	if(showRestartButton) {
		reStartButton.show() ;
		if (keyIsDown(13)) reStartButtonAction(); // appuyer sur Entré = activé le bouton
	}

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
		rect(0,0,width,height); // quand la partie est en cours
	} 
	if(!alive) {
		noFill();
		stroke(player1.color);
		strokeWeight(6);
		rect(0,0,width,height);

		strokeWeight(4);
		stroke('#DB0A0A');
		rect(4,4,width-8,height-8); // quand la partie est en cours mais qu'on est mort
	}
	if(!start) { //quand la partie n' pas encore commencé

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

function detectMalus() { // a traiter version orienté serveyr cad utilisé playerClient plutot que player1
	minDist = dist(thicknessMalusPos[0], thicknessMalusPos[1], player1.x, player1.y );
	if(minDist < 30){
		socket.emit('malusHit', idClient);
		console.log("malus detected");	
	} 
}

function drawThicknessMalus() {
	strokeWeight(1);
	stroke(0);
	fill(100,100,255);
	ellipse(thicknessMalusPos[0],thicknessMalusPos[1],30,30);
}

function startButtonAction() {
	showStartButton = false;
	socket.emit('playerReady');
	var div = select('#startDiv');
	div.hide(); 
}

function reStartButtonAction(){
	initForNewGame();
	showRestartButton = false;
	showStartButton = true ;
	var div = select('#startDiv');
	div.show();
}

function startGame() {
	for (var k = 0; k < playersClient.length; k++) { // jouerus par joueurs on remplie leur tail[] avec les données reçues
		var div1 = select("#player"+playersClient[k].id);
		div1.removeClass('playerReady');
	}	
	start = true ;
}

function initForNewGame() {
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
			var div1 = createDiv(playersClient[i].pseudo);
			div1.parent('playerList'); // use id
			div1.id("player"+playersClient[i].id);
			div1.addClass('player');
			if(playersClient[i].idClient == idClient ){
				div1.addClass('mainPlayer') ;
				//console.log('ok');
			} 

			if(typeof playersClient[i] !='undefined') {
				div1.style('background-color', playersClient[i].color);
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
				if( playersClient[k].idClient==idClient){ 
					player1.color = playersClient[k].color ;
					pseudo = playersClient[k].pseudo ;
				}
			}
		});
		socket.emit('start',[pseudo,idClient]); //
	}	
}

function drawTailOfAllPlayer() { 

	for (var k = 0; k < playersClient.length; k++) { // on boucle sur tous les joueurs
		//if(playersClient[k].pseudo != pseudo ){  // on dessine sauf si c'est nous
		stroke(playersClient[k].color);	
		if( playersClient[k].tail.length > 2 ){
			for(j = 0 ; j<playersClient[k].tail.length-1  ; j++){ // puis on affiche la tête		

				strokeWeight(playersClient[k].thickness);
				if(checkIfThick(j, playersClient[k].thicknessTab)) {
					strokeWeight(playersClient[k].thickness+8);	
				}

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

function playerReady(playerId){  // permet seulement de savoir quand qq est prêt et modifier sa div
	for (var k = 0; k < playersClient.length; k++) { 
		if(playersClient[k].id == playerId ){ 
			var div1 = select("#player"+playersClient[k].id);
			div1.addClass('playerReady');
			playersClient[k].start = true ;
			console.log(playersClient[k].pseudo+" est prêt !");
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

function checkIfThick(index,thicknessTab) {
	for (var i = 0; i < thicknessTab.length-1; i+=2) {
		if(thicknessTab[i] < index && index < thicknessTab[i+1]) {
			return true;
		}
	}
}












