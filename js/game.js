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
	this.restrictions = [];
	this.entity.bridge('buy', 'update');
	this.entity.bridge('sell', 'update');
};
extend(Purchasable, Component, {
	SetBuyPrice: function(resource, price) {
		this.buyPrice[resource] = price;
		if (!this.sellPrice[resource]) {
			this.sellPrice[resource] = price * TUNING.PURCHASABLE_DEFAULT_SELL_FACTOR;
		}
		return this.entity;
	},
	SetDefaultRestriction: function() {
		each(this.buyPrice, function(price, resource) {
			this.AddRestriction(new AmountRestriction(this.entity.game, this.entity.game.GetResource(resource),
				price * TUNING.PURCHASABLE_DEFAULT_RESTRICT_FACTOR));
		}, this);
		return this.entity;
	},
	AddRestriction: function(restriction) {
		this.restrictions.push(restriction);
		return this.entity;
	},
	ClearRestrictions: function() {
		this.restrictions.clear();
		return this.entity;
	},
	SetSellPrice: function(resource, price) {
		this.sellPrice[resource] = price;
		return this.entity;
	},
	Available: function() {
		return each(this.restrictions, function(restriction) {
			return truefalse(restriction.Check());
		}, this);
	},
	CanBuy: function() {
		var price = this.GetBuyPrice();
		for (var resource in price) {
			var cost = price[resource];
			if (this.entity.game.GetResource(resource).amount.Get() < cost) {
				return false;
			}
		}
		return true;
	},
	GetBaseBuyPrice: function() {
		return this.buyPrice;
	},
	GetBuyPrice: function() {
		return this.GetBaseBuyPrice();
	},
	Buy: function() {
		if (!this.CanBuy()) {
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
	entity.AddComponent(AmountPurchasable);
	this.entity.exponentialamountpurchasable = this;
	this.entity.purchasable.GetSellPrice = bind(this.GetSellPrice, this);
	this.entity.purchasable.GetBuyPrice = bind(this.GetBuyPrice, this);
	this.entity.on('buy', this.TriggerPriceChange, this);
	this.entity.on('sell', this.TriggerPriceChange, this);
	this.entity.on('load', this.TriggerPriceChange, this);
	this.entity.bridge('price_change', 'update');

	this.buyPrice = {};
	this.sellPrice = {};
	this.factor = 1.15;
};
extend(ExponentialAmountPurchasable, Component, {
	SetExponentialFactor: function(factor) {
		this.factor = factor;
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
	},
	TriggerPriceChange: function() {
		this.entity.trigger('price_change', this.entity);
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
};
extend(Resource, Entity, {
	Generate: function(amount) {
		this.amount.Add(amount);
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
	this.AddComponent(ExponentialAmountPurchasable);
	this.AddComponent(Multiplier);
	this.bridge('multiplier_change', 'rate_change');
	this.bridge('amount_change', 'rate_change');
	this.bridge('load', 'rate_change');
	this.bridge('rate_change', 'update');
	this.on('rate_change', this.UpdateEffect, this);
	this.manual = manual;
	this.rates = {};
	this.generated = {};
	if (!this.manual) {
		game.on('tick', this.OnTick, this);
	}
	this.loader.AddElement('rates').AddElement('multipliers').AddElement('generated');
};
extend(Generator, Entity, {
	SetRateSecond: function(resource, rate) {
		return this.SetRate(resource, this.game.GetRateTickFromSecond(rate));
	},
	SetRate: function(resource, rate) {
		if (rate != 0) {
			this.rates[resource] = rate;
			this.generated[resource] = 0;
			this.game.GetResource(resource).on('multiplier_change', this.RateChanged, this);
		}
		else {
			delete this.rates[resource];
			if (this.generated[resource] == 0) {
				delete this.generated[resource];
			}
			this.game.GetResource(resource).off('multiplier_change', this.RateChanged);
		}
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
				this.describable.AddEffect(rateFormatter(this.GetRate(resource)));
			}
		}
	},
	GetRate: function(resource) {
		var rate = this.rates[resource];
		if (!rate) {
			return 0;
		}
		return this.amount.Get() * rate * this.multiplier.Get() * this.game.GetResource(resource).multiplier.Get();
	},
	GetGenerated: function(resource) {
		return this.generated[resource];
	},
	IsManual: function() {
		return this.manual;
	},
	OnTick: function() {
		for (var resource in this.rates) {
			var result = this.GetRate(resource);
			this.trigger('generate_resource', this, resource, result);
			this.generated[resource] += result;
			this.game.data.resources[resource].Generate(result);
		}
	}
});

var ClickGenerator = function(game, name, resource) {
	Generator.call(this, game, name, true);
	this.resource = resource;
	game.on('tick', this.UpdateRate, this, 10);
};
extend(ClickGenerator, Generator, {
	UpdateRate: function() {
		this.amount.Set(Math.max(this.game.GetResourceRatesPerSecond(this.resource) / 5, 1));
	},
	Click: function() {
		this.OnTick();
	}
});

/**
 * Upgrade
 */
var Upgrade = function(game, name) {
	Entity.call(this, game, name);
	this.AddComponent(ObtainablePurchasable);
	this.AddComponent(Rewardable);
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
		this.game.data.generators[this.generator].rates[this.resource] += this.amount;
		this.game.trigger('reward_baserate', this, this.resource, this.amount);
	}
});
var MultiplierReward = function(game, entity, multiplier_add, multiplier_multiply) {
	Reward.call(this, game);
	this.entity = entity;
	this.multiplier_add = multiplier_add;
	this.multiplier_multiply = multiplier_multiply;
};
extend(MultiplierReward, Reward, {
	Reward: function() {
		if (this.multiplier_add) {
			this.entity.multiplier.Add(this.multiplier_add);
		}
		if (this.multiplier_multiply) {
			this.entity.multiplier.Mult(this.multiplier_multiply);
		}
		this.game.trigger('reward_multiplier', this, this.resource);
	}
});

/**
 * Achievement
 */
var Achievement = function(game, name) {
	Entity.call(this, game, name);
	this.AddComponent(Obtainable);
	game.on('tick', this.Check, this)
};
extend(Achievement, Entity, {
	Check: function() {
		if (this.game.Every(20)) {
			if (!this.obtainable.GetObtained()) {
				this.CheckAchievement();
			}
		}
	},
	CheckAchievement: function() {

	}
});

var AmountAchievement = function(game, name, entity, value) {
	Achievement.call(this, game, name);
	this.entity = entity;
	this.value = value;
};
extend(AmountAchievement, Achievement, {
	CheckAchievement: function() {
		if (this.entity.amount.GetMax() >= this.value) {
			this.obtainable.Obtain();
		}
	}
});
