 	
function Snake() {

	this.x = 100;
	this.y = 100;
	this.v =   2;

	this.vect = createVector(1, 0); // vecteur vitesse
	this.vect.setMag(v);

	this.tail  = [];
	this.angle =  0.05;

	this.goHole = true ;
	this.holeLength = 12;
	this.minSpaceBetweenHoles = 50 ;

	this.lineScale = 3; //1 = min = meilleur qualité, plus on augmente moins c'est quali
	this.sizeHead = 1; // taille de la partie qu'on dessine avec la qualité max
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
		this.x += this.vect.x ;
		this.y += this.vect.y ;
	}

	this.holeManager = function() {
		
		if(this.goHole && this.tail.length > this.sizeHead ){
			if (random(1)>0.990 ) {
				for(var k = this.tail.length-this.sizeHead-this.hole  ; k<this.tail.length-this.sizeHead-1  ; k+=1){ // on fait le trou juste apèes la tête du serpent
					this.tail[k] = false;
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
			preventLineDrawing();
			this.x = 0;
		}  
		if( this.x < 0) {
			preventLineDrawing();
			this.x = width;
		}
		if( this.y > height) {
			preventLineDrawing()	;
			this.y = 0;
		}
		if( this.y < 0) {
	    preventLineDrawing();
			this.y = height;
		}
	}

	this.preventLineDrawing = function() {
		for(k=0 ; k<this.lineScale; k++) {
			append(this.tail,false);
		} // fonctionne depuis borderManager
	}

	this.deathManager = function() {
		for(k=0 ; k<this.tail.length-this.sizeHead-this.thickness; k ++) {
			var mindist = thickness-3;
			
			if(  this.tail[k] && dist(x,y,this.tail[k][0],this.tail[k][1]) < mindist  ) {

				this.vect.setMag(0); // le serpent n'avance plus
			}
		}
	}


}