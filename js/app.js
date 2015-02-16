var UI = function() {
	this.$numLinesOfCode = $('#num-lines-of-code');
	this.$numDollars = $('#num-dollars');
};

UI.prototype.showLinesOfCode = function(newAmount) {
	this.$numLinesOfCode.text(newAmount);
};

UI.prototype.showDollars = function(newAmount) {
	this.$numDollars.text(newAmount);
};

UI.prototype.updateLinesOfCode = function(game) {
	ui.showLinesOfCode(game.resources['code'].amount);
};

UI.prototype.updateResources = function(game) {
	this.updateLinesOfCode(game);
	this.updateDollars(game);
};

UI.prototype.updateDollars = function(game) {
	ui.showDollars(game.resources['money'].amount);
};

var ui = new UI();

var GAME = new Game();
GAME.CreateResource('money');
GAME.CreateResource('code');

for (var i = 0; i < generatorsData.length; i++) {
	var generatorData = generatorsData[i];
	var generator = GAME.CreateGenerator(generatorData.name);
	for (var c in generatorData.cost) {
		generator.AddBuyPrice(c, generatorData.cost[c]);
	}
	for (var r in generatorData.effect) {
		generator.AddRate(r, generatorData.effect[r]);
	}
}

for (var i = 0; i < featuresData.length; i++) {
	var featureData = featuresData[i];
	var feature = GAME.CreateGenerator(featureData.name);
	for (var c in featureData.cost) {
		feature.AddBuyPrice(c, featureData.cost[c]);
	}
	for (var r in featureData.effect) {
		feature.AddRate(r, featureData.effect[r]);
	}
}

GAME.events.on('post_loop', function(game) {
	if (game.Every(25)) {
		ui.updateResources(GAME);
	}
});

GAME.Start();

$('#codebase').on('click', function() {
	GAME.resources['code'].Add(1);
	ui.updateLinesOfCode(GAME);
});