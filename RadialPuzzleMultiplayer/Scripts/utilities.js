
var utilities = (function () {
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

	return {
		copyArray: copyArray,
		normalizeAngle: normalizeAngle,
	};
})();

var saveManager = (function () {
	return {
		save: function (name, puzzle) {
			var data = {
				imagePath: puzzle.visuals.imagePath,
				circlesCount: puzzle.gameData.circles.length,
				angularSpeed: puzzle.gameData.angularSpeed,
				errorMargin: puzzle.gameData.errorMargin,
				interlocked: puzzle.gameData.interlocked,
			};
			var json = JSON.stringify(data);
			localStorage.setItem(name, json);
		},
		load: function (name, puzzle) {
			var json = localStorage.getItem(name);
			if (!json) {
				throw new Error("no save exists with that name");
			}
			var data = JSON.parse(json);
			puzzle.visuals.loadImage(data.imagePath);
			puzzle.gameData.angularSpeed = data.angularSpeed;
			puzzle.gameData.errorMargin = data.errorMargin;
			puzzle.gameData.interlocked = data.interlocked;
			puzzle.gameData.recreateCircles(data.circlesCount);
			
			return true;
		},
		delete: function (name) {
			localStorage.removeItem(name);
		},
		clear: function () {
			localStorage.clear();
		},
		import: function (saves) {
			for (var i = 0; i < saves.length; i++) {
				localStorage.setItem(saves[i].name, saves[i].data);
			}
		},
		dumpSaves: function () {
			var saves = [];
			var length = localStorage.length;
			for (var i = 0; i < length; i++) {
				var name = localStorage.key(i);
				var data = localStorage.getItem(name);
				saves.push({ 
					name: name,
					data: data,
				});
			}
			var json = JSON.stringify(saves);
			return json;
		},
	};
})();
