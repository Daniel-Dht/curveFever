
var player1 ;

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
			console.log(player1.tail[i]);
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

function Snake() {

	this.x = random(width);;
	this.y = random(height);
	this.v =   2;

	this.vect = createVector(1, 0); // vecteur vitesse
	this.vect.setMag(this.v);

	this.head  = [];
	this.tail  = [];
	this.goTail = true;
	this.angle =  0.05;

	this.goNewHole = true ;
	this.goDrawHole = false ;
	this.holeSize = 12;
	this.hole = 0;
	this.minSpaceBetweenHoles = 50 ;

	this.lineScale = 3; //1 = min = meilleur qualité, plus on augmente moins c'est quali
	this.lineScaleCount = this.lineScale;
	this.sizeHead = 4; // taille de la partie qu'on dessine avec la qualité max
	this.thickness = 8; // epaisseur de serpent

	this.tempDifference = [];

	this.controlKey = function() {
		if (keyIsDown(37)) {  // left ARROW
			this.vect.rotate(-this.angle);
		} 
		else if (keyIsDown(39)) {  // right ARROW
			this.vect.rotate(this.angle);
		}
		//console.log(this.head);
		return false; // prevent default		

	}

	this.shiftHead = function() {
		

		this.x += this.vect.x ;
		this.y += this.vect.y ;

		append(this.head,[this.x,this.y]); /// HEAD
		if(this.head.length>this.sizeHead ) this.head = subset(this.head,1,this.sizeHead-1);

		if(this.goTail) { /// TAIL
			if( !this.goDrawHole ) append(this.tail, [this.x, this.y]);
			if( !this.goDrawHole ) append(this.tempDifference, [this.x, this.y]);
			this.goTail = false;
			this.lineScaleCount = this.lineScale ;
			//console.log(this.tail.length);
		}else {	
			this.lineScaleCount -- ;		
			if(this.lineScaleCount == 0) this.goTail = true;			
		}
		// console.log("shifthead	 : "+frameCount+"  : "+this.head[0]+" , "+this.head[1]);
		//console.log("shifthead	 : "+this.head);

	}

	this.holeManager = function() {

		if(this.goNewHole && this.tail.length > (this.sizeHead + this.hole) ){
			if (random(1)>0.990 ) {
				//on fait le trou juste apèes la tête du serpent :
				// for (var i = 0; i < this.hole; i++) {
				// 	this.tail.pop();
				// }
				this.goDrawHole = true ;
				this.hole = this.holeSize ;

				append(this.tail,false);
				append(this.tempDifference,false);

				this.goNewHole=false;
				this.minSpaceBetweenHoles =50;
			}	
		} 
		if(this.goDrawHole){
			this.hole -=1;
			if(this.hole == 0) this.goDrawHole = false;
		}		
		if(!this.goNewHole){
			this.minSpaceBetweenHoles -=1;
			if(this.minSpaceBetweenHoles == 0) this.goNewHole = true;
		}
	}

	this.displayTail = function() { // la tête est de qualité, la queue moins pour performance and smooth driving
		strokeWeight(this.thickness);
		stroke(242,100,80);			
		//console.log("ok : "+this.tail[0]+" , "+this.tail[1]);
		//console.log("ok : "+frameCount+" voila : "+this.tail[0]+" , "+this.tail[1]+", head.length :"+this.head.length );

		if(this.head.length > 2){

			for(k = 0 ; k<this.head.length-1 ; k++){ // on affiche la tête
				line(this.head[k][0], this.head[k][1], this.head[k+1][0], this.head[k+1][1]);
			}
			
			
			for(k = 0 ; k<this.tail.length-1  ; k++){ // puis on affiche la tête
				stroke(242,100,80);	
				line(this.tail[k][0],this.tail[k][1],this.tail[k+1][0],this.tail[k+1][1]);	
			
			}
		}
	}



	this.borderManager = function() {
		var coor
		if( this.x > width){
			this.head[this.head.length-1] = false ;

			this.tail[this.tail.length-1][0] = width ;
			append(this.tail, false);
			append(this.tail, [ 0 , this.tail[this.tail.length-2][1] ]);
			append(this.tempDifference, false);
			append(this.tempDifference, [ 0 , this.tail[this.tail.length-3][1] ]);
			//console.log(this.tail);
			this.x = 0;
		}  
		if( this.x < 0) {
			this.head[this.head.length-1] = false ;

			this.tail[this.tail.length-1][0] = 0 ;
			append(this.tail, false);
			append(this.tail, [ width , this.tail[this.tail.length-2][1] ]);
			append(this.tempDifference, false);
			append(this.tempDifference, [ width , this.tail[this.tail.length-3][1] ]);
			this.x = width;
		}
		if( this.y > height) {
			this.head[this.head.length-1] = false ;

			this.tail[this.tail.length-1][1] = height ;
			append(this.tail, false);
			append(this.tail, [ this.tail[this.tail.length-2][0] ,0]);
			append(this.tempDifference, false);
			append(this.tempDifference, [ this.tail[this.tail.length-3][0] ,0]);

			this.y = 0;
		}
		if( this.y < 0) {
	    	this.head[this.head.length-1] = false ;

			this.tail[this.tail.length-1][1] = 0 ;
			append(this.tail, false);
			append(this.tail, [ this.tail[this.tail.length-2][0],height ]);
			append(this.tempDifference, false);
			append(this.tempDifference, [ this.tail[this.tail.length-3][0],height ]);
			this.y = height;
		}
	}


	this.deathManager = function() {
		var mindist = this.thickness/2-0.5;
		for(k=0 ; k<this.tail.length-this.sizeHead-this.thickness; k ++) {					
			if(  this.tail[k] && dist(this.x,this.y,this.tail[k][0],this.tail[k][1]) < mindist  ) {
				this.vect.setMag(0); // le serpent n'avance plus
			}
		}
		
		for(k=0 ; k<tailCopie.length-this.sizeHead-this.thickness; k ++) {					
			if(  tailCopie[k] && dist(this.x,this.y,tailCopie[k][0],tailCopie[k][1]) < mindist  ) {
				this.vect.setMag(0); // le serpent n'avance plus
			}
		}
	}

	this.init = function(x,y) {
		this.x = x;
		this.y = y;
	}

	this.getTail = function(k) {
		return this.tail;
	}
	this.setTail = function() {
		this.tail = tailCopie ;
	}
}


//function newDrawing(data) {
// 	noStroke();
// 	fill(0,0,255);
// 	ellipse(data.x,data.y, 36,36);
// }

// function mouseDragged() {
// 	noStroke();
// 	fill(255);
// 	ellipse(mouseX,mouseY, 36,36);
// 	var data = {
// 		x : mouseX,
// 		y : mouseY
// 	}
// 	socket.emit('mouse', data);
// }














