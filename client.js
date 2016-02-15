var canvas = document.getElementsByTagName("canvas")[0],
	ctx = canvas.getContext("2d"),
	scale;
addEventListener("resize", (function onResize() {
	canvas.width = canvas.offsetWidth;
	canvas.height = canvas.offsetHeight;
	
	scale = canvas.height / 10;
	
	return onResize;
})());

var socket;

var dt = 1 / 60,
loop = (function(acc, lastLoop) {
	return function() {
		var thisLoop = Date.now();
		if (lastLoop) {
			acc += Math.min((thisLoop - lastLoop) / 1000, 1 / 20);
			
			while (acc >= dt) {
				update();
				
				acc -= dt;
			}
			
			render();
		}
		lastLoop = thisLoop;
		requestAnimationFrame(loop);
	}
})(0);

var worldSize = 0;

function Player(id, color, x, y) {
	this.id = id;
	
	this.color = color;
	
	this.radius = 1;
	
	this.x = this.tx = x || 0;
	this.y = this.ty = y || 0;
	
	this.chatMessage = "";
	this.lastChatTime = 0;
}

function getPlayer(id) {
	for (var i = 0; i < players.length; i++)
		if (players[i].id == id)
			return players[i];
	
	return false;
}

var players, thePlayer;

var keys = [];
["keyup", "keydown"].forEach(function(e, d) {
	addEventListener(e, function(e) {
		keys[e.keyCode] = d;
		
		if (!getPlayer(thePlayer.id)) return;
		
		socket.emit("input", {input: [
			!!keys[39] - !!keys[37],
			!!keys[40] - !!keys[38]
		]});
	});
});

addEventListener("keypress", function(e) {
	var thisChatTime = Date.now();
	if (thisChatTime - thePlayer.lastChatTime > 1000) thePlayer.chatMessage = "";
	thePlayer.lastChatTime = thisChatTime;
	
	thePlayer.chatMessage = (thePlayer.chatMessage + String.fromCharCode(e.keyCode)).slice(-30);
	
	socket.emit("chat", {message: thePlayer.chatMessage});
});

function setSocketEvents() {
	socket.on("connect", function() {
		console.log("Connected to socket server");

		socket.emit("new");
	});
	
	socket.on("disconnect", function() {
		console.log("Disconnected from socket server");
		
		players = [];
	});
	
	socket.on("new", function(data) {
		console.log("New player connected: " + data.id);

		var p = new Player(data.id, data.color, data.x, data.y);
		
		if (data.isThePlayer) {
			worldSize = data.worldSize;
			
			thePlayer = p;
		}
		
		players.push(p);
	});
	
	socket.on("remove", function(data) {
		var p = getPlayer(data.id);

		if (!p) return;

		players.splice(players.indexOf(p), 1);
	});
	
	socket.on("move", function(data) {
		var p = getPlayer(data.id);
		
		if (!p) return;
		
		p.tx = data.x;
		p.ty = data.y;
	});
	
	socket.on("chat", function(data) {
		var p = getPlayer(data.id);
		
		if (!p) return;
		
		p.chatMessage = data.message;
		p.lastChatTime = Date.now();
	});
}

function update() {
	for (var i = 0; i < players.length; i++) {
		var p = players[i];
		
		var interp = 1 / 0.1;
		p.x += (p.tx - p.x) * interp * dt;
		p.y += (p.ty - p.y) * interp * dt;
	}
}

function render() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	
	ctx.save();
	ctx.translate(canvas.width / 2 - thePlayer.x * scale, canvas.height / 2 - thePlayer.y * scale);
	ctx.lineWidth = 0.05 * scale;
	ctx.strokeStyle = "#000";
	ctx.strokeRect(-worldSize * scale / 2, -worldSize * scale / 2, worldSize * scale, worldSize * scale);
	for (var i = 0; i < players.length; i++) {
		var p = players[i];
		
		ctx.beginPath();
		ctx.arc(p.x * scale, p.y * scale, p.radius * scale, 0, Math.PI * 2);
		ctx.fillStyle = p.color;
		ctx.fill();
		
		ctx.save();
		if (ctx.globalAlpha = 1 - Math.min(Math.max((Date.now() - p.lastChatTime - 3000) / 500, 0), 1)) {
			var x = (p.x + 0.2) * scale,
				y = (p.y - 1.7) * scale,
				fontSize = 0.5 * scale;
			ctx.font = fontSize + "px Arial";
			var width = Math.max(3 * scale, ctx.measureText(p.chatMessage).width + 0.5 * scale),
				height = fontSize + 0.5 * scale,
				radius = 0.3 * scale;
			var left = x - width / 2,
				right = x + width / 2,
				top = y - height / 2,
				bottom = y + height / 2;
			ctx.beginPath();
			ctx.moveTo(left + radius, top);
			ctx.lineTo(right - radius, top);
			ctx.quadraticCurveTo(right, top, right, top + radius);
			ctx.lineTo(right, bottom - radius);
			ctx.quadraticCurveTo(right, bottom, right - radius, bottom);
			ctx.lineTo(x + 1 * scale, bottom);
			ctx.lineTo(x + 0.6 * scale, bottom + 0.3 * scale);
			ctx.lineTo(x + 0.6 * scale, bottom);
			ctx.lineTo(left + radius, bottom);
			ctx.quadraticCurveTo(left, bottom, left, bottom - radius);
			ctx.lineTo(left, top + radius);
			ctx.quadraticCurveTo(left, top, left + radius, top);
			ctx.fillStyle = "#FFF";
			ctx.fill();
			ctx.lineWidth = 0.05 * scale;
			ctx.strokeStyle = "#000";
			ctx.stroke();
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.fillStyle = "#000";
			ctx.fillText(p.chatMessage, x, y);
		}
		ctx.restore();
	}
	ctx.restore();
}

(function init() {
	players = [];
	
	thePlayer = new Player();
	
	socket = io.connect("http://localhost:3000"); // http://123.eu-1.evennode.com:80
	
	setSocketEvents();
	
	loop();
})();
