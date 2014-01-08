// knockout

var PuzzleUI = (function () {

	function PuzzleUI(puzzle) {
		var _invalidatedTest = ko.observable();
		
		Object.defineProperty(this, "_invalidatedTest", {
			value: _invalidatedTest,
			enumerable: false,
		});
		
		this.puzzle = puzzle;
		var self = this;
		 
		this.viewmodel = {
			circlesCount: ko.computed({
				read: function () {
					_invalidatedTest();
					return self.puzzle.gameData.circles.length;
				},
				write: function (value) {
					self.puzzle.recreateCircles(value);
				}
			}),
			angularSpeed: ko.computed({
				read: function() {
					_invalidatedTest();
					return Math.PI / self.puzzle.gameData.angularSpeed;
				},
				write: function (value) {
					self.puzzle.gameData.angularSpeed = Math.PI / value;
				}
			}),
			errorMargin: ko.computed({
				read: function () {
					_invalidatedTest();
					return self.puzzle.gameData.errorMargin;
				},
				write: function (value) {
					self.puzzle.gameData.errorMargin = value;
				}
			}),
			// Interlocked
			showInterlocks: ko.observable(true),
			interlockedSchema: ko.observableArray(gameData.interlocked),
			
			// Visuals
			imagePath: ko.computed({
				read: function () {
					_invalidatedTest();
					return self.puzzle.visuals.imagePath;
				},
				write: function (value) {
					self.puzzle.visuals.loadImage(value);
				}
			}),
			overlayColor: ko.computed({
				read: function () {
					_invalidatedTest();
					return self.puzzle.visuals.overlayColor;
				},
				write: function (value) {
					self.puzzle.visuals.overlayColor = value;
				},
			}),
			shouldOnlyStroke: ko.observable(self.puzzle.visuals.shouldStroke),
			saves: ko.observableArray(),		
			shouldShowUI: ko.observable(true),
		};
		
		// DO NOT REMOVE, Knockout doesn't update booleans correctly if they are computed
		_shouldOnlyStroke: ko.computed({
			read: function () {
				_invalidatedTest();
				self.puzzle.visuals.shouldStroke = self.viewmodel.shouldOnlyStroke();
				return "gtfo, knockout";
			},
		});
		
		this.enumerateSaves();
	}
	
	PuzzleUI.prototype.stringifyInterlocks = function () {
		var asObject = { };
		for (var i = 0; i < gameData.interlocked.length; i++) {
			var locks = gameData.interlocked[i];
			if (locks && locks.length != 0) {
				asObject[i] = locks;
			}
		}
		var text = JSON.stringify(asObject);
	};
	
	PuzzleUI.prototype.setInterlocks = function (interlocks) {
		this.puzzle.gameData.interlocked = [];
		this.puzzle.viewmodel.interlockedSchema.removeAll();
		for (var i in asObject) {
			this.puzzle.gameData.interlocked[i] = interlocks[i];
		}
		for (var i = 0; i < gameData.interlocked.length; i++) {
			this.viewmodel.interlockedSchema.push(this.gameData.interlocked[i]);
		}
		
		this.puzzle.gameData.recreateCircles(viewmodel.circlesCount());
		this._invalidatedTest.notifySubscribers();
	};
	// TODO: Not quite indepedent of the save manager logic
	PuzzleUI.prototype.enumerateSaves = function enumerateSaves() {
		this.viewmodel.saves.removeAll();
		var length = localStorage.length;
		for (var i = 0; i < length; i++) {
			this.viewmodel.saves.push(localStorage.key(i));
		}
	};
	
	return PuzzleUI;
})();


function initInterface(puzzle) {

	var puzzleUI = new PuzzleUI(puzzle);
	puzzleUI.enumerateSaves();
	
	$("#save-button").click(function () {
		var name = prompt("Save file");
		saveManager.save(name, puzzle);
		puzzleUI.enumerateSaves();
	});
	$("#load-button").click(function () {
		var name = prompt("Load file");
		if (saveManager.load(name, puzzle)) {
			// Update UI
			puzzleUI._invalidatedTest.notifySubscribers();
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
		puzzleUI.enumerateSaves();
	});
	$("#dump-button").click(function () {
		console.log(saveManager.dumpSaves());
	});
	
	$("#edit-interlocks").click(function () {
		// Convert to object, stringify and display, parse back, convert to array, update UI
		
		var text = puzzleUI.stringifyInterlocks();
		var modified = prompt("Edit interlocks", text);
		try {
			asObject = JSON.parse(modified);
		}
		catch (Error) {
			alert("Syntax error, reverting changes");
			return;
		}
		puzzleUI.setInterlocks(asObject);
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
			
			puzzleUI.enumerateSaves();
		});
	} else {
	  alert('The File APIs are not fully supported in this browser. You may not import saves');
	}
	
	ko.applyBindings(puzzleUI.viewmodel);
};


