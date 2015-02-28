var uiConfig = {
	saveInterval: 10000,
	updateResourceFrequencyInTicks: 1,
	updatePurchasablesFrequencyInTicks: 25,
	pixelsBetweenTooltip: 0,
	scrollCodebaseLimit: 50,
	notificationFadeDuration: 2000
};

var UI = function(game, config) {
	this.game = game;
	this.$numLinesOfCode = $('#num-lines-of-code');
	this.$numDollars = $('#num-dollars');
	this.$numLinesOfCodePerSec = $('#num-lines-of-code-per-sec');
	this.$numDollarsPerSec = $('#num-dollars-per-sec');
	this.$featureContainer = $('#feature-container');
	this.$teamContainer = $('#team-container');
	this.$upgradeContainer = $('#upgrade-container');
	this.$notifications = $('.notification-container');
	this.$codebase = $('#codebase > pre');
	this.lastNumOfLines = 0;
	this.config = config;

	this.init();
};

UI.prototype.updateLinesOfCodeStats = function() {
	var linesOfCode = this.game.GetResource('code').amount.Get();
	var linesOfCodePerSec = this.game.GetResourceRatesPerSecond('code');

	if (linesOfCode > 0) {
		this.$numLinesOfCode.text(formatLinesOfCode(linesOfCode));
		this.scrollCodebase(linesOfCode);
	}

	if (linesOfCodePerSec > 0) {
		this.$numLinesOfCodePerSec.text(formatLinesOfCode(linesOfCodePerSec) + ' / second');
	}

	this.lastNumOfLines = linesOfCode;
};

UI.prototype.updateDollarStats = function() {
	var dollars = this.game.GetResource('money').amount.Get();
	var dollarsPerSec = this.game.GetResourceRatesPerSecond('money');

	if (dollars > 0) {
		this.$numDollars.text(formatDollar(dollars));
	}

	if (dollarsPerSec) {
		this.$numDollarsPerSec.text(formatDollar(dollarsPerSec) + ' / second');
	}
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
			this.updateGenerators();
			this.updateUpgrades();
			this.updatePurchasable(entity, type);
		}
	}, this));

	this.updatePurchasable(entity, type);

	var self = this;
	var $tooltip = $('.purchasable-tooltip-wrapper');
	$div.off('mouseenter').on('mouseenter', function() {
		//clearTimeout(self.tooltipDisappearTimeout);

		$div.off('mousemove').on('mousemove', function(e) {
			var offsetTop = Math.min(Math.max(0, e.pageY - $tooltip.outerHeight() / 2), $(window).height() - $tooltip.outerHeight());
			$tooltip.offset({ top: offsetTop });
		});

		// show tooltip
		var $tooltipContent = $tooltip.find('.inner-border-2');
		$tooltipContent.empty();
		addEl('h4', $tooltipContent, '', entity.describable.GetTitle());
		addEl('p', $tooltipContent, '', entity.describable.GetDescription());
		if (entity instanceof Upgrade || (entity.amount !== undefined && entity.amount.GetMax() > 0)) {
			addEl('p', $tooltipContent, '', entity.describable.GetEffect());
		}

		if (type === 'feature') {
			$tooltip.offset({ left: $div.outerWidth() + self.config.pixelsBetweenTooltip });
		} else if (type === 'team') {
			$tooltip.offset({ left: $div.offset().left - $tooltip.outerWidth() - self.config.pixelsBetweenTooltip });
		} else if (type === 'upgrade') {
			$tooltip.offset({ left: $div.offset().left - $tooltip.outerWidth() - self.config.pixelsBetweenTooltip });
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
	each(this.game.GetGenerators(), function(generator) {
		var $generatorDiv = $('.generator-' + generator.GetName());
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
	}, this);
};

UI.prototype.updateUpgrades = function() {
	each(this.game.GetUpgrades(), function(upgrade) {
		var $generatorDiv = $('.generator-' + upgrade.GetName());
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
	}, this);
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
	}, this.config.notificationFadeDuration);
};

UI.prototype.scrollCodebase = function(numOfLines) {
	var lastNumOfLines = Math.round(this.lastNumOfLines);
	var thisNumOfLines = Math.round(numOfLines);

	// scroll at most 1 line every time
	if (thisNumOfLines > lastNumOfLines) {
		var newTop = parseInt(this.$codebase.css('top')) - 20;
		if (newTop <= -6380) {
			newTop = -380;
		}
		this.$codebase.css('top', newTop + 'px');
	}
};

UI.prototype.setupNavClickHandler = function($link, $toShow) {
	var $mainGameScreen = $('#main-game-screen');
	var $navItems = $('.nav-item');
	var $screens = $('.screen');

	$link.on('click', function() {
		if (!$(this).hasClass('active')) {
			$navItems.removeClass('active');
			$(this).addClass('active');
			$screens.hide();
			$toShow.show();
		} else {
			$(this).removeClass('active');
			$screens.hide();
			$mainGameScreen.show();
		}
	});

};

UI.prototype.setupNavClickHandlers = function() {
	this.setupNavClickHandler($('.nav-achievements'), $('#achievements-screen'));
	this.setupNavClickHandler($('.nav-settings'), $('#settings-screen'));
};

UI.prototype.fillAchievementInfo = function(achievement, $div) {
	$div.empty();
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
};

UI.prototype.showAchievement = function(achievement, $container) {
	var $div = addEl('div', $container, 'locked achievement');
	var $achievementsNav = $('.nav-achievements');
	addEl('div', $div, '', '?');
	achievement.events.on('update', function(achievement) {
		if (achievement.obtainable.GetObtained()) {
			this.fillAchievementInfo(achievement, $div);
			$achievementsNav.show();
		}
	}, this);
	achievement.events.on('obtain', function(achievement) {
		this.showNotification('Achievement Unlocked', achievement.describable.GetTitle() + ': ' +
		achievement.describable.GetDescription(), '');
		$achievementsNav.show();
	}, this);
};

UI.prototype.showAchievements = function() {
	var $achievementsList = $('.achievements-list');
	$achievementsList.empty();
	each(this.game.GetAchievements(), function(achievement) {
		this.showAchievement(achievement, $achievementsList);
	}, this);
};

UI.prototype.setupCodeClickListener = function() {
	//$(document).on('keydown', $.proxy(function (e) {
	//	this.mostRecentKeydown = e.keyCode;
	//}, this));
	//$(document).on('keyup', $.proxy(function (e) {
	//	if (e.keyCode == this.mostRecentKeydown && isPrintable(e.keyCode)) {
	//		this.scrollCodebase(1);
	//		this.game.GetResource('code').amount.Add(1);
	//		this.updateLinesOfCodeStats(GAME);
	//	}
	//}, this));
	$('#write-code-button').on('click', $.proxy(function () {
		this.scrollCodebase(1);
		this.game.GetResource('code').amount.Add(1);
		this.updateLinesOfCodeStats(GAME);
	}, this));
};

UI.prototype.loadGame = function() {
	var savedString = localStorage.getItem('techeon-save');
	if (savedString) {
		GAME.loader.Load(JSON.parse(savedString));
	}
};

UI.prototype.setupSaveGame = function() {
	setInterval(function() {
		var saveObject = GAME.loader.Save();
		localStorage.setItem('techeon-save', JSON.stringify(saveObject));
	}, this.config.saveInterval);
};

UI.prototype.init = function() {
	this.setupPopup();
	this.setupNavClickHandlers();
	this.updateGenerators();
	this.updateUpgrades();
	this.setupCodeClickListener();
	//this.setupSaveGame();
	this.showAchievements();
	sh_highlightDocument();

	this.game.on('render', function() {
		this.updateResources();
	}, this, this.config.updateResourceFrequencyInTicks);
	this.game.on('render', function() {
		this.updateGenerators();
		this.updateUpgrades();
	}, this, this.config.updatePurchasablesFrequencyInTicks);

	//this.loadGame();
};

var ui = new UI(GAME, uiConfig);
GAME.Start();


