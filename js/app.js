var UI = function(game) {
	this.game = game;
	this.$numLinesOfCode = $('#num-lines-of-code');
	this.$numDollars = $('#num-dollars');
	this.$numLinesOfCodePerSec = $('#num-lines-of-code-per-sec');
	this.$numDollarsPerSec = $('#num-dollars-per-sec');
	this.$featureContainer = $('#feature-container');
	this.$teamContainer = $('#team-container');
};

UI.prototype.showDollarStats = function() {
	var dollars = this.game.resources['money'].amount;
	var dollarsPerSec = this.game.GetRatesPerTick('money') * this.game.GetTicksPerSecond();
	this.$numDollars.text(formatNumWithCommas(dollars.toFixed(2)));
	this.$numDollarsPerSec.text(formatNumWithCommas(dollarsPerSec.toFixed(2)));
};

UI.prototype.updateLinesOfCodeStats = function() {
	var linesOfCode = this.game.resources['code'].amount;
	var linesOfCodePerSec = this.game.GetRatesPerTick('code') * this.game.GetTicksPerSecond();

	this.$numLinesOfCode.text(formatNumWithCommas(linesOfCode.toFixed(0)));
	this.$numLinesOfCodePerSec.text(formatNumWithCommas(linesOfCodePerSec.toFixed(0)));
};

UI.prototype.updateDollarStats = function(game) {
	ui.showDollarStats(game.resources['money'].amount);
};

UI.prototype.updateResources = function(game) {
	this.updateLinesOfCodeStats(game);
	this.updateDollarStats(game);
};

UI.prototype.addTeamOption = function(generator) {
	if (!generator.CanBuy()) {
		var className = 'generator_' + generator.name + ' unaffordable';
	} else {
		var className = 'generator_' + generator.name;
	}

	var $div = addEl('div', this.$teamContainer, className);
	addEl('h4', $div, '', generator.GetTitle());
	addEl('p', $div, '', generator.GetDescription());
	addEl('button', $div, '', '$' + generator.buyPrice.money).on('click', function() {
		if (generator.CanBuy()) {
			generator.Buy();
		}
	});
};

UI.prototype.addFeatureOption = function(generator) {
	if (!generator.CanBuy()) {
		var className = 'generator_' + generator.name + ' unaffordable';
	} else {
		var className = 'generator_' + generator.name;
	}

	var $div = addEl('div', this.$featureContainer, className);
	addEl('h4', $div, '', generator.GetTitle());
	addEl('p', $div, '', generator.GetDescription());
	addEl('button', $div, '', generator.buyPrice.code + ' lines').on('click', function() {
		if (generator.CanBuy()) {
			generator.Buy();
		}
	});
};

UI.prototype.updateGenerators = function (game) {
	for (var name in game.generators) {
		var generator = game.generators[name];
		var $generatorDiv = $('.generator_' + name);
		// if it's not shown right now but it's available
		if ($generatorDiv.length === 0 && generator.Available()) {
			if (generator.buyPrice.code) {
				this.addFeatureOption(generator);
			} else if (generator.buyPrice.money) {
				this.addTeamOption(generator);
			}
		}
		// just unlocked previously unaffordable items
		else if ($generatorDiv.length > 0 && $generatorDiv.hasClass('unaffordable') && generator.CanBuy()) {
			$generatorDiv.removeClass('unaffordable');
		}
	}
};

var ui = new UI(GAME);

GAME.events.on('post_loop', function(game) {
	if (game.Every(25)) {
		ui.updateResources(GAME);
	}
});

GAME.Start();

$('#codebase').on('click', function() {
	GAME.resources['code'].Add(1);
	ui.updateLinesOfCodeStats(GAME);
});

GAME.events.on('post_loop', function(game) {
	if (game.Every(25)) {
		ui.updateGenerators(game);
	}
});

ui.updateGenerators(GAME);