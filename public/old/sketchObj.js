
var player1 ;


var tailCopie = [] ;

function setup() {
	createCanvas(600, 400);
	background(100);
	//socket = io.connect();
	player1 = new Snake2();
	player2 = new Snake();
	player2.init(120,120);
}

function draw() {
	background(200);
	
	player1.controlKey();
	player1.shiftHead();
	player1.borderManager();
	player1.displayTail();
	player1.holeManager();
	player1.deathManager();

	// FONCTION MODIFIEE : shifthead, holemanager et preventlinedraawing ACHTUNG
	player2.setTail();
	player2.displayTail();

	console.log(player1.tail.length);

	//console.log(frameCount);
	if(mouseIsPressed ) {
		console.log(frameCount);
		noLoop();
		console.log("finish");
	}
}


function Snake() {

	this.x = 100;
	this.y = 100;
	this.v =   2;

	this.vect = createVector(1, 0); // vecteur vitesse
	this.vect.setMag(this.v);

	this.tail  = [];
	this.angle =  0.05;

	this.goHole = true ;
	this.hole = 12;
	this.minSpaceBetweenHoles = 50 ;

	this.lineScale = 12; //1 = min = meilleur qualité, plus on augmente moins c'est quali
	this.sizeHead = 10; // taille de la partie qu'on dessine avec la qualité max
	this.thickness = 8; // epaisseur de serpent



	this.controlKey = function() {
		if (keyIsDown(37)) {  // left ARROW
			this.vect.rotate(-this.angle);
		} 
		else if (keyIsDown(39)) {  // right ARROW
			this.vect.rotate(this.angle);
		}
		return false; // prevent default		
	}

	this.shiftHead = function() {
		append(this.tail,[this.x,this.y]);
		append(tailCopie,[this.x,this.y]);
		this.x += this.vect.x ;
		this.y += this.vect.y ;
	}

	this.holeManager = function() {

		if(this.goHole && this.tail.length > (this.sizeHead + this.hole) ){
			if (random(1)>0.990 ) {
				// on fait le trou juste apèes la tête du serpent :
				for(var k = this.tail.length-this.sizeHead-this.hole  ; k<this.tail.length-this.sizeHead-1  ; k+=1){ 
					this.tail[k] = false;
					tailCopie[k] = false;
				}
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

		if(this.tail.length > this.sizeHead + this.lineScale){ // si  la queue est plus grande que la tête
		
			for(k = 1 ; k<this.tail.length-this.lineScale-this.sizeHead  ; k+=this.lineScale+1){ // on affiche la queue
				line(this.tail[k][0],this.tail[k][1],this.tail[k+this.lineScale][0],this.tail[k+this.lineScale][1]);	
			}
			for(k = this.tail.length-this.lineScale-this.sizeHead  ; k<this.tail.length-1  ; k+=2){ // puis on affiche la tête
				line(this.tail[k][0],this.tail[k][1],this.tail[k+1][0],this.tail[k+1][1]);	
			}	
		}
		else { // on déssine la queue et la tête de la même manière si le serpent est trop petit
			for(k = 1 ; k<this.tail.length-this.lineScale-1  ; k+=2){
				line(this.tail[k][0],this.tail[k][1],this.tail[k+1][0],this.tail[k+1][1]);	
			}		
		}

		//console.log(tail.length);
	}

	this.borderManager = function() {
		if( this.x > width){
			this.preventLineDrawing();
			this.x = 0;
		}  
		if( this.x < 0) {
			this.preventLineDrawing();
			this.x = width;
		}
		if( this.y > height) {
			this.preventLineDrawing()	;
			this.y = 0;
		}
		if( this.y < 0) {
	    	this.preventLineDrawing();
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
			var mindist = this.thickness-3;
			
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

















