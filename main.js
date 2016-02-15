"use strict";

var canvas = document.getElementsByTagName("canvas")[0],
	ctx = canvas.getContext("2d");
addEventListener("resize", (function onResize() {
	canvas.width = canvas.offsetWidth;
	canvas.height = canvas.offsetHeight;
	
	return onResize;
})());

var keys = [];
addEventListener("keydown", function(e) {
	keys[e.keyCode] = true;
});
addEventListener("keyup", function(e) {
	keys[e.keyCode] = false;
});

var dt = 1 / 60,
loop = (function(acc, lastLoop) {
	return function() {
		var thisLoop = performance.now();
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

function Assets() {
	for (var i = 0; i < arguments.length; i++) {
		var x = arguments[i];

		if (x.slice(-4) == ".png") {
			this[x] = new Image();
			this[x].src = "" + x;
		} else {
			this[x] = new Audio();
			this[x].src = "audio/" + x;
		}
	}
}

function Ship(x, y) {
	this.width = 220;
	this.height = 92;
	
	this.x = 0;
	this.y = 0;
	
	this.vx = 0;
	this.vy = 0;
	
	this.a = 0;
	
	this.av = 0;
	
	this.image = assets["ship.png"];
}

var assets = new Assets(
	"ocean.png",
	"ship.png"
);

var ship, ships;

function signum(x) {
	return x > 0 ? 1 : x < 0 ? -1 : 0;
}

function update() {
	if (keys[38]) {
		ship.vx += Math.cos(ship.a) * 30 * dt;
		ship.vy += Math.sin(ship.a) * 30 * dt;
	}
	if (keys[40]) {
		ship.vx -= Math.cos(ship.a) * 25 * dt;
		ship.vy -= Math.sin(ship.a) * 25 * dt;
	}
	
	var v = Math.sqrt(Math.pow(ship.vx, 2) + Math.pow(ship.vy, 2));
	if (v > 0) {
		var d = Math.abs(ship.a - Math.atan2(ship.vy, ship.vx)) % (Math.PI * 2),
			r = d > Math.PI ? Math.PI * 2 - d : d,
			a = Math.min(1, 1 - Math.abs(r - Math.PI / 2) / (Math.PI / 2) + 0.2);
		ship.vx -= ship.vx * v * 0.01 * a * dt;
		ship.vy -= ship.vy * v * 0.01 * a * dt;
	}
	
	
	if (keys[37]) ship.av -= Math.PI / 180 * 10 * dt;
	if (keys[39]) ship.av += Math.PI / 180 * 10 * dt;
	
	ship.av -= signum(ship.av) * ship.av * ship.av * 5 * dt;
	
	
	ship.x += ship.vx * dt;
	ship.y += ship.vy * dt;
	
	ship.a += ship.av * dt;
}

function render() {
	ctx.imageSmoothingEnabled = false;

	ctx.clearRect(0, 0, canvas.width, canvas.height);
	
	ctx.save();
	ctx.translate(canvas.width / 2, canvas.height / 2);
	ctx.rotate(-ship.a - Math.PI / 2);
	ctx.translate(-canvas.width / 2, -canvas.height / 2);
	ctx.translate(
		canvas.width / 2 - ship.x,
		canvas.height / 2 - ship.y
	);
	
	ctx.drawImage(assets["ocean.png"], 0, 0, canvas.width, canvas.height);
	
	for (var i = 0; i < ships.length; i++) {
		ctx.save();
		ctx.beginPath();
		ctx.translate(ships[i].x, ships[i].y);
		ctx.rotate(ships[i].a);
		ctx.drawImage(ships[i].image, -ships[i].width / 2, -ships[i].height / 2, ships[i].width, ships[i].height);
		ctx.closePath();
		ctx.restore();
	}
	
	ctx.restore();
}

addEventListener("load", function() {
	ships = [ship = new Ship(200, 200)];

	loop();
});
