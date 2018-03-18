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

	this.lineScale = 1; //1 = min = meilleur qualité, plus on augmente moins c'est quali
	this.lineScaleCount = this.lineScale;
	this.sizeHead = 5; // taille de la partie qu'on dessine avec la qualité max
	this.thickness = 8; // epaisseur de serpent

	this.tempDifference = [];

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

	this.displayHead = function() { // la tête est de qualité, la queue moins pour performance and smooth driving
		strokeWeight(this.thickness);
		stroke(0,0,0);			
		//console.log("ok : "+this.tail[0]+" , "+this.tail[1]);
		//console.log("ok : "+frameCount+" voila : "+this.tail[0]+" , "+this.tail[1]+", head.length :"+this.head.length );

		if(this.head.length > 2){

			for(k = 0 ; k<this.head.length-1 ; k++){ // on affiche la tête
				line(this.head[k][0], this.head[k][1], this.head[k+1][0], this.head[k+1][1]);
			}
			
			
			// for(k = 0 ; k<this.tail.length-1  ; k++){ // puis on affiche la queue
			// 	stroke(242,100,80);	
			// 	line(this.tail[k][0],this.tail[k][1],this.tail[k+1][0],this.tail[k+1][1]);		
			// }
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
				alive = false;
			}
		}
		
		// for(k=0 ; k<tailCopie.length-this.sizeHead-this.thickness; k ++) {					
		// 	if(  tailCopie[k] && dist(this.x,this.y,tailCopie[k][0],tailCopie[k][1]) < mindist  ) {
		// 		this.vect.setMag(0); // le serpent n'avance plus
		// 	}
		// }
	}
	this.borderManagerAtStart = function() {

		if( this.x > width) this.x = 0;

		if( this.x < 0)  this.x = width;
		
		if( this.y > height) this.y = 0;
		
		if( this.y < 0)  this.y = height;

	}
}
