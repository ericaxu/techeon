var UI = function() {
	this.$numLinesOfCode = $('#num-lines-of-code');
	this.$numDollars = $('#num-dollars');
};

UI.prototype.setLinesOfCode = function(newAmount) {
	this.$numLinesOfCode.text(newAmount);
};

UI.prototype.setDollars = function(newAmount) {
	this.$numDollars.text(newAmount);
};

var ui = new UI();

var GAME = new Game();
GAME.AddResource(new Resource(GAME, 'money'));
GAME.AddResource(new Resource(GAME, 'code'));

GAME.AddGenerator(new Generator(GAME, 'webdev').SetBaseRate('money', 1).Add(1));

GAME.events.on('post_loop', function(game) {
	if (game.Every(25)) {
		ui.setLinesOfCode(GAME.resources['code'].value);
		ui.setDollars(GAME.resources['money'].value);
	}
});

GAME.Start();