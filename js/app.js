var UI = function() {
	this.$numLinesOfCode = $('#num-lines-of-code');
	this.$numDollars = $('#num-dollars');
	this.$featureContainer = $('#feature-container');
	this.$teamContainer = $('#team-container');
};

UI.prototype.showLinesOfCode = function(newAmount) {
	this.$numLinesOfCode.text(newAmount.toFixed(0));
};

UI.prototype.showDollars = function(newAmount) {
	this.$numDollars.text(newAmount.toFixed(2));
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

UI.prototype.addTeamOption = function(generator) {
	var className = 'generator_' + generator.name +
	var $div = $('<div/>', {
		class: 'generator_' + generator.name + ' employee'
	});
	$div.append($('<h4/>').text(generator.name));
	var $button = $('<button/>').text(generator.buyPrice.money).on('click', function() {
		if (generator.CanBuy()) {
			generator.Buy();
		}
	});
	$div.append($button);
	this.$teamContainer.append($div);
};

UI.prototype.addFeatureOption = function(generator) {
	var $div = $('<div/>', {
		class: 'generator_' + generator.name + ' feature'
	});
	$div.append($('<h4/>').text(generator.name));
	var $button = $('<button/>').text(generator.buyPrice.code).on('click', function() {
		if (generator.CanBuy()) {
			console.log('buying');
			generator.Buy();
		} else {
			alert('cannot buy');
		}
	});
	$div.append($button);
	this.$featureContainer.append($div);
};

UI.prototype.updateGenerators = function (game) {
	for (var name in game.generators) {
		var generator = game.generators[name];
		// if it's not shown right now but it's available
		if ($('.generator_' + name).length === 0 && generator.Available()) {
			if (generator.buyPrice.code) {
				this.addFeatureOption(generator);
			} else if (generator.buyPrice.money) {
				this.addTeamOption(generator);
			}
		}
		// just unlocked previously unaffordable items
		else if ($('.generator_' + name).hasClass('unaffordable') && generator.CanBuy()) {
			$('.generator_' + name).removeClass('unaffordable');
		}
	}
};

var ui = new UI();

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

GAME.events.on('post_loop', function(game) {
	if (game.Every(50)) {
		ui.updateGenerators(game);
	}
});

ui.updateGenerators(GAME);