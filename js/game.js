var Game = function() {
	GameEngine.call(this);

	this.data.resources = {};
	this.content.resources = [];

	this.data.generators = {};
	this.content.generators = [];

	this.data.upgrades = {};
	this.content.upgrades = [];

	this.data.achievements = {};
	this.content.achievements = [];
};
extend(Game, GameEngine, {
	GetResourceRatesPerSecond: function(resource) {
		return this.GetResourceRatesPerTick(resource) * this.GetTicksPerSecond();
	},
	GetResourceRatesPerTick: function(resource) {
		var rate = 0;
		each(this.content.generators, function(generator) {
			if (!generator.IsManual()) {
				rate += generator.GetRate(resource);
			}
		});
		return rate;
	},
	AddResource: function(entity) {
		return this.AddEntity('resources', entity);
	},
	AddGenerator: function(entity) {
		return this.AddEntity('generators', entity);
	},
	AddUpgrade: function(entity) {
		return this.AddEntity('upgrades', entity);
	},
	AddAchievement: function(entity) {
		return this.AddEntity('achievements', entity);
	},
	GetResources: function() {
		return this.content.resources;
	},
	GetGenerators: function() {
		return this.content.generators;
	},
	GetUpgrades: function() {
		return this.content.upgrades;
	},
	GetAchievements: function() {
		return this.content.achievements;
	},
	GetResource: function(name) {
		return this.data.resources[name];
	},
	GetGenerator: function(name) {
		return this.data.generators[name];
	},
	GetUpgrade: function(name) {
		return this.data.upgrades[name];
	},
	GetAchievement: function(name) {
		return this.data.achievements[name];
	}
});

var TUNING = {
	TICKS_PER_ACHIEVEMENT_CHECK: 5,

	PURCHASABLE_DEFAULT_SELL_FACTOR: 0.75,
	PURCHASABLE_DEFAULT_RESTRICT_FACTOR: 0.8
};

/**
 * Purchasable
 */
var Purchasable = function(entity) {
	Component.call(this, entity);
	entity.purchasable = this;
	this.buyPrice = {};
	this.sellPrice = {};
	this.affordable = false;
	this.entity.bridge('buy', 'update');
	this.entity.bridge('sell', 'update');
	this.entity.bridge('affordable', 'update');
	this.entity.bridge('unaffordable', 'update');
	this.entity.game.on('tick', this.UpdateAffordable, this);
};
extend(Purchasable, Component, {
	SetBuyPrice: function(resource, price) {
		this.buyPrice[resource] = price;
		if (!this.sellPrice[resource]) {
			this.sellPrice[resource] = price * TUNING.PURCHASABLE_DEFAULT_SELL_FACTOR;
		}
		return this.entity;
	},
	SetSellPrice: function(resource, price) {
		this.sellPrice[resource] = price;
		return this.entity;
	},
	UpdateAffordable: function() {
		var affordable = each(this.GetBuyPrice(), function(value, resource) {
			return this.entity.game.GetResource(resource).amount.Get() >= value;
		}, this);
		if (this.affordable != affordable) {
			this.affordable = affordable;
			if (affordable) {
				this.entity.trigger('affordable', this.entity);
			} else {
				this.entity.trigger('unaffordable', this.entity);
			}
		}
	},
	Affordable: function() {
		return this.affordable;
	},
	GetBaseBuyPrice: function() {
		return this.buyPrice;
	},
	GetBuyPrice: function() {
		return this.GetBaseBuyPrice();
	},
	Buy: function() {
		if (!this.Affordable()) {
			return;
		}
		var price = this.GetBuyPrice();
		for (var resource in price) {
			this.entity.game.GetResource(resource).amount.Remove(price[resource]);
		}
		this.entity.trigger('buy', this.entity);
	},
	GetBaseSellPrice: function() {
		return this.sellPrice;
	},
	GetSellPrice: function() {
		return this.GetBaseSellPrice();
	},
	Sell: function() {
		var price = this.GetSellPrice();
		for (var resource in price) {
			this.entity.game.data.resources[resource].amount.Add(price[resource]);
		}
		this.entity.trigger('sell', this.entity);
	},
	CanSell: function() {
		return true;
	}
});

/**
 * PurchasableRestrictable
 */
var PurchasableRestrictable = function(entity) {
	Component.call(this, entity);
	entity.AddComponent(Purchasable);
	entity.AddComponent(Restrictable);
	entity.purchasablerestrictable = this;
};
extend(PurchasableRestrictable, Component, {
	AddDefaultPriceRestriction: function() {
		each(this.entity.purchasable.GetBaseBuyPrice(), function(price, resource) {
			this.entity.restrictable.AddRestriction(
				new AmountRestriction(this.entity.game,
					this.entity.game.GetResource(resource),
					2,
					price * TUNING.PURCHASABLE_DEFAULT_RESTRICT_FACTOR));
		}, this);
		return this.entity;
	}
});


/**
 * AmountPurchasable
 */
var AmountPurchasable = function(entity) {
	Component.call(this, entity);
	entity.AddComponent(Amount);
	entity.AddComponent(Purchasable);
	entity.amountpurchasable = this;

	this.entity.purchasable.CanSell = this.CanSell;
	this.entity.on('buy', this.OnBuy, this);
	this.entity.on('sell', this.OnSell, this);
};
extend(AmountPurchasable, Component, {
	OnBuy: function() {
		this.entity.amount.Add(1);
	},
	OnSell: function() {
		this.entity.amount.Remove(1);
	},
	CanSell: function() {
		return this.amount.Get() > 0;
	}
});

/**
 * ObtainablePurchasable
 */
var ObtainablePurchasable = function(entity) {
	Component.call(this, entity);
	entity.AddComponent(Obtainable);
	entity.AddComponent(Purchasable);
	entity.obtainablepurchasable = this;

	this.entity.purchasable.CanSell = this.CanSell;
	this.entity.on('buy', this.OnBuy, this);
	this.entity.on('sell', this.OnSell, this);
};
extend(ObtainablePurchasable, Component, {
	OnBuy: function() {
		this.entity.obtainable.Obtain();
	},
	OnSell: function() {
		this.entity.obtainable.UnObtain();
	},
	CanSell: function() {
		return this.obtainable.GetObtained();
	}
});

/**
 * ExponentialAmountPurchasable
 */
var ExponentialAmountPurchasable = function(entity) {
	Component.call(this, entity);
	entity.AddComponent(Amount);
	entity.AddComponent(Purchasable);
	this.entity.exponentialamountpurchasable = this;
	this.entity.purchasable.GetSellPrice = bind(this.GetSellPrice, this);
	this.entity.purchasable.GetBuyPrice = bind(this.GetBuyPrice, this);
	this.entity.bridge('buy', 'price_change');
	this.entity.bridge('sell', 'price_change');
	this.entity.bridge('load', 'price_change');
	this.entity.bridge('price_change', 'update');

	this.buyPrice = {};
	this.sellPrice = {};
	this.factor = 1.15;
};
extend(ExponentialAmountPurchasable, Component, {
	SetExponentialFactor: function(factor) {
		this.factor = factor;
		return this.entity;
	},
	GetBuyPrice: function() {
		var price = this.entity.purchasable.GetBaseBuyPrice();
		for (var key in price) {
			this.buyPrice[key] = Math.ceil(price[key] * Math.pow(this.factor, this.entity.amount.Get()));
		}
		return this.buyPrice;
	},
	GetSellPrice: function() {
		var price = this.entity.purchasable.GetBaseSellPrice();
		for (var key in price) {
			this.sellPrice[key] = Math.ceil(price[key] * Math.pow(this.factor, this.entity.amount.Get()));
		}
		return this.sellPrice;
	}
});


/**
 * Resource
 */
var Resource = function(game, name) {
	Entity.call(this, game, name);
	this.AddComponent(Amount);
	this.AddComponent(Multiplier);
	this.rateFormatter = null;
	this.amount.StartApprox();
	this.amount.TrackTickRate();
};
extend(Resource, Entity, {
	Generate: function(amount) {
		this.amount.Generate(amount);
	},
	Reward: function(amount) {
		this.amount.Add(amount);
	},
	SetRateFormatter: function(rateFormatter) {
		this.rateFormatter = rateFormatter;
		return this;
	}
});

/**
 * Generator
 */
var Generator = function(game, name, manual) {
	Entity.call(this, game, name);
	this.AddComponent(Amount);
	this.AddComponent(Multiplier);
	this.AddComponent(Purchasable);
	this.AddComponent(Restrictable);
	this.AddComponent(AmountPurchasable);
	this.AddComponent(ExponentialAmountPurchasable);
	this.AddComponent(PurchasableRestrictable);
	this.bridge('multiplier_change', 'rate_change');
	this.bridge('amount_change', 'rate_change');
	this.bridge('load', 'rate_change');
	this.bridge('rate_change', 'update');
	this.on('rate_change', this.UpdateEffect, this);
	this.manual = manual;
	this.rates = {};
	this.generated = {};
	game.on('tick', this.OnTick, this);
	this.loader.AddElement('generated');
};
extend(Generator, Entity, {
	SetRateSecond: function(resource, rate) {
		return this.SetRate(resource, this.game.GetRateTickFromSecond(rate));
	},
	SetRate: function(resource, rate) {
		if (rate != 0) {
			this.rates[resource] = rate;
			if (!this.generated[resource]) {
				this.generated[resource] = 0;
			}
			this.game.GetResource(resource).on('multiplier_change', this.RateChanged, this);
		}
		else {
			delete this.rates[resource];
			if (this.generated[resource] == 0) {
				delete this.generated[resource];
			}
			this.game.GetResource(resource).off('multiplier_change', this.RateChanged);
		}
		this.RateChanged();
		return this;
	},
	AddRate: function(resource, rate) {
		if (rate != 0) {
			this.rates[resource] += rate;
		}
		this.RateChanged();
		return this;
	},
	RateChanged: function() {
		this.trigger('rate_change', this);
	},
	UpdateEffect: function() {
		this.describable.ClearEffects();
		for (var resource in this.rates) {
			var rateFormatter = this.game.GetResource(resource).rateFormatter;
			if (rateFormatter) {
				this.describable.AddEffect(rateFormatter(this.GetSingleRate(resource)));
				if (this.amount.Get() > 1) {
					this.describable.AddEffect("Total " + rateFormatter(this.GetRate(resource)));
				}
			}
		}
	},
	GetSingleRate: function(resource) {
		var rate = this.rates[resource];
		if (!rate) {
			return 0;
		}
		return rate * this.multiplier.Get() * this.game.GetResource(resource).multiplier.Get();
	},
	GetRate: function(resource) {
		return this.amount.Get() * this.GetSingleRate(resource);
	},
	GetGenerated: function(resource) {
		return this.generated[resource];
	},
	IsManual: function() {
		return this.manual;
	},
	OnTick: function(no_generate) {
		for (var resource in this.rates) {
			var result = this.GetRate(resource);
			this.trigger('generate_resource', this, resource, result);
			this.generated[resource] += result;
			if (no_generate === true) {
				this.game.data.resources[resource].Reward(result);
			}
			else {
				this.game.data.resources[resource].Generate(result);
			}
		}
	}
});

/**
 * Upgrade
 */
var Upgrade = function(game, name) {
	Entity.call(this, game, name);
	this.AddComponent(Obtainable);
	this.AddComponent(Purchasable);
	this.AddComponent(Rewardable);
	this.AddComponent(Restrictable);
	this.AddComponent(ObtainablePurchasable);
	this.AddComponent(PurchasableRestrictable);
	this.on('obtain', this.OnObtain, this);
};
extend(Upgrade, Entity, {
	OnObtain: function() {
		this.rewardable.GiveRewards();
	}
});

/**
 * Rewards
 */
var ResourceReward = function(game, resource, amount) {
	Reward.call(this, game);
	this.resource = resource;
	this.amount = amount;
};
extend(ResourceReward, Reward, {
	Reward: function() {
		this.resource.Reward(this.amount);
		this.game.trigger('reward_resource', this, this.resource, this.amount);
	}
});
var BaseRateReward = function(game, generator, resource, amount) {
	Reward.call(this, game);
	this.generator = generator;
	this.resource = resource;
	this.amount = amount;
};
extend(BaseRateReward, Reward, {
	Reward: function() {
		this.generator.AddRate(this.resource, this.amount);
		this.game.trigger('reward_baserate', this, this.generator, this.resource, this.amount);
	}
});
var MultiplierReward = function(game, entity, multiplier) {
	Reward.call(this, game);
	this.entity = entity;
	this.multiplier = multiplier;
};
extend(MultiplierReward, Reward, {
	Reward: function() {
		this.entity.multiplier.Mult(this.multiplier);
		this.game.trigger('reward_multiplier', this, this.entity, this.multiplier);
	}
});
var ModifierReward = function(game, entity, modifier, upgrade) {
	Reward.call(this, game);
	this.entity = entity;
	this.modifier = modifier;
	this.upgrade = upgrade;
};
extend(ModifierReward, Reward, {
	Reward: function() {
		this.entity.modifiable.AddModifier(this.modifier);
		this.game.trigger('reward_modifier', this, this.entity, this.modifier);
		if (this.upgrade) {
			this.entity.on('modifier_remove', function(entity, modifier) {
				if (modifier === this.modifier) {
					this.upgrade.obtainable.UnObtain();
				}
			}, this);
		}
	}
});

/**
 * Achievement
 */
var Achievement = function(game, name) {
	Entity.call(this, game, name);
	this.AddComponent(Obtainable);
};
extend(Achievement, Entity, {});

var AutocheckAchievement = function(game, name) {
	Achievement.call(this, game, name);
	game.on('tick', this.Check, this, TUNING.TICKS_PER_ACHIEVEMENT_CHECK);
};
extend(AutocheckAchievement, Achievement, {
	Check: function() {
		if (!this.obtainable.GetObtained()) {
			this.CheckAchievement();
		}
	},
	CheckAchievement: function() {

	}
});

var AmountAchievement = function(game, name, entity, value) {
	AutocheckAchievement.call(this, game, name);
	this.entity = entity;
	this.value = value;
};
extend(AmountAchievement, AutocheckAchievement, {
	CheckAchievement: function() {
		if (this.entity.amount.GetMax() >= this.value) {
			this.obtainable.Obtain();
		}
	},
	AddDefaultPurchaseEffect: function() {
		var name = (this.value > 1 ? this.entity.describable.GetPlural() : this.entity.describable.GetTitle());
		this.describable.AddEffect('Purchase ' + this.value + ' ' + name + '.');
		return this;
	},
	AddDefaultProduceEffect: function() {
		var name = (this.value > 1 ? this.entity.describable.GetPlural() : this.entity.describable.GetTitle());
		if (name == '$') {
			this.describable.AddEffect('Make $ ' + readableBigNumber(this.value, 0, 0) + '.');
		}
		else {
			this.describable.AddEffect('Produce ' + readableBigNumber(Math.ceil(this.value), 0, 0) + ' ' + name + '.');
		}
		return this;
	}
});

var ObtainableAchievement = function(game, name, entity) {
	Achievement.call(this, game, name);
	this.entity = entity;
	this.entity.on('obtain', this.OnObtain, this);
};
extend(ObtainableAchievement, Achievement, {
	OnObtain: function() {
		this.obtainable.Obtain();
	}
});
