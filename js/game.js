var Game = function() {
	GameEngine.call(this);
	this.content.resources = {};
	this.content.generators = {};
};
extend(Game, GameEngine, {
	GetResourceRatesPerSecond: function(resource) {
		return this.GetResourceRatesPerTick(resource) * this.GetTicksPerSecond();
	},
	GetResourceRatesPerTick: function(resource) {
		var rate = 0;
		for (var generator in this.content.generators) {
			rate += this.content.generators[generator].GetRate(resource);
		}
		return rate;
	},
	AddResource: function(entity) {
		this.AddContent("resources", entity);
	},
	AddGenerator: function(entity) {
		this.AddContent("generators", entity);
	}
});

/**
 * Purchasable
 */
var Purchasable = function(entity) {
	Component.call(this, entity);
	entity.purchasable = this;
	this.obtained = false;
	this.buyPrice = {};
	this.sellPrice = {};
	this.restrictions = {};
};
extend(Purchasable, Component, {
	AddBuyPrice: function(resource, price) {
		this.buyPrice[resource] = price;
		return this.entity;
	},
	AddSellPrice: function(resource, price) {
		this.sellPrice[resource] = price;
		return this.entity;
	},
	AddRestriction: function(resource, restriction) {
		this.restrictions[resource] = restriction;
		return this.entity;
	},
	Available: function() {
		for (var resource in this.restrictions) {
			var restriction = this.restrictions[resource];
			if (this.entity.game.content.resources[resource].amount.GetMax() < restriction) {
				return false;
			}
		}
		return true;
	},
	CanBuy: function() {
		var price = this.GetBuyPrice();
		for (var resource in price) {
			var cost = price[resource];
			if (this.entity.game.content.resources[resource].amount.Get() < cost) {
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
			this.entity.game.content.resources[resource].amount.Remove(price[resource]);
		}
		this.entity.events.trigger('buy', this);
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
			this.entity.game.content.resources[resource].amount.Add(price[resource]);
		}
		this.entity.events.trigger('sell', this);
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
	this.entity.events.on('buy', this.OnBuy, this);
	this.entity.events.on('sell', this.OnSell, this);
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
	this.entity.events.on('buy', this.OnBuy, this);
	this.entity.events.on('sell', this.OnSell, this);
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

	this.buyPrice = {};
	this.sellPrice = {};
	this.factor = 1.1;
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
	}
});

var ResourceReward = function(game, resource, amount) {
	Reward.call(this, game);
	this.resource = resource;
	this.amount = amount;
};
extend(ResourceReward, Reward, {
	GetRewardAmount: function() {
		return this.amount;
	},
	Reward: function() {
		var amount = this.GetRewardAmount();
		this.events.trigger('reward_resource', this, this.resource, amount);
		this.game.content.resources[this.resource].amount.Add(amount);
	}
});

var MultiplierReward = function(game, generator, multiplier_add, multiplier_multiply) {
	Reward.call(this, game);
	this.generator = generator;
	this.multiplier_add = multiplier_add;
	this.multiplier_multiply = multiplier_multiply;
};
extend(MultiplierReward, Reward, {
	GetRewardAmount: function() {
		return this.amount;
	},
	Reward: function() {
		var amount = this.GetRewardAmount();
		this.events.trigger('reward_resource', this, this.resource, amount);
		this.game.content.resources[this.resource].amount.Add(amount);
	}
});


/**
 * Resource
 */
var Resource = function(game, name) {
	Entity.call(this, game, name);
	this.AddComponent(Amount);
};
extend(Resource, Entity, {});

/**
 * Generator
 */
var Generator = function(game, name, manual) {
	Entity.call(this, game, name);
	this.AddComponent(ExponentialAmountPurchasable);
	this.manual = manual;
	this.rates = {};
	this.multipliers = {};
	if (this.manual) {
		game.events.off('tick', this.Tick);
	}
};
extend(Generator, Entity, {
	AddRateSecond: function(resource, rate) {
		return this.AddRate(resource, this.game.GetRateTickFromSecond(rate));
	},
	AddRate: function(resource, rate) {
		this.rates[resource] = rate;
		this.multipliers[resource] = 1;
		return this;
	},
	GetRate: function(resource) {
		var rate = this.rates[resource];
		var multiplier = this.multipliers[resource];
		if (!rate || !multiplier) {
			return 0;
		}
		return this.amount.Get() * rate * multiplier;
	},
	Tick: function() {
		for (var resource in this.rates) {
			var result = this.GetRate(resource);
			this.events.trigger('generate_resource', this, resource, result);
			this.game.content.resources[resource].amount.Add(result);
		}
	}
});

/**
 * Upgrade
 */
var Upgrade = function(game, name) {
	Entity.call(this, game, name);
	this.AddComponent(ObtainablePurchasable);
	this.AddComponent(Rewardable);
	this.events.on('obtain', this.Obtained, this);
};
extend(Upgrade, Entity, {
	Obtained: function() {
		this.rewardable.GiveRewards();
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
