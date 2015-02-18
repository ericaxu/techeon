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

UI.prototype.showPurchasable = function(generator, type) {
	if (!generator.CanBuy()) {
		var className = 'purchasable generator_' + generator.name + ' unaffordable';
	} else {
		var className = 'purchasable generator_' + generator.name;
	}

	if (type == 'feature') {
		var buttonText = generator.buyPrice.code + ' lines';
		var $container = this.$featureContainer;
	} else if (type == 'team') {
		var buttonText = '$ ' + generator.buyPrice.money;
		var $container = this.$teamContainer;
	}

	var $div = addEl('div', $container, className);
	addEl('h4', $div, '', generator.GetTitle());
	addEl('button', $div, '', buttonText).on('click', $.proxy(function() {
		if (generator.CanBuy()) {
			generator.Buy();
			this.updateGenerators();
		}
	}, this));
	var $tooltip = addEl('div', $div, 'purchasable_tooltip');
	addEl('h4', $tooltip, '', generator.GetTitle());
	addEl('p', $tooltip, '', generator.GetDescription());

	if (type === 'feature') {
		$tooltip.offset({ left: $div.outerWidth() });
	} else if (type === 'team') {
		$tooltip.offset({ left: $div.offset().left - $tooltip.outerWidth() });
	}

	$div.on('mouseenter', function() {
		$tooltip.show();
		$div.on('mousemove', function(e) {
			var offsetTop = Math.max(0, e.pageY - 20);
			$tooltip.offset({ top: offsetTop });
		});
	});

	$div.on('mouseleave', function() {
		$tooltip.hide();
		$div.off('mousemove');
	});
};

UI.prototype.updateGenerators = function () {
	for (var name in this.game.generators) {
		var generator = this.game.generators[name];
		var $generatorDiv = $('.generator_' + name);
		// if it's not shown right now but it's available
		if ($generatorDiv.length === 0 && generator.Available()) {
			if (generator.buyPrice.code) {
				this.showPurchasable(generator, 'feature');
			} else if (generator.buyPrice.money) {
				this.showPurchasable(generator, 'team');
			}
		}
		// just unlocked previously unaffordable items
		else if ($generatorDiv.length > 0 && $generatorDiv.hasClass('unaffordable') && generator.CanBuy()) {
			$generatorDiv.removeClass('unaffordable');
		}
		// no longer have enough money to buy it
		else if ($generatorDiv.length > 0 && !$generatorDiv.hasClass('unaffordable') && !generator.CanBuy()) {
			$generatorDiv.addClass('unaffordable');
		}
	}
};

var ui = new UI(GAME);

GAME.events.on('post_loop', function(game) {
	if (game.Every(5)) {
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
		ui.updateGenerators();
	}
});

ui.updateGenerators(GAME);