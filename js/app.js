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
	this.$codebase = $('#codebase-content');
	this.lastNumOfLines = 0;
	this.config = config;

	this.init();
};

UI.prototype.updateLinesOfCodeStats = function() {
	var linesOfCode = this.game.GetResource('code').amount.GetApprox();
	var linesOfCodePerSec = this.game.GetResourceRatesPerSecond('code');

	if (linesOfCode > 0) {
		this.$numLinesOfCode.text(formatLinesOfCode(linesOfCode));
		this.scrollCodebase(linesOfCode);
	}

	if (linesOfCodePerSec > 0) {
		this.$numLinesOfCodePerSec.text(formatLinesOfCodePerSec(linesOfCodePerSec) + ' / second');
	}

	this.lastNumOfLines = linesOfCode;
};

UI.prototype.updateDollarStats = function() {
	var dollars = this.game.GetResource('money').amount.GetApprox();
	var dollarsPerSec = this.game.GetResourceRatesPerSecond('money');

	if (dollars > 0) {
		this.$numDollars.text(formatDollar(dollars));
	}

	if (dollarsPerSec) {
		this.$numDollarsPerSec.text(formatDollar(dollarsPerSec) + ' / second');
	}
};

UI.prototype.renderTooltip = function(entity, $container) {
	$container.empty();
	addEl('h4', $container, '', entity.describable.GetTitle());
	if (entity instanceof Upgrade || (entity.amount !== undefined && entity.amount.GetMax() > 0)) {
		var effects = entity.describable.GetEffects();
		if (effects.length > 1) {
			var $ul = addEl('ul', $container);
			each(effects, function(effect) {
				addEl('li', $ul, 'effect', effect);
			})
		} else {
			addEl('p', $container, 'effect', effects[0]);
		}
	}
	addEl('p', $container, 'description', entity.describable.GetDescription());
};

UI.prototype.formatPrice = function(entity) {
	if (entity instanceof MoneyGenerator) {
		var price = formatLinesOfCode(entity.purchasable.GetBuyPrice().code);
	} else if (entity instanceof CodeGenerator) {
		var price = formatDollar(entity.purchasable.GetBuyPrice().money);
	} else if (entity instanceof Upgrade) {
		if ($.isEmptyObject(entity.purchasable.GetBuyPrice())) {
			var price = 'Free';
		} else {
			var price = formatDollar(entity.purchasable.GetBuyPrice().money);
		}
	}

	return price;
};

UI.prototype.setupPurchasable = function(entity) {
	if (entity instanceof MoneyGenerator) {
		var $container = this.$featureContainer;
	} else if (entity instanceof CodeGenerator) {
		var $container = this.$teamContainer;
	} else if (entity instanceof Upgrade) {
		var $container = this.$upgradeContainer;
	}

	if ($container) {
		var className = entity.purchasable.Affordable() ? 'purchasable' : 'purchasable unaffordable';
		var $div = addEl('div', $container, className).hide();

		function showPurchasable(entity) {
			$container.css('visibility', 'visible');
			addEl('h4', $div, '', entity.describable.GetTitle());
			var $ownedCount = addEl('div', $div, 'purchasable-owned-count');
			addEl('div', $div, 'price', this.formatPrice(entity));
			$div.on('click', $.proxy(function() {
				entity.purchasable.Buy();
			}, this));

			if (entity.amount) {
				var amount = entity.amount.GetApprox() || '';
				$ownedCount.text(amount);
			}
			var $tooltip = $('.purchasable-tooltip-wrapper');
			var $tooltipContent = $tooltip.find('.inner-border-2');
			var updateTooltip = $.proxy(function() {
				this.renderTooltip(entity, $tooltipContent);
			}, this);

			$div.on('mouseenter', $.proxy(function() {
				$div.off('mousemove').on('mousemove', function(e) {
					var offsetTop = Math.min(Math.max(0, e.pageY - $tooltip.outerHeight() / 2), $(window).height() - $tooltip.outerHeight());
					$tooltip.offset({ top: offsetTop });
				});
				this.renderTooltip(entity, $tooltipContent);
				entity.on('rate_change', updateTooltip);
				if (entity instanceof MoneyGenerator) {
					$tooltip.offset({ left: $div.outerWidth() + this.config.pixelsBetweenTooltip });
				} else if (entity instanceof CodeGenerator) {
					$tooltip.offset({ left: $div.offset().left - $tooltip.outerWidth() - this.config.pixelsBetweenTooltip });
				} else if (entity instanceof Upgrade) {
					$tooltip.offset({ left: $div.offset().left - $tooltip.outerWidth() - this.config.pixelsBetweenTooltip });
				}
				$tooltip.show();
			}, this));

			$div.on('mouseleave', function() {
				$tooltip.offset({ left: 0, top: 0 }).hide();
				$div.off('mousemove');
				entity.off('amount_change', updateTooltip);
			});

			$div.show();
		}

		function updatePurchasable(entity) {
			if (entity.amount) {
				var amount = entity.amount.GetApprox() || '';
				$div.find('.purchasable-owned-count').text(amount);
			}
			$div.find('.price').text(this.formatPrice(entity));
		}

		//TODO: Fix this
		var shown = false;
		function updatePurchasableAvailability(entity) {
			if (!shown && entity.restrictable.GetLevel() >= 2) {
				shown = true;
				showPurchasable.call(this, entity);
			} else if (entity.restrictable.GetLevel() >= 1) {
				//showPurchasable.call(this, entity);
				//TODO: Show black shadow?
			}
		}

		updatePurchasableAvailability.call(this, entity);

		entity.on('available_change', updatePurchasableAvailability, this);
		entity.on('affordable', function() {
			$div.removeClass('unaffordable');
		}, this);
		entity.on('unaffordable', function() {
			$div.addClass('unaffordable');
		});
		entity.on('rate_change', updatePurchasable, this);

		if (entity instanceof Upgrade) {
			entity.on('obtain', function() {
				$div.hide();
			});
		}
	}
};

UI.prototype.setupGenerators = function() {
	each(this.game.GetGenerators(), function(generator) {
		this.setupPurchasable(generator);
	}, this);
};

UI.prototype.setupUpgrades = function() {
	each(this.game.GetUpgrades(), function(upgrade) {
		this.setupPurchasable(upgrade);
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

UI.prototype.showNotification = function(title, text, icon, sticky) {
	var $notification = addEl('div', this.$notifications, 'notification');
	addEl('span', $notification, 'close-btn').on('click', function() {
		$notification.remove();
	});
	addEl('img', $notification, '', '', {
		src: icon,
		alt: title
	});
	var $achievement = addEl('div', $notification);
	addEl('h4', $achievement, '', title);
	addEl('p', $achievement, '', text);

	if (!sticky) {
		setTimeout(function() {
			$notification.remove();
		}, this.config.notificationFadeDuration);
	}
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
		this.showNotification(
			'Achievement Unlocked',
			achievement.describable.GetTitle() + ': ' + achievement.describable.GetDescription(),
			'http://th08.deviantart.net/fs71/200H/i/2013/355/f/e/doge_by_leftyninja-d6ytne2.jpg'
		);
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
		this.game.GetGenerator('click').Click();
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
	this.setupGenerators();
	this.setupUpgrades();
	this.setupCodeClickListener();
	//this.setupSaveGame();
	this.showAchievements();
	sh_highlightDocument();

	this.game.on('render', function() {
		this.updateLinesOfCodeStats();
		this.updateDollarStats();
	}, this, this.config.updateResourceFrequencyInTicks);

	//this.loadGame();
};

var ui = new UI(GAME, uiConfig);
GAME.Start();


