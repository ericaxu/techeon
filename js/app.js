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
	ui.showLinesOfCode(game.resources['code'].value);
};

UI.prototype.updateResources = function(game) {
	this.updateLinesOfCode(game);
	this.updateDollars(game);
}

UI.prototype.updateDollars = function(game) {
	ui.showDollars(game.resources['money'].value);
};

var ui = new UI();

var GAME = new Game();
GAME.CreateResource('money');
GAME.CreateResource('code');

GAME.CreateGenerator('webdev').SetBaseRate('money', 1).Add(1);

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