
var player1 ; // Vous même

var socket;

var playersClient = [] ; // liste de tous les joueurs connectés

var temp = 0; // trouver comment s'en passer si possible
var co = true; 
var pseudo ; // pseudo de cette session
var alive = true ;
var start = false ;
var idClient = Math.floor(10000*Math.random());

var showStartButton = true;
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
	socket.on('restartGame', initForNewGame);
	socket.on('everyoneReady', startGame) ;
	socket.on('heartbeat', function(count){
		//console.log("heartbeat : " +count);
		var div = select("#countDown");
		div.html(3-count);
	});
	socket.on('thicknessMalus', function(dataXY){
		thicknessMalusPos = dataXY ;
		console.log("malus "+dataXY);
		thicknessMalusOn = true ;
	}) ;
	socket.on('malusHit', function(data){ // data = [x,y,idOfMalusSender]
		thicknessMalusOn = false ;
		for (var i = 0; i < playersClient.length; i++) {
			//console.log("playersClient.idClient != data[2] :: "+ )
			if(playersClient[i].idClient != data[2] && !playersClient[i].dead) {
				playersClient[i].thicknessTab.push(data[0],data[1]);
				if(playersClient[i].idClient == idClient) player1.thicknessTab.push(data[0],data[1]); // coté client
			}
		}
	}) ;
	socket.on('deathOfPlayer', function(id) {
		for (var i = 0; i < playersClient.length; i++) {
			if(playersClient[i].id == id)  {
				var divOfDeadPlayer = select("#playerMainDiv"+playersClient[i].id);
				divOfDeadPlayer.addClass('deadPlayer');
			}
		}
	});

	startButton = select('#startGame'); // boutton pour commencer à dessiner le serpent
	startButton.mousePressed(startButtonAction ) ;

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
	}

	drawTailOfAllPlayer() ; 
}

function detectMalus() { // a traiter version orienté serveyr cad utilisé playerClient plutot que player1
	minDist = dist(thicknessMalusPos[0], thicknessMalusPos[1], player1.x, player1.y );
	if(minDist < 30){
		socket.emit('malusHit', idClient);
		console.log("malus hit");	
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

function startGame() {
	for (var k = 0; k < playersClient.length; k++) { // jouerus par joueurs on remplie leur tail[] avec les données reçues
		var div1 = select("#player"+playersClient[k].id);
		div1.removeClass('playerReady');
	}	
	start = true ;
}

function initForNewGame(players) {

	console.log("For debuging : ");
	console.log(players);

	showStartButton = true ;
	thicknessMalusOn = false ;
	var div = select('#startDiv');
	div.show();


	playersClient = players ; // les joueurs ont été réinit de la même manière coté serveur
	player1.tail = [];
	player1.head= [] ;
	player1.thicknessTab = [] ;
	alive = true ;
	start = false;

	for (var i = 0; i < playersClient.length; i++) {
		var divOfDeadPlayer = select("#playerMainDiv"+playersClient[i].id);
		divOfDeadPlayer.removeClass('deadPlayer');

		var divScore = select("#playerScore"+playersClient[i].id);
		divScore.html(playersClient[i].score) ;
	}

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

			var divMain = createDiv('');   // div contenant la div  du pseudo et celle du score
			divMain.id("playerMainDiv"+playersClient[i].id);
			divMain.parent('playerList'); // use id
			divMain.addClass('flexClass1');

			var div1 = createDiv(playersClient[i].pseudo);  // div du pseudo
			div1.parent("playerMainDiv"+playersClient[i].id); 
			div1.id("player"+playersClient[i].id);
			div1.addClass('player');

			var div2 = createDiv('0'); // div du score
			div2.parent("playerMainDiv"+playersClient[i].id); 
			div2.id("playerScore"+playersClient[i].id);
			div2.addClass('scoreDiv');			

			if(playersClient[i].idClient == idClient ){
				divMain.addClass('mainPlayer') ;        // on décale la div qui concerne le client
			} 

			if(typeof playersClient[i] !='undefined') {
				div1.style('background-color', playersClient[i].color);
				div2.style('background-color', playersClient[i].color);
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
				var divToRemove = select("#playerMainDiv"+playersClient[i].id);
				console.log(playersClient[i].pseudo+" s'est déco, c'est le client qui le dit !");
				playersClient.splice(i,1);
				//console.log(playersClient);
			} 
		}  
		divToRemove.remove(); // on enleve le joueur de la liste de div affichant les joueurs connectés
	});	
}

function deathManager() {  // la distance minimale est la somme des deux moitiés des épaisseurs des deux serpents considérés

	var mindist ; // distance minimale de base, sans malus du coté des deux serpents 
	for (var i = 0; i < playersClient.length; i++) {

		if(playersClient[i].pseudo != pseudo && playersClient[i].tail.length>2) { // si c'est ps nous ATTENTION PSEUDO ET ID
			for(k=0 ; k < playersClient[i].tail.length; k ++) {	 // on boucle sur la tail 

				mindist = player1.thickness; 
				if(checkIfThick(k, playersClient[i].thicknessTab) ) mindist += 4 ; // si la tail qu'on check est épaisse
				if(checkIfThick(player1.tail.length, player1.thicknessTab) ) mindist += 4 ; // 

				if( playersClient[i].tail[k] && dist(player1.x,player1.y, playersClient[i].tail[k][0],playersClient[i].tail[k][1]) < mindist-0.5  ) {

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

					var sketchHolder = select('#sketch-holder');
					sketchHolder.style('border-color',player1.color);
				}
			}
		});
		socket.emit('start',[pseudo,idClient]); //
	}	
}

function drawTailOfAllPlayer() { 

	for (var k = 0; k < playersClient.length; k++) { // on boucle sur tous les joueurs
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












