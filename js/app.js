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
	var dollars = this.game.content.resources['money'].amount.Get();
	var dollarsPerSec = this.game.GetResourceRatesPerSecond('money');
	this.$numDollars.text(formatNumWithCommas(dollars.toFixed(2)));
	this.$numDollarsPerSec.text(formatNumWithCommas(dollarsPerSec.toFixed(2)));
};

UI.prototype.updateLinesOfCodeStats = function() {
	var linesOfCode = this.game.content.resources['code'].amount.Get();
	var linesOfCodePerSec = this.game.GetResourceRatesPerSecond('code');

	this.$numLinesOfCode.text(formatNumWithCommas(linesOfCode.toFixed(0)));
	this.$numLinesOfCodePerSec.text(formatNumWithCommas(linesOfCodePerSec.toFixed(0)));
};

UI.prototype.updateDollarStats = function(game) {
	ui.showDollarStats(game.content.resources['money'].amount.Get());
};

UI.prototype.updateResources = function(game) {
	this.updateLinesOfCodeStats(game);
	this.updateDollarStats(game);
};

UI.prototype.showPurchasable = function(generator, type) {
	var className = 'purchasable generator_' + generator.GetName();
	if (!generator.purchasable.CanBuy()) {
		className += ' unaffordable';
	}

	if (type == 'feature') {
		var buttonText = generator.purchasable.GetBuyPrice().code + ' lines';
		var $container = this.$featureContainer;
	} else if (type == 'team') {
		var buttonText = '$ ' + generator.purchasable.GetBuyPrice().money;
		var $container = this.$teamContainer;
	}

	var $div = addEl('div', $container, className);
	addEl('h4', $div, '', generator.describable.GetTitle());
	addEl('button', $div, '', buttonText).on('click', $.proxy(function() {
		if (generator.purchasable.CanBuy()) {
			generator.purchasable.Buy();
			this.updateGenerators();
		}
	}, this));
	var $tooltip = addEl('div', $div, 'purchasable_tooltip');
	addEl('h4', $tooltip, '', generator.describable.GetTitle());
	addEl('p', $tooltip, '', generator.describable.GetDescription());

	if (type === 'feature') {
		$tooltip.offset({left: $div.outerWidth()});
	} else if (type === 'team') {
		$tooltip.offset({left: $div.offset().left - $tooltip.outerWidth()});
	}

	$div.on('mouseenter', function() {
		$tooltip.show();
		$div.on('mousemove', function(e) {
			var offsetTop = Math.max(0, e.pageY - 20);
			$tooltip.offset({top: offsetTop});
		});
	});

	$div.on('mouseleave', function() {
		$tooltip.hide();
		$div.off('mousemove');
	});
};

UI.prototype.updateGenerators = function() {
	for (var name in this.game.content.generators) {
		var generator = this.game.content.generators[name];
		var $generatorDiv = $('.generator_' + name);
		// if it's not shown right now but it's available
		if ($generatorDiv.length === 0 && generator.purchasable.Available()) {
			if (generator.purchasable.GetBuyPrice().code) {
				this.showPurchasable(generator, 'feature');
			} else if (generator.purchasable.GetBuyPrice().money) {
				this.showPurchasable(generator, 'team');
			}
		}
		// just unlocked previously unaffordable items
		else if ($generatorDiv.length > 0 && $generatorDiv.hasClass('unaffordable') && generator.purchasable.CanBuy()) {
			$generatorDiv.removeClass('unaffordable');
		}
		// no longer have enough money to buy it
		else if ($generatorDiv.length > 0 && !$generatorDiv.hasClass('unaffordable') && !generator.purchasable.CanBuy()) {
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
	GAME.content.resources['code'].amount.Add(1);
	ui.updateLinesOfCodeStats(GAME);
});

GAME.events.on('post_loop', function(game) {
	if (game.Every(25)) {
		ui.updateGenerators();
	}
});

ui.updateGenerators(GAME);