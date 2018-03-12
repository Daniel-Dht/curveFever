

var express = require('express');
var app = express();

var server = app.listen(3000);
app.use(express.static('public'));

var socket = require('socket.io');
var io = socket(server);

io.sockets.on('connection', function (socket) { 
    console.log("We have a new client: " + socket.id);

    // socket.on('mouse', function(data) {
    // 	console.log(data);
    // 	socket.broadcast.emit('mouse', data);
    // })

    socket.on('tailTab', function(data) {
    	//console.log(data);
    	socket.broadcast.emit('tailTab', data);
    })

    socket.on('disconnect', function() {
      console.log("Client has disconnected");
    });

});















