
// knockout
var initialValues = {
	angularSpeed: Math.PI / 72,
	circlesCount: 5,
};

var _invalidatedTest = ko.observable();
 
var viewmodel = {
	circlesCount: ko.computed({
		read: function () {
			_invalidatedTest();
			return gameData.circles.length;
		},
		write: function (value) {
			gameData.recreateCircles(value);
		}
	}),
	angularSpeed: ko.computed({
		read: function() {
			_invalidatedTest();
			return Math.PI / gameData.angularSpeed;
		},
		write: function (value) {
			gameData.angularSpeed = Math.PI / value;
		}
	}),
	errorMargin: ko.computed({
		read: function () {
			_invalidatedTest();
			return gameData.errorMargin;
		},
		write: function (value) {
			gameData.errorMargin = value;
		}
	}),
	// Interlocked
	showInterlocks: ko.observable(true),
	interlockedSchema: ko.observableArray(gameData.interlocked),
	
	// Visuals
	imagePath: ko.computed({
		read: function () {
			_invalidatedTest();
			return visuals.imagePath;
		},
		write: function (value) {
			visuals.loadImage(value);
		}
	}),
	overlayColor: ko.computed({
		read: function () {
			_invalidatedTest();
			return visuals.overlayColor;
		},
		write: function (value) {
			visuals.overlayColor = value;
		},
	}),
	shouldOnlyStroke: ko.observable(visuals.shouldStroke),
	saves: ko.observableArray(),
	
	shouldShowUI: ko.observable(true),
};
// Knockout doesn't update booleans correctly if they are computed
_shouldOnlyStroke: ko.computed({
	read: function () {
		_invalidatedTest();
		visuals.shouldStroke = viewmodel.shouldOnlyStroke();
		return "gtfo, knockout";
	},
});


// TODO: Not quite indepedent of the main logic
function enumerateSaves() {
	viewmodel.saves.removeAll();
	var length = localStorage.length;
	for (var i = 0; i < length; i++) {
		viewmodel.saves.push(localStorage.key(i));
	}
}

$(document).ready(function () {
	enumerateSaves();
	$("#save-button").click(function () {
		var name = prompt("Save file");
		saveManager.save(name);
		enumerateSaves();
	});
	$("#load-button").click(function () {
		var name = prompt("Load file");
		if (saveManager.load(name)) {
			// Update UI
			_invalidatedTest.notifySubscribers();
		}
		
	});
	$("#delete-button").click(function () {
		var name = prompt("Delete file");
		if (name.toLowerCase() == "all") {
			saveManager.clear();
		}
		else {
			saveManager.delete(name);
		}
		enumerateSaves();
	});
	$("#dump-button").click(function () {
		console.log(saveManager.dumpSaves());
	});
	
	$("#edit-interlocks").click(function () {
		// Convert to object, stringify and display, parse back, convert to array, update UI
		var asObject = { };
		for (var i = 0; i < gameData.interlocked.length; i++) {
			var locks = gameData.interlocked[i];
			if (locks && locks.length != 0) {
				asObject[i] = locks;
			}
		}
		var text = JSON.stringify(asObject);
		var modified = prompt("Edit interlocks", text);
		try {
			asObject = JSON.parse(modified);
		}
		catch (Error) {
			alert("Syntax error, reverting changes");
			return;
		}
		gameData.interlocked = [];
		viewmodel.interlockedSchema.removeAll();
		for (var i in asObject) {
			gameData.interlocked[i] = asObject[i];
		}
		for (var i = 0; i < gameData.interlocked.length; i++) {
			viewmodel.interlockedSchema.push(gameData.interlocked[i]);
		}
		
		gameData.recreateCircles(viewmodel.circlesCount());
		_invalidatedTest.notifySubscribers();
	});
	
	// Check for the various File API support.
	if (window.File && window.FileReader && window.FileList) {
	  
		$("#import-file-selector").change(function (event) {
			var file = event.target.files[0];
			var fileReader = new FileReader();
			fileReader.onload = function (e) {
				var json = e.target.result;
				var savesData = JSON.parse(json);
				saveManager.import(savesData);
			};
			fileReader.readAsText(file);
			
			enumerateSaves();
		});
	} else {
	  alert('The File APIs are not fully supported in this browser. You may not import saves');
	}
	
	
	ko.applyBindings(viewmodel);
});


