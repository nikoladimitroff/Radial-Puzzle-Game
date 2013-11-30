window.requestAnimationFrame = 
	window.requestAnimationFrame || 
	window.mozRequestAnimationFrame ||
	window.webkitRequestAnimationFrame || 
	window.msRequestAnimationFrame || 
	function (callback) { setTimeout(callback, 1000 / 30); }

var canvas = document.getElementById("puzzle-canvas");
var context = canvas.getContext("2d");

var updateTimer = 1000 / 30;
var imageFileLocation = "connor.jpg";

var circlesCount = 5;

var spacial = {
	minRadius: 100,
	maxRadius: 500,
	center: {
		x: canvas.width / 2,
		y: canvas.height / 2
	},
	step: 100
};


var image = new Image();
image.src = imageFileLocation;
var visuals = {
	overlayColor: "rgba(255, 255, 0, 0.2)",
	image: image
}

var init = function () {
	
};

var solve = function solve(angle) {
	angle = normalizeAngle(angle || 0);
	for (var i = 0; i < gameData.rotations.length; i++) {
		gameData.rotations[i] = angle;
	}
};

// go responsive
(function () {
	var fixDimensions = function fixDimensions() {
		var canvasContainer = $("#puzzle-canvas");
		canvas.width = canvasContainer.width();
		canvas.height = canvasContainer.height();
		var squareSide = Math.min(canvas.width, canvas.height);
		// This constants works best
		spacial.maxRadius = 0.575 * squareSide;
		spacial.minRadius = spacial.maxRadius / (circlesCount - 1);
		init();
		spacial.center = { 
			x: canvas.width / 2,
			y: canvas.height / 2
		};
		spacial.step = (spacial.maxRadius - spacial.minRadius) / circlesCount;
		
		
		context.globalCompositeOperation = "destination-over";
		context.fillStyle = visuals.overlayColor;
	};
	$(window).resize(fixDimensions);
	
	fixDimensions();
})();



var keyboard = [],
	previousKeyboard = [];

window.addEventListener("keydown", function (args) {
	keyboard[args.keyCode] = true;
}, false);

window.addEventListener("keyup", function (args) {
	keyboard[args.keyCode] = false;
}, false);

var gameData = {
	angularSpeed: Math.PI / 72,
	selectedIndex: 0,
	rotations: [],
	interlocked: [],
};
for (var i = 1; i < circlesCount; i++) {		
	gameData.rotations[i] = Math.random() * 2 * Math.PI - Math.PI;
}
gameData.interlocked[0] = [1];
gameData.interlocked[2] = [3];

var keybindings = {
	nextCircle: 0x44,
	prevCircle: 0x41,
	rotatePositive: 0x53,
	rotateNegative: 0x57
};

var copyArray = function (source) {
	var copy = [];
	for (var i = 0; i < source.length; i++) {
		copy[i] = source[i];
	}
	return copy;
};

var normalizeAngle = function normalizeAngle(angle) { 
	angle = angle % (2 * Math.PI); 
	return angle;
};

var testVictoryCondition = function testVictoryCondition() {
	var errorMargin = gameData.angularSpeed;
	var rotations = gameData.rotations;
	for (var i = 0; i < rotations.length - 1; i++) {
		if (Math.abs(rotations[i] - rotations[i + 1]) > errorMargin) {
			return false;
		}
	}
	return true;
};

var update = function update() {
	if (keyboard[keybindings.nextCircle] && !previousKeyboard[keybindings.nextCircle]) {
		gameData.selectedIndex = (gameData.selectedIndex + 1) % circlesCount;
	}
	if (keyboard[keybindings.prevCircle] && !previousKeyboard[keybindings.prevCircle]) {
		gameData.selectedIndex = (circlesCount + gameData.selectedIndex - 1) % circlesCount
	}	
	
	var speed = 0;
	if (keyboard[keybindings.rotatePositive]) {
		speed = gameData.angularSpeed;
	}
	if (keyboard[keybindings.rotateNegative]) {
		speed = -gameData.angularSpeed;
	}
	
	var rotations = gameData.rotations; // Shortcut
	var current = gameData.selectedIndex;
	rotations[current] = normalizeAngle(rotations[current] + speed);
	for (var i = 0; i < gameData.interlocked[current]; i++) {
		var index = gameData.interlocked[current][i];
		rotations[index] = normalizeAngle(rotations[index] + speed);		
	}
	
	var hasWon = testVictoryCondition();
	if (hasWon) console.log("GJ");
	
	previousKeyboard = copyArray(keyboard);
	setTimeout(update, updateTimer);
}

var drawTorus = function (smallRadius, bigRadius, shouldOverlay) {
	context.save();
		
		context.beginPath();
		context.arc(spacial.center.x, spacial.center.y, smallRadius, 0, 2 * Math.PI);
		context.clip();
		
		if (shouldOverlay) {
			context.beginPath();
			context.arc(spacial.center.x, spacial.center.y, bigRadius, 0, 2 * Math.PI);
			context.fill();
		}
		
		context.drawImage(visuals.image, 0, 0);
		
	context.restore();
}

var drawScene = function () {
	for (var i = 0; i < circlesCount; i++) {		
		context.save();
			context.translate(spacial.center.x, spacial.center.y);
			context.rotate(gameData.rotations[i]);
			context.translate(-spacial.center.x, -spacial.center.y);
			drawTorus(
				spacial.minRadius + i * spacial.step, 
				spacial.minRadius + (i + 1) * spacial.step, 
				i == gameData.selectedIndex);
		context.restore();
	}		
}

var draw = function () {

	context.clearRect(0, 0, canvas.width, canvas.height);
	drawScene();
	
	requestAnimationFrame(draw);
}
visuals.image.onload = function () {
	init();
	update();
	draw();
}