var util = require("util"),
	io = require("socket.io").listen(3000);

var worldSize = 15; // use worldSize / 2 / worldRadius instead? // Use a circle as world instead?

function Player(id, color, x, y) {
	this.id = id;
	
	this.color = color;

	this.radius = 1;
	
	this.x = x;
	this.y = y;
	
	this.speed = 5;
	
	this.input = [0, 0];
}

function getPlayer(id) {
	for (var i = 0; i < players.length; i++)
		if (players[i].id == id)
			return players[i];
	
	return false;
}

var players = [];

io.sockets.on("connection", function(socket) {
	util.log("Player has connected: " + socket.id);

	socket.on("disconnect", function() {
		util.log("Player has disconnected: " + this.id);

		var p = getPlayer(this.id);

		if (!p) return;

		players.splice(players.indexOf(p), 1);

		this.broadcast.emit("remove", {id: this.id});
	});

	socket.on("new", function(data) {
		var p = new Player(
			this.id,
			"hsl(" + Math.floor(Math.random() * 360) + ", 100%, 50%)",
			-worldSize / 2 + 2 + Math.random() * (worldSize - 4),
			-worldSize / 2 + 2 + Math.random() * (worldSize - 4)
		);

		this.broadcast.emit("new", {id: p.id, color: p.color, x: p.x, y: p.y});
		
		players.push(p);

		for (var i = 0; i < players.length; i++) {
			var p = players[i];
			
			this.emit("new", {id: p.id, color: p.color, isThePlayer: this.id == p.id, x: p.x, y: p.y, worldSize: worldSize});
		}
	});

	socket.on("input", function(data) {
		var p = getPlayer(this.id);

		if (!p) return;
		
		p.input = data.input;
	});
	
	socket.on("chat", function(data) {
		var p = getPlayer(this.id);

		if (!p) return;
		
		if (data.message.length <= 30)
			this.broadcast.emit("chat", {id: p.id, message: data.message});
	});
});

function update() {
	for (var i = 0; i < players.length; i++) {
		var p = players[i];
		
		var len = Math.sqrt(Math.pow(p.input[0], 2) + Math.pow(p.input[1], 2));
		
		p.x += (p.input[0] / len || 0) * p.speed * dt;
		p.y += (p.input[1] / len || 0) * p.speed * dt;
	}
	
	for (var i = 0; i < players.length; i++) {
		var p1 = players[i];
		for (var j = i + 1; j < players.length; j++) {
			var p2 = players[j];
			
			var dx = p2.x - p1.x,
				dy = p2.y - p1.y,
				dist = Math.sqrt(dx * dx + dy * dy),
				radii = p1.radius + p2.radius;
			if (dist < radii) {
				var sep = (radii / dist - 1) / 2,
					sx = dx * sep,
					sy = dy * sep;
				
				p1.x -= sx;
				p1.y -= sy;
				p2.x += sx;
				p2.y += sy;
			}
		}
	}
	
	/*
	while (true) {
		var ct = 1, c1, c2;
		
		for (var i = 0; i < players.length; i++) {
			var t1 = players[i];
			for (var j = i + 1; j < players.length; j++) {
				var t2 = players[j];
				
				var dx = t2.x - t1.x,
					dy = t2.y - t1.y,
					vx = t2.vx - t1.vx,
					vy = t2.vy - t1.vy;
		
				var qb = 2 * (dx * vx + dy * vy);
				if (qb >= 0) continue;
				var qa = vx * vx + vy * vy;
				var qc = (dx * dx + dy * dy) - Math.pow(t1.radius + t2.radius, 2);
				
				var qd = qb * qb - 4 * qa * qc;
				if (qd >= 0) {
					qd = Math.sqrt(qd);
					
					var r1 = (-qb - qd) / (2 * qa);
					var r2 = (-qb + qd) / (2 * qa);
					
					if ((r1 >= 0 && r1 <= 1) || (r2 >= 0 && r2 <= 1))
						if (r1 < ct) {
							ct = r1;
							
							c1 = t1;
							c2 = t2;
						}
				}
			}
		}
		
		if (ct < 1) {
			ct -= 0.0000000001;
			
			c1.x += c1.vx * ct;
			c1.y += c1.vy * ct;
			
			c2.x += c2.vx * ct;
			c2.y += c2.vy * ct;
			
			c1.vx = c1.vy = c2.vx = c2.vy = 0;
		} else {
			for (var i = 0; i < players.length; i++) {
				var p = players[i];
				
				p.x += p.vx;
				p.y += p.vy;
			}
			
			break;
		}
	}
	*/
	
	for (var i = 0; i < players.length; i++) {
		var p = players[i];
		
		p.x = Math.min(Math.max(p.x, -worldSize / 2 + p.radius), worldSize / 2 - p.radius);
		p.y = Math.min(Math.max(p.y, -worldSize / 2 + p.radius), worldSize / 2 - p.radius);
	}
}

var dt = 1 / 60;
(function(acc, lastLoop) {
	(function loop() {
		var thisLoop = Date.now();
		if (lastLoop) {
			acc += Math.min((thisLoop - lastLoop) / 1000, 1 / 20);
			
			while (acc >= dt) {
				update();
				
				acc -= dt;
			}
		}
		lastLoop = thisLoop;
		setTimeout(loop, 15);
	})();
})(0);

(function loop() {
	for (var i = 0; i < players.length; i++) {
		var p = players[i];
		
		io.sockets.emit("move", {id: p.id, x: p.x, y: p.y});
	}
	
	setTimeout(loop, 45);
})();
