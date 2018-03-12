
var player1 ;

var socket;

var tailCopie = [] ;

function setup() {
	createCanvas(600, 400);
	background(200);
	socket = io.connect();
	

	player1 = new Snake();
	// player2 = new Snake();
	// player2.init(120,120);
}

function draw() {
	background(200);
	//socket.on('mouse', newDrawing);
	player1.controlKey();
	player1.shiftHead();
	player1.borderManager();
	player1.displayTail();
	//player1.holeManager();
	//player1.deathManager();	
	emitTail();

	socket.on('tailTab', drawTail);


	if(mouseIsPressed ) {
		console.log(frameCount);
		noLoop();
		console.log("finish (taille du tableau : "+player1.tail.length+")");
		// for (var i = player1.tail.length-20; i < player1.tail.length; i++) {
		// 	console.log(player1.tail[i]);
		// }
	}
}

function emitTail() {
	var data = player1.tail ;
	socket.emit('tailTab', data);
}

function drawTail(data) {
	for(k = 0 ; k<data.length-1  ; k++){ // puis on affiche la tête
		stroke(0,0,255);	
	 	line(data[k][0],data[k][1],data[k+1][0],data[k+1][1]);
	}
}

function Snake() {

	this.x = 150;
	this.y = 100;
	this.v =   2;

	this.vect = createVector(1, 0); // vecteur vitesse
	this.vect.setMag(this.v);

	this.head  = [];
	this.tail  = [];
	this.goTail = true;
	this.angle =  0.05;

	this.goHole = true ;
	this.hole = 2;
	this.minSpaceBetweenHoles = 50 ;

	this.lineScale = 6; //1 = min = meilleur qualité, plus on augmente moins c'est quali
	this.lineScaleCount = this.lineScale;
	this.sizeHead = 4; // taille de la partie qu'on dessine avec la qualité max
	this.thickness = 8; // epaisseur de serpent



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
			append(this.tail, [this.x, this.y]);
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

		if(this.goHole && this.tail.length > (this.sizeHead + this.hole) ){
			if (random(1)>0.990 ) {
				//on fait le trou juste apèes la tête du serpent :
				for (var i = 0; i < this.hole; i++) {
					this.tail.pop();
				}
				append(this.tail,false);

				this.goHole=false;
				this.minSpaceBetweenHoles =50;
			}	
		} 
		if(!this.goHole){
			this.minSpaceBetweenHoles -=1;
			if(this.minSpaceBetweenHoles == 0) this.goHole = true;
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
				if(abs(this.head[k][0]-this.head[k+1][0])>width/2){
					console.log(this.head);
				}
			}
			
			
			for(k = 0 ; k<this.tail.length-1  ; k++){ // puis on affiche la tête
				stroke(242,100,80);	
				line(this.tail[k][0],this.tail[k][1],this.tail[k+1][0],this.tail[k+1][1]);	
				
				// fill(0);
				// noStroke();
				// ellipse(this.tail[k][0],this.tail[k][1],this.thickness/2,this.thickness/2);
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

			this.x = 0;
		}  
		if( this.x < 0) {
			this.head[this.head.length-1] = false ;

			this.tail[this.tail.length-1][0] = 0 ;
			append(this.tail, false);
			append(this.tail, [ width , this.tail[this.tail.length-2][1] ]);

			this.x = width;
		}
		if( this.y > height) {
			this.head[this.head.length-1] = false ;

			this.tail[this.tail.length-1][1] = height ;
			append(this.tail, false);
			append(this.tail, [ this.tail[this.tail.length-2][0] ,0]);

			this.y = 0;
		}
		if( this.y < 0) {
	    	this.head[this.head.length-1] = false ;

			this.tail[this.tail.length-1][1] = 0 ;
			append(this.tail, false);
			append(this.tail, [ this.tail[this.tail.length-2][0],height ]);

			this.y = height;
		}
	}

	this.preventLineDrawing = function() {
		for(k=0 ; k<this.lineScale; k++) {
			append(this.tail,false);
			append(tailCopie,false);
		} // fonctionne depuis borderManager
	}

	this.deathManager = function() {
		for(k=0 ; k<this.tail.length-this.sizeHead-this.thickness; k ++) {
			var mindist = this.thickness/2-0.5;
			
			if(  this.tail[k] && dist(this.x,this.y,this.tail[k][0],this.tail[k][1]) < mindist  ) {

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














