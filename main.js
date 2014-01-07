var keybindings = {
	nextCircle: 0x44,
	prevCircle: 0x41,
	rotatePositive: 0x53,
	rotateNegative: 0x57
};

var handleKeyboard = function handleKeyboard(keyCode) {
	var circlesCount = gameData.circles.length;
	if (keyCode == keybindings.nextCircle) {
		gameData.selectedIndex = (gameData.selectedIndex + 1) % circlesCount;
	}
	else if (keyCode == keybindings.prevCircle) {
		gameData.selectedIndex = (circlesCount + gameData.selectedIndex - 1) % circlesCount
	}	
	
	var speed = 0;
	if (keyCode == keybindings.rotatePositive) {
		speed = gameData.angularSpeed;
	}
	else if (keyCode == keybindings.rotateNegative) {
		speed = -gameData.angularSpeed;
	}
	
	var current = gameData.current;
	current.rotation = utilities.normalizeAngle(current.rotation + speed);
	for (var i = 0; i < current.interlocked.length; i++) {
		var index = current.interlocked[i];
		var next = gameData.circles[index];
		next.rotation = utilities.normalizeAngle(next.rotation + speed);		
	}
}
var puzzle = new Puzzle($("#puzzle-canvas")[0].getContext("2d"), 5, $("#puzzle-container"));
var gameData = puzzle.gameData;

window.addEventListener("keydown", function (args) {
	handleKeyboard(args.keyCode);
});

// Run the game
var main = function main() {
	setTimeout(function update() {
		puzzle.update();
		setTimeout(update, 1000 / 30);
	}, 1000 / 30);
	
	requestAnimationFrame(function draw() {
		puzzle.draw();
		requestAnimationFrame(draw);
	});
	
	initInterface(puzzle);
	
	var second = new Puzzle($("#test-canvas")[0].getContext("2d"), 5, $("#test-container"));
	setTimeout(function update() {
		second.update();
		setTimeout(update, 1000 / 30);
	}, 1000 / 30);
	
	requestAnimationFrame(function draw() {
		second.draw();
		requestAnimationFrame(draw);
	});
};

main();


