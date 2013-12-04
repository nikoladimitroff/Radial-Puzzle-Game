// game logic
window.requestAnimationFrame = 
	window.requestAnimationFrame || 
	window.mozRequestAnimationFrame ||
	window.webkitRequestAnimationFrame || 
	window.msRequestAnimationFrame || 
	function (callback) { setTimeout(callback, 1000 / 30); }
	
var Circle = function (rotation, interlocked) {
	if (rotation.constructor != Number)
		throw new TypeError("rotation must be a number");
	if (interlocked.constructor != Array)
		throw new TypeError("interlocked must be an array");
	
	this.rotation = rotation;
	this.interlocked = interlocked;
}

var canvas = document.getElementById("puzzle-canvas");
var context = canvas.getContext("2d");

var updateTimer = 1000 / 30;

var spacial = {
	minRadius: 100,
	maxRadius: 500,
	center: {
		x: canvas.width / 2,
		y: canvas.height / 2
	},
	step: 100,
	recalculate: function () {
		var squareSide = Math.min(canvas.width, canvas.height);
		var circlesCount = gameData.circles.length;
		// This constants works best
		spacial.maxRadius = 0.585 * squareSide;
		spacial.minRadius = spacial.maxRadius / (circlesCount - 1);
		spacial.center = { 
			x: canvas.width / 2,
			y: canvas.height / 2
		};
		spacial.step = (spacial.maxRadius - spacial.minRadius) / circlesCount;
	},
};


var visuals = {
	overlayColor: "rgba(255, 255, 0, 0.2)",
	imagePath: "monalisa.jpg",
	image: new Image(),
	loadImage: function (path) {
		var newImage = new Image();
		newImage.src = path;
		newImage.onload = function () {
			visuals.image = newImage;
			visuals.imagePath = path;
		}
	}
}

var solve = function solve(angle) {
	angle = normalizeAngle(angle || 0);
	var length = gameData.circles.length;
	for (var i = 0; i < length; i++) {
		gameData.circles[i].rotation = angle;
	}
};

// go responsive
var fixDimensions = function fixDimensions() {
	var canvasContainer = $("#puzzle-canvas");
	canvas.width = canvasContainer.width();
	canvas.height = canvasContainer.height();
	spacial.recalculate();
	
	context.globalCompositeOperation = "destination-over";
	context.fillStyle = visuals.overlayColor;
};
$(window).resize(fixDimensions);

var init = function () {
	fixDimensions();
	visuals.loadImage(visuals.imagePath);
};

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
	errorMargin: 1,
	interlocked: [],
	selectedIndex: 0,
	circles: [],
	recreateCircles: function recreateCircles(count) {
		gameData.circles = [];
		for (var i = 0; i < count; i++) {	
			var angle =  Math.random() * 2 * Math.PI - Math.PI;
			gameData.circles.push(new Circle(angle, gameData.interlocked[i] || []));
		}
		
		spacial.recalculate();
	},
};
Object.defineProperty(gameData, "current", {
	get: function () {
		return gameData.circles[gameData.selectedIndex];
	},
});
var interlocked = [];
interlocked[0] = [1];
interlocked[2] = [3];
gameData.interlocked = interlocked;
var circlesCount = 5;
gameData.recreateCircles(circlesCount);

var keybindings = {
	nextCircle: 0x44,
	prevCircle: 0x41,
	rotatePositive: 0x53,
	rotateNegative: 0x57
};

var utilities = (function () {

	var copyArray = function (source) {
		var copy = [];
		for (var i = 0; i < source.length; i++) {
			copy[i] = source[i];
		}
		return copy;
	};
	
	return {
		copyArray: copyArray
	};
})();

var saveManager = (function () {
	return {
		save: function (name) {
			var data = {
				imagePath: visuals.imagePath,
				circlesCount: gameData.circles.length,
				angularSpeed: gameData.angularSpeed,
				errorMargin: gameData.errorMargin,
				interlocked: gameData.interlocked,
			};
			var json = JSON.stringify(data);
			localStorage.setItem(name, json);
		},
		load: function (name) {
			var json = localStorage.getItem(name);
			if (!json) {
				throw new Error("no save exists with that name");
			}
			var data = JSON.parse(json);
			visuals.loadImage(data.imagePath);
			gameData.angularSpeed = data.angularSpeed;
			gameData.errorMargin = data.errorMargin;
			gameData.interlocked = data.interlocked;
			gameData.recreateCircles(data.circlesCount);
		},
	};
})();


var normalizeAngle = function normalizeAngle(angle) { 
	angle = angle % (2 * Math.PI); 
	return angle;
};

var testVictoryCondition = function testVictoryCondition() {
	var errorMargin = gameData.errorMargin * gameData.angularSpeed;
	var circles = gameData.circles;
	for (var i = 0; i < circles.length - 1; i++) {
		if (Math.abs(circles[i].rotation - circles[i + 1].rotation) > errorMargin) {
			return false;
		}
	}
	return true;
};

var update = function update() {
	var circlesCount = gameData.circles.length;
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
	
	var current = gameData.current;
	current.rotation = normalizeAngle(current.rotation + speed);
	for (var i = 0; i < current.interlocked.length; i++) {
		var index = current.interlocked[i];
		var next = gameData.circles[index];
		next.rotation = normalizeAngle(next.rotation + speed);		
	}
	
	var hasWon = testVictoryCondition();
	if (hasWon) console.log("GJ");
	
	previousKeyboard = utilities.copyArray(keyboard);
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
		
		var imageWidth = visuals.image.width,
			imageHeight = visuals.image.height;
		context.drawImage(visuals.image, 
			(canvas.width - imageWidth) / 2, (canvas.height - imageHeight) / 2, imageWidth, imageHeight);
		
	context.restore();
}

var drawScene = function () {
	for (var i = 0; i < gameData.circles.length; i++) {
		var circle = gameData.circles[i];
		context.save();
			context.translate(spacial.center.x, spacial.center.y);
			context.rotate(circle.rotation);
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
// Run the game
init();
update();
draw();

// knockout
var initialValues = {
	angularSpeed: Math.PI / 72,
	circlesCount: 5,
};
var saves = (function () {
	var length = localStorage.length;
	var saves = [];
	for (var i = 0; i < length; i++) {
		saves.push(localStorage.key(i));
	}
	return saves;
})();

var viewmodel = {
	circlesCount: ko.computed({
		read: function () {
			return gameData.circles.length;
		},
		write: function (value) {
			gameData.recreateCircles(value);
		}
	}),
	angularSpeed: ko.computed({
		read: function() {
			return Math.PI / gameData.angularSpeed;
		},
		write: function (value) {
			gameData.angularSpeed = Math.PI / value;
		}
	}),
	errorMargin: ko.computed({
		read: function () {
			return gameData.errorMargin;
		},
		write: function (value) {
			gameData.errorMargin = value;
		}
	}),
	imagePath: ko.computed({
		read: function () {
			return visuals.imagePath;
		},
		write: function (value) {
			visuals.loadImage(value);
		}
	}),
	saves: ko.observableArray(saves),
	
	shouldShowUI: ko.observable(true),
};

$(document).ready(function () {
	ko.applyBindings(viewmodel);
	$("#save-button").click(function () {
		var name = prompt("Name the save file");
		saveManager.save(name);
	});
	$("#load-button").click(function () {
		var name = prompt("Name the save file");
		saveManager.load(name);
	});
});




