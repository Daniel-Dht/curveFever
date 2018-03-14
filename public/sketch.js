
var player1 ; // Vous même

var socket;

var tailCopie = [] ;

var players = [] ;

var  temp = 0; // trouver comment s'en passer si possible

function setup() {
	createCanvas(600, 400);
	background(200);
	socket = io.connect();
	
	player1 = new Snake();
	socket.emit('newPlayer');
	//socket.on('user connected',console.log("une autre personne s'est connectée"));
}

function draw() {
	background(200);

	player1.controlKey();
	player1.shiftHead();
	player1.borderManager();
	player1.displayTail();
	
	player1.holeManager();
	player1.deathManager();	

	//console.log(player1.tempDifference);
	drawTailOfOtherPlayer() ;

	emitTail();

	socket.on('tailTabReceived', treatReceivedData);
	

	if(mouseIsPressed ) {
		console.log(frameCount);
		noLoop();
		console.log("finish (taille du tableau : "+player1.tail.length+")");
		for (var i = player1.tail.length-100; i < player1.tail.length; i++) {
			//console.log(player1.tail[i]);
		}
	}
	//frameRate(3);
	//console.log(frameCount);
}


function drawTailOfOtherPlayer() {
	if(tailCopie.length>1 ){
		for(k = 0 ; k<tailCopie.length-1  ; k++){ // puis on affiche la tête
			stroke(0,0,255);	
		 	line(tailCopie[k][0],tailCopie[k][1],tailCopie[k+1][0],tailCopie[k+1][1]);
		}	
	}
}

function emitTail() {
	var data = player1.tempDifference ;   // trouver comment se passer de ça...
	if( player1.tempDifference.length>0){
		socket.emit('tailTabEmit', data);
		//console.log("emit :" + frameCount);
		player1.tempDifference = []; // on vide les données déja envoyées
		//console.log("apres : "+player1.tempDifference+ "fin");
	}	
}

function treatReceivedData(data) {
	
	if( data !=temp) {
		temp = data ;
		for (var i = 0; i < data.length; i++) {
			append(tailCopie,data[i]);
		}
		//console.log("received :" + data);
		//console.log("ok :"+player1.tempDifference);
	}
}















