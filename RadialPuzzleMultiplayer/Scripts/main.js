var keybindings = {
	nextCircle: 0x44,
	prevCircle: 0x41,
	rotatePositive: 0x53,
	rotateNegative: 0x57
};

var dispatcher = $.connection.dispatcher;

var handleKeyboard = function handleKeyboard(keyCode) {
	var circlesCount = gameData.circles.length;
	if (keyCode == keybindings.nextCircle) {
	    gameData.selectedIndex = (gameData.selectedIndex + 1) % circlesCount;
	    dispatcher.server.changeCircle(gameData.selectedIndex);
        
	}
	else if (keyCode == keybindings.prevCircle) {
	    gameData.selectedIndex = (circlesCount + gameData.selectedIndex - 1) % circlesCount
	    dispatcher.server.changeCircle(gameData.selectedIndex);
	}	
	
	var speed = 0;
	if (keyCode == keybindings.rotatePositive) {
		speed = gameData.angularSpeed;
	}
	else if (keyCode == keybindings.rotateNegative) {
		speed = -gameData.angularSpeed;
	}
	if (speed != 0) {
	    puzzle.rotate(speed);
	    dispatcher.server.rotate(speed);
	}
}
var puzzle = new Puzzle($("#puzzle-container"), $("#puzzle-canvas")[0].getContext("2d"), 5);
var gameData = puzzle.gameData;
var secondPuzzle = new Puzzle($("#second-container"), $("#second-canvas")[0].getContext("2d"), 5);

function update() {
    puzzle.update();
    if (puzzle.testVictoryCondition()) {
        dispatcher.server.solved();
        alert("YOU WON, THE OTHER GUY IS CUTTING HIS WRISTS NOW, ARE YOU FUCKING SORRY?");
    }
    else {
        secondPuzzle.update();
        setTimeout(update, 1000 / 30);
    }
}
function draw() {
    puzzle.draw();
    secondPuzzle.draw();
    requestAnimationFrame(draw);
}

// Run the game
var main = function main() {
    update();
    draw();

	initInterface(puzzle);
	
	dispatcher.client.gameStarted = function () {
	    alert("You are now ingame!");
	};
	dispatcher.client.rotated = function (id, angle) {
	    secondPuzzle.rotate(angle);
	}
	dispatcher.client.circleChanged = function (id, circle) {
	    secondPuzzle.gameData.selectedIndex = circle;
	}

	dispatcher.client.solved = function (id) {
	    secondPuzzle.solve();
	    alert("nab, you just got ownd");
	}

	$.connection.hub.start().done(function () {
	    window.addEventListener("keydown", function (args) {
	        handleKeyboard(args.keyCode);
	    });
	    dispatcher.server.queue();
	});

	$.connection.hub.logging = true;
};

$(document).ready(main);


