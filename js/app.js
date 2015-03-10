var uiConfig = {
	saveInterval: 2 * 60 * 1000,
	updateResourceFrequencyInTicks: 1,
	updatePurchasablesFrequencyInTicks: 25,
	pixelsBetweenTooltip: 0,
	scrollCodebaseLimit: 50,
	notificationFadeDuration: 5000
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
	this.$clickCount = $('#click-count');
	this.lastNumOfLines = 0;
	this.codebaseTop = 0;
	this.config = config;
	this.isCtrlDown = false;
	this.clickCountAnimationRunning = false;
	this.playWhipSound = true;

	this.init();
};

UI.prototype.updateLinesOfCodeStats = function() {
	var code = this.game.GetResource('code');
	var linesOfCode = code.amount.GetApprox();
	var linesOfCodePerSec = code.amount.GetRatePerSec();

	if (linesOfCode > 0) {
		this.$numLinesOfCode.html(formatLinesOfCode(linesOfCode));
		this.scrollCodebase(linesOfCode);
	}

	if (linesOfCodePerSec > 0) {
		this.$numLinesOfCodePerSec.html(formatLinesOfCodePerSec(linesOfCodePerSec) + ' / second');
	}

	this.lastNumOfLines = linesOfCode;
};

UI.prototype.updateDollarStats = function() {
	var money = this.game.GetResource('money');
	var dollars = money.amount.GetApprox();
	var dollarsPerSec = money.amount.GetRatePerSec();

	if (dollars > 0) {
		this.$numDollars.html(formatDollar(dollars));
	}

	if (dollarsPerSec) {
		this.$numDollarsPerSec.html(formatDollar(dollarsPerSec) + ' / second');
	}
};

UI.prototype.renderTooltip = function(entity, $container) {
	$container.empty();
	addEl('h4', $container, '', entity.describable.GetTitle());
	if (entity instanceof Upgrade || entity.amount === undefined || entity.amount.GetMax() > 0) {
		var effects = entity.describable.GetEffects();
		if (effects.length == 1) {
			addEl('p', $container, 'effect', effects[0]);
		}
		else if (effects.length > 1) {
			var $ul = addEl('ul', $container);
			each(effects, function(effect) {
				addEl('li', $ul, 'effect', effect);
			});
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
		} else if (entity.purchasable.GetBuyPrice().money) {
			var price = formatDollar(entity.purchasable.GetBuyPrice().money);
		} else if (entity.purchasable.GetBuyPrice().code) {
			var price = formatLinesOfCode(entity.purchasable.GetBuyPrice().code);
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
			addEl('h4', $div, 'purchasable-title', entity.describable.GetTitle());
			var $ownedCount = addEl('div', $div, 'purchasable-owned-count');
			if (entity.purchasable.GetBuyPrice().money) {
				addEl('div', $div, 'price cash', this.formatPrice(entity));
			} else if (entity.purchasable.GetBuyPrice().code) {
				addEl('div', $div, 'price code', this.formatPrice(entity));
			} else {
				addEl('div', $div, 'price', this.formatPrice(entity));
			}

			$div.on('click', $.proxy(function() {
				// Buy ten
				if (this.isCtrlDown) {
					for (var i = 0; i < 10; i++) {
						entity.purchasable.Buy();
					}
				} else {
					entity.purchasable.Buy();
				}
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
					$tooltip.offset({top: offsetTop});
				});
				this.renderTooltip(entity, $tooltipContent);
				entity.on('rate_change', updateTooltip);
				if (entity instanceof MoneyGenerator) {
					$tooltip.offset({left: $div.outerWidth() + this.config.pixelsBetweenTooltip});
				} else if (entity instanceof CodeGenerator) {
					$tooltip.offset({left: $div.offset().left - $tooltip.outerWidth() - this.config.pixelsBetweenTooltip});
				} else if (entity instanceof Upgrade) {
					$tooltip.offset({left: $div.offset().left - $tooltip.outerWidth() - this.config.pixelsBetweenTooltip});
				}
				$tooltip.show();
			}, this));

			$div.on('mouseleave', function() {
				$tooltip.offset({left: 0, top: 0}).hide();
				$div.off('mousemove');
				entity.off('amount_change', updateTooltip);
			});

			$div.show();
		}

		function updatePurchasable(entity) {
			$div.find('.purchasable-title').html(entity.describable.GetTitle());
			if (entity.amount) {
				var amount = entity.amount.GetApprox() || '';
				$div.find('.purchasable-owned-count').html(amount);
			}
			if(this == window) {
				console.log(entity.GetName(), this);
			}
			$div.find('.price').html(this.formatPrice(entity));
		}

		function updatePurchasableAvailability(entity) {
			if (entity instanceof Upgrade && entity.obtainable.GetObtained()) {
				$div.hide();
			} else if (entity.restrictable.GetLevel() >= 2) {
				updatePurchasable.call(this, entity);
				$div.show();
			} else if (entity.restrictable.GetLevel() >= 1) {
				if (!entity instanceof Upgrade) {
					$div.find('purchasable-title').html('???');
					$div.find('.price').html('???');
					$div.show();
				}
			} else {
				$div.hide();
			}
		}

		showPurchasable.call(this, entity);
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
			entity.on('update', function() {
				updatePurchasableAvailability.call(this, entity);
			}, this);
		}
	}
};

UI.prototype.setupGenerators = function() {
	this.$teamContainer.hide();
	each(this.game.GetGenerators(), function(generator) {
		this.setupPurchasable(generator);
	}, this);
	this.game.data.upgrades.hire.on('update', function(hire) {
		if (hire.obtainable.GetObtained()) {
			this.$teamContainer.show();
		} else {
			this.$teamContainer.hide();
		}
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
	$('.wrapper, .close-btn').on('click', function() {
		$popup.hide();
	});

	// Allow user to close popup with ESC key
	$(document).keydown(function(e) {
		if (e.keyCode == 27) {
			$popup.hide();
		}
	});

	$('.popup-content').click(function(e) {
		e.stopPropagation();
	});
};

UI.prototype.showNotification = function(title, text, icon, sticky) {
	var $notification = addEl('div', this.$notifications, 'notification');
	addEl('span', $notification, 'close-btn').on('click', function() {
		$notification.remove();
	});
	if (icon) {
		addEl('img', $notification, '', '', {
			src: icon,
			alt: title
		});
	}
	var $achievement = addEl('div', $notification);
	addEl('h4', $achievement, '', title);
	if (text) {
		addEl('p', $achievement, '', text);
	}

	if (!sticky) {
		setTimeout(function() {
			$notification.remove();
		}, this.config.notificationFadeDuration);
	}
};

UI.prototype.scrollCodebase = function(numOfLines) {
	var lastNumOfLines = Math.ceil(this.lastNumOfLines);
	var thisNumOfLines = Math.ceil(numOfLines);

	// scroll at most 1 line every time
	if (thisNumOfLines > lastNumOfLines) {
		this.codebaseTop = this.codebaseTop - 20;
		if (this.codebaseTop <= -6380) {
			this.codebaseTop = -380;
		}
		this.$codebase[0].style.top = this.codebaseTop + 'px';
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
	this.setupNavClickHandler($('.nav-stats'), $('#stats-screen'));
	this.setupNavClickHandler($('.nav-settings'), $('#settings-screen'));
	this.setupNavClickHandler($('.nav-about'), $('#about-screen'));
};

UI.prototype.fillAchievementInfo = function(achievement, $div) {
	$div.empty();
	addEl('img', $div, '', '', {
		src: 'http://th08.deviantart.net/fs71/200H/i/2013/355/f/e/doge_by_leftyninja-d6ytne2.jpg',
		alt: achievement.describable.GetTitle()
	});
	var $tooltip = $('.purchasable-tooltip-wrapper');
	$div.off('mouseenter').on('mouseenter', $.proxy(function() {
		$div.off('mousemove').on('mousemove', function(e) {
			var offsetTop = Math.min(Math.max(0, e.pageY - $tooltip.outerHeight() / 2), $(window).height() - $tooltip.outerHeight());
			var offsetLeft = Math.min(Math.max(0, e.pageX + 30), $(window).width() - $tooltip.outerWidth());
			$tooltip.offset({top: offsetTop, left: offsetLeft});
		});

		// show tooltip
		var $tooltipContent = $tooltip.find('.inner-border-2');
		this.renderTooltip(achievement, $tooltipContent);
		$tooltip.show();
	}, this));

	$div.off('mouseleave').on('mouseleave', function() {
		$tooltip.offset({left: 0, top: 0}).hide();
		$div.off('mousemove');
	});
};

UI.prototype.updateAchievementProgress = function() {
	function hasObtained(achievement) {
		return achievement.obtainable.GetObtained();
	}

	var total = this.game.GetAchievements().length;
	var obtained = this.game.GetAchievements().filter(hasObtained).length;
	var progress = Math.floor(obtained * 100 / total) + '%';

	$('#obtained-achievement-count').html(obtained);
	$('#total-achievement-count').html(total);
	$('#achievement-progress').html(progress);
};

UI.prototype.showAchievement = function(achievement, $container) {
	var $div = addEl('div', $container, 'locked achievement');
	var $achievementsNav = $('.nav-stats');
	addEl('div', $div, '', '?');
	achievement.events.on('update', function(achievement) {
		if (achievement.obtainable.GetObtained()) {
			this.fillAchievementInfo(achievement, $div);
			$achievementsNav.show();
		}
		this.updateAchievementProgress();
	}, this);
	achievement.events.on('obtain', function(achievement) {
		var text = achievement.describable.GetTitle();
		var description = achievement.describable.GetDescription();
		if (description) {
			text += ': ' + description;
		}
		this.showNotification(
			'Achievement Unlocked',
			 text,
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
	this.updateAchievementProgress();
};

UI.prototype.setupCodeClickListener = function() {
	$('#write-code-button').on('click', $.proxy(function(e) {
		this.game.GetGenerator('click').Click();
		var linesPerClick = this.game.GetGenerator('click').GetRate('code');
		if (!this.clickCountAnimationRunning) {
			this.clickCountAnimationRunning = true;
			this.$clickCount.html('+' + linesPerClick).offset({left: e.pageX + 10, top: e.pageY - 20}).show();
			this.$clickCount.css('opacity', 1).animate({
				top: '-=10',
				opacity: 0
			}, 150, $.proxy(function() {
				this.$clickCount.css({left: 0, top: 0, opacity: 0});
				this.clickCountAnimationRunning = false;
			}, this));
		}

	}, this));
};

UI.prototype.loadGame = function() {
	var savedString = localStorage.getItem('techeon-save');
	if (savedString) {
		GAME.loader.Load(JSON.parse(savedString));
	}
};

UI.prototype.saveGame = function() {
	var saveObject = GAME.loader.Save();
	localStorage.setItem('techeon-save', JSON.stringify(saveObject));
	this.showNotification('Game saved');
};

UI.prototype.setupSaveGame = function() {
	$(document).on('keydown', $.proxy(function(e) {
		// Ctrl + S to save
		if (e.keyCode === 83 && this.isCtrlDown) {
			this.saveGame();
			e.preventDefault();
			return false;
		}
	}, this));
	setInterval($.proxy(this.saveGame, this), this.config.saveInterval);
};

UI.prototype.setupBuyTen = function() {
	$(document).on('keydown', $.proxy(function(e) {
		if (e.keyCode === 17) {
			this.isCtrlDown = true;
		}
	}, this));
	$(document).on('keyup', $.proxy(function(e) {
		if(e.keyCode === 17 && this.isCtrlDown) {
			this.isCtrlDown = false;
		}
	}, this));
};

UI.prototype.setupInternWhippingRelated = function() {
	document.getElementById('whip-sound').volume = 0.1;
	this.game.GetGenerator('intern').on('modifier_activate', function(entity, modifier) {
		if (modifier.name == 'whip' && this.playWhipSound) {
			document.getElementById('whip-sound').play();
		}
	}, this);

	this.game.GetGenerator('intern').on('escape', function(entity) {
		this.showNotification('An intern has escaped', 'Apparently people don\'t like being whipped.',
			'http://th08.deviantart.net/fs71/200H/i/2013/355/f/e/doge_by_leftyninja-d6ytne2.jpg', true);
	}, this);
};

UI.prototype.setupSettings = function() {
	var self = this;
	$('#save-button').on('click', $.proxy(function() {
		this.saveGame();
	}, this));
	$('#reset-button').on('click', $.proxy(function() {
		// TODO: reset game without refreshing
	}));
	$('#turn-off-whip-sound').on('click', function() {
		self.playWhipSound = !this.checked;
	});
};

UI.prototype.init = function() {
	this.setupBuyTen();
	this.setupPopup();
	this.setupInternWhippingRelated();
	this.setupNavClickHandlers();
	this.setupGenerators();
	this.setupUpgrades();
	this.setupCodeClickListener();
	this.setupSettings();
	this.showAchievements();
	sh_highlightDocument();

	this.game.on('render', function() {
		this.updateLinesOfCodeStats();
		this.updateDollarStats();
	}, this, this.config.updateResourceFrequencyInTicks);

	this.loadGame();
	this.setupSaveGame();
};

var GAME = CreateGame();
var ui = new UI(GAME, uiConfig);
GAME.Start();


