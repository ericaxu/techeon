var UI = function(game) {
	this.game = game;
	this.$numLinesOfCode = $('#num-lines-of-code');
	this.$numDollars = $('#num-dollars');
	this.$numLinesOfCodePerSec = $('#num-lines-of-code-per-sec');
	this.$numDollarsPerSec = $('#num-dollars-per-sec');
	this.$featureContainer = $('#feature-container');
	this.$teamContainer = $('#team-container');
	this.$upgradeContainer = $('#upgrade-container');
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

UI.prototype.updatePurchasable = function(generator, type) {
	var className = '.generator_' + generator.GetName();
	var tooltipClassName = '.generator_' + generator.GetName() + '_tooltip';

	if (type == 'feature') {
		var price = generator.purchasable.GetBuyPrice().code + ' lines';
	} else if (type == 'team') {
		var price = '$ ' + generator.purchasable.GetBuyPrice().money;
	} else if (type == 'upgrade') {
		if ($.isEmptyObject(generator.purchasable.GetBuyPrice())) {
			var price = 'Free';
		} else {
			var price = '$ ' + generator.purchasable.GetBuyPrice().money;
		}

	}

	var $div = $(className);
	var $tooltip = $(tooltipClassName);
	$div.find('h4').text(generator.describable.GetTitle());
	$div.find('.price').text(price);
	if (type !== 'upgrade') {
		$div.find('.purchasable_owned_count').text(generator.amount.Get());
	}
	$tooltip.find('h4').text(generator.describable.GetTitle());
	$tooltip.find('p').text(generator.describable.GetDescription());
};

UI.prototype.showPurchasable = function(generator, type) {
	var className = 'purchasable generator_' + generator.GetName();
	if (!generator.purchasable.CanBuy()) {
		className += ' unaffordable';
	}

	if (type == 'feature') {
		var $container = this.$featureContainer;
	} else if (type == 'team') {
		var $container = this.$teamContainer;
	} else if (type == 'upgrade') {
		var $container = this.$upgradeContainer;
	}

	var $div = addEl('div', $container, className);
	addEl('h4', $div);
	addEl('div', $div, 'purchasable_owned_count');
	addEl('div', $div, 'price');
	$div.on('click', $.proxy(function() {
		if (generator.purchasable.CanBuy()) {
			generator.purchasable.Buy();
			this.updateGenerators().updateUpgrades();
			this.updatePurchasable(generator, type);
		}
	}, this));

	var tooltipClassName = 'purchasable_tooltip generator_' + generator.GetName() + '_tooltip';
	var $tooltip = addEl('div', $container, tooltipClassName);
	addEl('h4', $tooltip);
	addEl('p', $tooltip);

	this.updatePurchasable(generator, type);

	if (type === 'feature') {
		$tooltip.offset({ left: $div.outerWidth() + 1 });
	} else if (type === 'team') {
		$tooltip.offset({ left: $div.offset().left - $tooltip.outerWidth() });
	} else if (type === 'upgrade') {
		$tooltip.offset({ left: $div.offset().left - $tooltip.outerWidth() });
	}

	$div.on('mouseenter', function() {
		$tooltip.show();
		$div.on('mousemove', function(e) {
			var offsetTop = Math.min(Math.max(0, e.pageY - 20), $(window).height() - $tooltip.outerHeight());
			$tooltip.offset({ top: offsetTop });
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
		} else if ($generatorDiv.length > 0) {
			// just unlocked previously unaffordable items
			if ($generatorDiv.hasClass('unaffordable') && generator.purchasable.CanBuy()) {
				$generatorDiv.removeClass('unaffordable');
			}
			// no longer have enough money to buy it
			else if (!$generatorDiv.hasClass('unaffordable') && !generator.purchasable.CanBuy()) {
				$generatorDiv.addClass('unaffordable');
			}
		}
	}

	return this;
};

UI.prototype.updateUpgrades = function() {
	for (var name in this.game.content.upgrades) {
		var upgrade = this.game.content.upgrades[name];
		var $generatorDiv = $('.generator_' + name);
		var $tooltipDiv = $('.generator_' + name + '_tooltip');
		if ($generatorDiv.length === 0 && upgrade.purchasable.Available() && !upgrade.obtainable.GetObtained()) {
			this.showPurchasable(upgrade, 'upgrade');
		} else if ($generatorDiv.length > 0) {
			// just unlocked previously unaffordable items
			if ($generatorDiv.hasClass('unaffordable') && upgrade.purchasable.CanBuy()) {
				$generatorDiv.removeClass('unaffordable');
			}
			// no longer have enough money to buy it
			else if (!$generatorDiv.hasClass('unaffordable') && !upgrade.purchasable.CanBuy()) {
				$generatorDiv.addClass('unaffordable');
			}
			// upgrade already used
			else if (upgrade.obtainable.GetObtained()) {
				$generatorDiv.remove();
				$tooltipDiv.remove();
			}
		}
	}

	return this;
};

UI.prototype.setupPopup = function() {
	// Closing popup
	var $popup = $('.popup');
	$('.wrapper, .close_btn').on('click', function () {
		$popup.hide();
	});

	// Allow user to close popup with ESC key
	$(document).keydown(function (e) {
		if (e.keyCode == 27) {
			$popup.hide();
		}
	});

	$('.popup_content').click(function (e) {
		e.stopPropagation();
	});
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
		ui.updateGenerators().updateUpgrades();
	}
});

ui.setupPopup();
ui.updateGenerators();
ui.updateUpgrades();

// Set up achievement event listeners
for(var key in GAME.content.achievements) {
	GAME.content.achievements[key].events.on('obtain', function(achievement) {
		$('.popup_content').html('Achievement Get: ' + achievement.describable.GetTitle() + '<br>' +
		achievement.describable.GetDescription());
		$('.popup').show();
	});
}