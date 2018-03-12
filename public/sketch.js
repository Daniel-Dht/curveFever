var x =300; // coordonnées de la t^te du serpent
var y =50; 

var v = 2; // vitesse du snake ;
var tail = [] ; // liste des position de la t^te du serpent
var vect1; // veteur directeur de la tête du snake
var angle = 0.05; // angle de rotation

var hole = 12; // si hole =10, v=2, la taille des trous sera de 20 pixels
var minSpaceBetweenHoles = 50 ;//
var goHole = true;

var lineScale = 3; //1 = min = meilleur qualité, plus on augmente moins c'est quali
var sizeHead = 10; // taille de la partie qu'on dessine avec la qualité max
var thickness = 8; // epaisseur de serpent

var socket;

function setup() {
	createCanvas(600, 400);
	background(100);
	//socket = io.connect();
	
	vect1 = createVector(1, 0); // vecteur vitesse
	vect1.setMag(v);
	

}

function draw() {
	background(200);

	// socket.on('mouse', function(data) { // réaction à la receptions d'un signal
	// 	//console.log("ok dam");
	// 	fill(0,0,255);
	// 	stroke(255);
	// 	ellipse(data.x,data.y,20,20);
	// 	}
	// );
	
	//ellipse(100,100,50,50);
	controlKey();
	shiftHead();
	borderManager();
	displayTail();
	holeManager();
	deathManager();
}

// function mouseDragged() {
//   // Make a little object with mouseX and mouseY
//   var data = {
//     x: mouseX,
//     y: mouseY
//   };
//   // Send that object to the socket
//   socket.emit('mouse',data);
// }

function controlKey() {
	if (keyIsDown(37)) {  // left ARROW
		vect1.rotate(-angle);
  } 
  else if (keyIsDown(39)) {  // right ARROW
		vect1.rotate(angle);
  }
  // if (keyPressed(13)){
  //   x += 20 ;
	 // y += 20;
  // 	vect1.setMag(v);
  // } 
  return false; // prevent default
}

function shiftHead() {
	append(tail,[x,y]);
	x += vect1.x ;
	y += vect1.y ;

}

function holeManager() {
	
	if(goHole && tail.length > sizeHead ){
		if (random(1)>0.990 ) {
			for(var k = tail.length-sizeHead-hole  ; k<tail.length-sizeHead-1  ; k+=1){ // on fait le trou juste apèes la tête du serpent
					tail[k] = false;
			}
			goHole=false;
			minSpaceBetweenHoles =50;
		}
	} 
	if(!goHole){
			minSpaceBetweenHoles -=1;
			if(minSpaceBetweenHoles == 0) goHole = true;
	}
}

function displayTail() { // la tête est de qualité, la queue moins pour performance and smooth driving
	strokeWeight(thickness);
	stroke(242,100,80);			

	if(tail.length > sizeHead + lineScale){ // si  la queue est plus grande que la tête
	
		for(k = 1 ; k<tail.length-lineScale-sizeHead  ; k+=lineScale+1){ // on affiche la queue
			line(tail[k][0],tail[k][1],tail[k+lineScale][0],tail[k+lineScale][1]);	
		}
		for(k = tail.length-lineScale-sizeHead  ; k<tail.length-1  ; k+=2){ // puis on affiche la tête
			line(tail[k][0],tail[k][1],tail[k+1][0],tail[k+1][1]);	
		}	
	}
	else { // on déssine la queue et la tête de la même manière si le serpent est trop petit
		for(k = 1 ; k<tail.length-lineScale-1  ; k+=2){
			line(tail[k][0],tail[k][1],tail[k+1][0],tail[k+1][1]);	
		}		
	}

	//console.log(tail.length);
}

function borderManager() {
	if( x > width){
		preventLineDrawing();
		x = 0;
	}  
	if( x < 0) {
		preventLineDrawing();
		x = width;
	}
	if( y > height) {
		preventLineDrawing()	;
		y = 0;
	}
	if( y < 0) {
    preventLineDrawing();
		y = height;
	}
}

function preventLineDrawing() {
	for(k=0 ; k<lineScale; k++) {
		append(tail,false);
	} // fonctionne depuis borderManager
}

function deathManager() {
	for(k=0 ; k<tail.length-sizeHead-thickness; k ++) {
		var mindist = thickness-3;
		
		if(  tail[k] && dist(x,y,tail[k][0],tail[k][1]) < mindist  ) {

			vect1.setMag(0);
		}
	}
}












