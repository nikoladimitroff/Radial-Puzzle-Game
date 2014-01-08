// game logic
window.requestAnimationFrame = 
	window.requestAnimationFrame || 
	window.mozRequestAnimationFrame ||
	window.webkitRequestAnimationFrame || 
	window.msRequestAnimationFrame || 
	function (callback) { setTimeout(callback, 1000 / 30); }
	
var Puzzle = (function () {

    function Puzzle(canvasContainer, context, circlesCount) {
		this.context = context;
		
		this.visuals = new Visuals();;
		this.gameData = new GameData();
		this.recreateCircles(circlesCount);
		
		// go responsive
		var self = this;
		var fixDimensions = function fixDimensions() {	
			// main
			var canvasContainer = $("#puzzle-canvas");
			self.context.canvas.width = canvasContainer.width();
			self.context.canvas.height = canvasContainer.height();
			self.spacial = new Spacial(self.context.canvas, self.gameData.circles.length);
			
			self.context.globalCompositeOperation = "destination-over";
		};
		$(window).resize(fixDimensions);
		fixDimensions();
	}

	var Circle = function (rotation, interlocked) {
		if (rotation.constructor != Number)
			throw new TypeError("rotation must be a number");
		if (interlocked.constructor != Array)
			throw new TypeError("interlocked must be an array");
		
		this.rotation = rotation;
		this.interlocked = interlocked;
	}
	
	var GameData = function () {
		this.angularSpeed = Math.PI / 72;
		this.errorMargin = 1;
		this.interlocked = [];
		this.selectedIndex = 0;
		this.circles = [];
	
		Object.defineProperty(this, "current", {
			get: function () {
				return this.circles[gameData.selectedIndex];
			},
		});
		var interlocked = [];
		interlocked[0] = [1];
		interlocked[2] = [3, 4];
		this.interlocked = interlocked;
	};
	
	var Spacial = function (canvas, circlesCount) {
		var squareSide = Math.min(canvas.width, canvas.height);
		// This constants works best
		this.maxRadius = 0.585 * squareSide;
		this.minRadius = this.maxRadius / (circlesCount - 1);
		if (circlesCount == 1)
			this.minRadius = this.maxRadius;
			
		this.center = { 
			x: canvas.width / 2,
			y: canvas.height / 2
		};
		this.step = (this.maxRadius - this.minRadius) / circlesCount;
	};

	var Visuals = function (imagePath) {
		imagePath = imagePath || "Images/monalisa.jpg";
		
		this.overlayColor = "rgba(0, 0, 0, 1)";
		this.shouldStroke = true;
		this.lineWidth = 15;
		this.imagePath = imagePath;
		this.image = new Image();
		
		this.loadImage(imagePath);
	}
	
	Visuals.prototype.loadImage = function (path) {
		var newImage = new Image();
		newImage.src = path;
		var self = this;
		newImage.onload = function () {
			self.image = newImage;
			self.imagePath = path;
		}
	};

	Puzzle.prototype.rotate = function (angle) {
	    var current = this.gameData.current;
	    current.rotation = utilities.normalizeAngle(current.rotation + angle);
	    for (var i = 0; i < current.interlocked.length; i++) {
	        var index = current.interlocked[i];
	        var next = this.gameData.circles[index];
	        next.rotation = utilities.normalizeAngle(next.rotation + angle);
	    }
	}

	Puzzle.prototype.solve = function solve(angle) {
		angle = utilities.normalizeAngle(angle || 0);
		var length = gameData.circles.length;
		for (var i = 0; i < length; i++) {
			this.gameData.circles[i].rotation = angle;
		}
	};
	
	Puzzle.prototype.recreateCircles = function recreateCircles(count) {
		this.gameData.selectedIndex = 0;
		this.gameData.circles = [];
		for (var i = 0; i < count; i++) {	
			var angle =  Math.random() * 2 * Math.PI - Math.PI;
			this.gameData.circles.push(new Circle(angle, this.gameData.interlocked[i] || []));
		}
		
		this.spacial = new Spacial(this.context.canvas, this.gameData.circles.length);
	};

	Puzzle.prototype.testVictoryCondition = function testVictoryCondition() {
		var errorMargin = this.gameData.errorMargin * this.gameData.angularSpeed;
		var circles = this.gameData.circles;
		for (var i = 0; i < circles.length - 1; i++) {
			if (Math.abs(circles[i].rotation - circles[i + 1].rotation) > errorMargin) {
				return false;
			}
		}
		return true;
	};

	
	Puzzle.prototype.update = function update() {

	}

	Puzzle.prototype.drawTorus = function (radius, shouldOverlay) {
		var context = this.context,
			canvas = context.canvas;
			visuals = this.visuals,
			spacial = this.spacial;
			
		context.save();
					
			var clippingRadius = radius;
			if (shouldOverlay && visuals.shouldStroke) {
				clippingRadius += context.lineWidth;
			}
			
			context.beginPath();
			context.arc(spacial.center.x, spacial.center.y, clippingRadius, 0, 2 * Math.PI);
			context.clip();
			
			if (shouldOverlay) {
				if (visuals.shouldStroke) {				
					context.strokeStyle = visuals.overlayColor;
					context.arc(spacial.center.x, spacial.center.y, radius + visuals.lineWidth / 2, 0, 2 * Math.PI);
					context.stroke();
				}
				else {
					context.fillStyle = visuals.overlayColor;
					context.arc(spacial.center.x, spacial.center.y, radius, 0, 2 * Math.PI);
					context.fill();
				}
			}
			
			var imageWidth = visuals.image.width,
				imageHeight = visuals.image.height;
			context.drawImage(visuals.image, 
				(canvas.width - imageWidth) / 2, (canvas.height - imageHeight) / 2, imageWidth, imageHeight);
			
		context.restore();
	}

	Puzzle.prototype.drawScene = function () {
		var context = this.context,
			gameData = this.gameData,
			spacial = this.spacial;
			
		for (var i = 0; i < gameData.circles.length; i++) {
			var circle = gameData.circles[i];
			context.save();
				context.translate(spacial.center.x, spacial.center.y);
				context.rotate(circle.rotation);
				context.translate(-spacial.center.x, -spacial.center.y);
				this.drawTorus(
					spacial.minRadius + (i + 1) * spacial.step, 
					i == gameData.selectedIndex);
			context.restore();
		}		
	}

	Puzzle.prototype.draw = function () {
		var context = this.context,
			canvas = context.canvas,
			visuals = this.visuals;
		context.clearRect(0, 0, canvas.width, canvas.height);
		context.lineWidth = visuals.lineWidth;
		this.drawScene();
	}
	
	return Puzzle;
})();

