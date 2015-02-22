var UI = function(game) {
	this.game = game;
	this.$numLinesOfCode = $('#num-lines-of-code');
	this.$numDollars = $('#num-dollars');
	this.$numLinesOfCodePerSec = $('#num-lines-of-code-per-sec');
	this.$numDollarsPerSec = $('#num-dollars-per-sec');
	this.$featureContainer = $('#feature-container');
	this.$teamContainer = $('#team-container');
	this.$upgradeContainer = $('#upgrade-container');
	this.$notifications = $('.notification-container');
	this.pixelsBetweenTooltip = 0;
	this.scrollCodebaseLimit = 50;
};

UI.prototype.updateLinesOfCodeStats = function() {
	var linesOfCode = this.game.content.resources['code'].amount.Get();
	var linesOfCodePerSec = this.game.GetResourceRatesPerSecond('code');
	this.scrollCodebase(linesOfCodePerSec / this.game.GetTicksPerSecond() * 5);

	this.$numLinesOfCode.text(formatLinesOfCode(linesOfCode));
	this.$numLinesOfCodePerSec.text(formatLinesOfCode(linesOfCodePerSec));
};

UI.prototype.updateDollarStats = function() {
	var dollars = this.game.content.resources['money'].amount.Get();
	var dollarsPerSec = this.game.GetResourceRatesPerSecond('money');
	this.$numDollars.text(formatDollar(dollars));
	this.$numDollarsPerSec.text(formatDollar(dollarsPerSec));
};

UI.prototype.updateResources = function() {
	this.updateLinesOfCodeStats();
	this.updateDollarStats();
};

UI.prototype.updatePurchasable = function(entity, type) {
	var className = '.generator-' + entity.GetName();

	if (type == 'feature') {
		var price = formatLinesOfCode(entity.purchasable.GetBuyPrice().code);
	} else if (type == 'team') {
		var price = formatDollar(entity.purchasable.GetBuyPrice().money);
	} else if (type == 'upgrade') {
		if ($.isEmptyObject(entity.purchasable.GetBuyPrice())) {
			var price = 'Free';
		} else {
			var price = formatDollar(entity.purchasable.GetBuyPrice().money);
		}
	}

	var $div = $(className);
	$div.find('h4').text(entity.describable.GetTitle());
	$div.find('.price').text(price);
	if (entity.amount) {
		var amount = entity.amount.Get() || '';
		$div.find('.purchasable-owned-count').text(amount);
	}
};

UI.prototype.showPurchasable = function(entity, type) {
	var className = 'purchasable generator-' + entity.GetName();
	if (!entity.purchasable.CanBuy()) {
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
	addEl('div', $div, 'purchasable-owned-count');
	addEl('div', $div, 'price');
	$div.on('click', $.proxy(function() {
		if (entity.purchasable.CanBuy()) {
			entity.purchasable.Buy();
			this.updateGenerators().updateUpgrades();
			this.updatePurchasable(entity, type);
		}
	}, this));

	this.updatePurchasable(entity, type);

	var self = this;
	var $tooltip = $('.purchasable-tooltip-wrapper');
	$div.off('mouseenter').on('mouseenter', function() {
		//clearTimeout(self.tooltipDisappearTimeout);

		$div.off('mousemove').on('mousemove', function(e) {
			var offsetTop = Math.min(Math.max(0, e.pageY - 30), $(window).height() - $tooltip.outerHeight());
			$tooltip.offset({ top: offsetTop });
		});

		// show tooltip
		var $tooltipContent = $tooltip.find('.inner-border-2');
		$tooltipContent.empty();
		addEl('h4', $tooltipContent, '', entity.describable.GetTitle());
		addEl('p', $tooltipContent, '', entity.describable.GetDescription());
		if (entity.amount !== undefined && entity.amount.GetMax() > 0) {
			addEl('p', $tooltipContent, '', entity.describable.GetEffect());
		}

		if (type === 'feature') {
			$tooltip.offset({ left: $div.outerWidth() + self.pixelsBetweenTooltip });
		} else if (type === 'team') {
			$tooltip.offset({ left: $div.offset().left - $tooltip.outerWidth() - self.pixelsBetweenTooltip });
		} else if (type === 'upgrade') {
			$tooltip.offset({ left: $div.offset().left - $tooltip.outerWidth() - self.pixelsBetweenTooltip });
		}

		$tooltip.show();

	});

	//$tooltip.off('mouseenter').on('mouseenter', function() {
	//	clearTimeout(self.tooltipDisappearTimeout);
	//	$div.off('mousemove');
	//});
    //
	//$tooltip.off('mouseleave').on('mouseleave', function() {
	//	$(this).offset({ left: 0, top: 0 }).hide();
	//});

	$div.off('mouseleave').on('mouseleave', function() {
		//self.tooltipDisappearTimeout = setTimeout(function() {
		//	$tooltip.offset({ left: 0, top: 0 }).hide();
		//}, 100);
		$tooltip.offset({ left: 0, top: 0 }).hide();
		$div.off('mousemove');
	});
};

UI.prototype.updateGenerators = function() {
	for (var name in this.game.content.generators) {
		var generator = this.game.content.generators[name];
		var $generatorDiv = $('.generator-' + name);
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
		var $generatorDiv = $('.generator-' + name);
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
			}
		}
	}

	return this;
};

UI.prototype.setupPopup = function() {
	// Closing popup
	var $popup = $('.popup');
	$('.wrapper, .close-btn').on('click', function () {
		$popup.hide();
	});

	// Allow user to close popup with ESC key
	$(document).keydown(function (e) {
		if (e.keyCode == 27) {
			$popup.hide();
		}
	});

	$('.popup-content').click(function (e) {
		e.stopPropagation();
	});
};

UI.prototype.showNotification = function(title, text, icon) {
	var $notification = addEl('div', this.$notifications, 'notification');
	addEl('span', $notification, 'close-btn').on('click', function() {
		$notification.remove();
	});
	addEl('img', $notification, '', '', {
		src: 'http://th08.deviantart.net/fs71/200H/i/2013/355/f/e/doge_by_leftyninja-d6ytne2.jpg',
		alt: title
	});
	var $achievement = addEl('div', $notification);
	addEl('h4', $achievement, '', title);
	addEl('p', $achievement, '', text);

	setTimeout(function() {
		$notification.remove();
	}, 2000);
};

UI.prototype.scrollCodebase = function(numOfLines) {
	var $codebase = $('#codebase > pre');
	numOfLines = Math.min(this.scrollCodebaseLimit, numOfLines);
	for (var i = 0; i < numOfLines; i++) {
		var newTop = parseInt($codebase.css('top')) - 20;
		// cycle through the code again
		if (newTop <= -6380) {
			newTop = -380;
		}
		$codebase.css('top', newTop + 'px');
	}
};

UI.prototype.setupNavClickHandlers = function() {
	$('.nav-achievements').on('click', function() {
		$('.screen, .navbar').hide();
		$('.achievements-screen, .back').show();
	});
	$('.nav-settings').on('click', function() {
		$('.screen, .navbar').hide();
		$('.settings-screen, .back').show();
	});
	$('.back').on('click', function() {
		$('.screen, .back').hide();
		$('.main-game-screen, .navbar').show();
	});
};

UI.prototype.showAchievement = function(achievement, $container) {
	if (achievement.obtainable.GetObtained()) {
		var $div = addEl('div', $container, 'achievement');
		addEl('img', $div, '', '', {
			src: 'http://th08.deviantart.net/fs71/200H/i/2013/355/f/e/doge_by_leftyninja-d6ytne2.jpg',
			alt: achievement.describable.GetTitle()
		});
		var $tooltip = $('.purchasable-tooltip-wrapper');
		$div.off('mouseenter').on('mouseenter', function() {
			$div.off('mousemove').on('mousemove', function(e) {
				var offsetTop = Math.min(Math.max(0, e.pageY - $tooltip.outerHeight() / 2), $(window).height() - $tooltip.outerHeight());
				var offsetLeft = Math.min(Math.max(0, e.pageX + 30), $(window).width() - $tooltip.outerWidth());
				$tooltip.offset({ top: offsetTop, left: offsetLeft });
			});

			// show tooltip
			var $tooltipContent = $tooltip.find('.inner-border-2');
			$tooltipContent.empty();
			addEl('h4', $tooltipContent, '', achievement.describable.GetTitle());
			addEl('p', $tooltipContent, '', achievement.describable.GetDescription());
			$tooltip.show();
		});

		$div.off('mouseleave').on('mouseleave', function() {
			$tooltip.offset({ left: 0, top: 0 }).hide();
			$div.off('mousemove');
		});
	} else {
		var $div = addEl('div', $container, 'locked achievement');
		addEl('div', $div, '', '?');
	}
};

UI.prototype.showAchievements = function() {
	var $achievementsList = $('.achievements-list');
	$achievementsList.empty();
	for (var key in this.game.content.achievements) {
		var achievement = this.game.content.achievements[key];
		this.showAchievement(achievement, $achievementsList);
	}
};

var ui = new UI(GAME);

GAME.events.on('post_loop', function(game) {
	if (game.Every(5)) {
		ui.updateResources();
	}
});

GAME.Start();

GAME.events.on('post_loop', function(game) {
	if (game.Every(25)) {
		ui.updateGenerators().updateUpgrades();
	}
});

$(document).on('keyup', function(e) {
	if (isPrintable(e.keyCode)) {
		ui.scrollCodebase(1);
		GAME.content.resources['code'].amount.Add(1);
		ui.updateLinesOfCodeStats(GAME);
	}
});

setInterval(function() {
	var saveObject = GAME.loader.Save();
	localStorage.setItem('techeon-save', JSON.stringify(saveObject));
}, 10000);

var savedString = localStorage.getItem('techeon-save');

if (savedString) {
	GAME.loader.Load(JSON.parse(savedString));
}

sh_highlightDocument();

// Set up achievement event listeners
for (var key in GAME.content.achievements) {
	GAME.content.achievements[key].events.on('obtain', function(achievement) {
		ui.showNotification('Achievement Unlocked', achievement.describable.GetTitle() + ': ' +
		achievement.describable.GetDescription(), '');
		ui.showAchievements();
	});
}

ui.setupPopup();
ui.setupNavClickHandlers();
ui.updateGenerators();
ui.updateUpgrades();
ui.showAchievements();