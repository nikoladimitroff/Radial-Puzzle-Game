
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
	overlayColor: ko.computed({
		read: function () {
			return visuals.overlayColor;
		},
		write: function (value) {
			visuals.overlayColor = value;
		},
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
	$("#dump-button").click(function () {
		console.log(saveManager.dumpSaves());
	});
});


