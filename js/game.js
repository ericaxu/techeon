/**
 * Game
 */
var Game = function() {
    this.events = new Events();
    this.task = null;
    this.tick = 0;
    this.time = 0;
    this.timePerTick = 1000 / 50;
    this.resources = {};
    this.generators = {};
    this.upgrades = {};
    this.achievements = {};
};
Game.prototype.Start = function() {
    this.events.trigger('game_start', this);
    this.time = currentTimeMS();
    this.Loop();
};
Game.prototype.Stop = function() {
    if (this.task) {
        this.events.trigger('game_stop', this);
        clearTimeout(this.task);
        this.task = null;
    }
};
Game.prototype.Loop = function() {
    this.events.trigger('pre_loop', this);
    var targetTime = currentTimeMS();

    // Lots of lag, maybe went sleep?
    if (targetTime - this.time > 5000) {
        this.time = targetTime;
    }
    while (targetTime > this.time) {
        this.Tick();
        this.time += this.timePerTick;
    }

    this.events.trigger('post_loop', this);
    this.task = ctxSetTimeout(this.Loop, this.timePerTick, this);
};
Game.prototype.Tick = function() {
    this.events.trigger('pre_tick', this);
    this.tick++;
    this.events.trigger('tick', this);
    this.events.trigger('post_tick', this);
};
Game.prototype.CreateResource = function(name) {
    var object = new Resource(this, name);
    this.resources[name] = object;
    return object;
};
Game.prototype.CreateGenerator = function(name, manual) {
    var object = new Generator(this, name, manual);
    this.generators[name] = object;
    return object;
};
Game.prototype.CreateUpgrade = function(name) {
    var object = new Upgrade(this, name);
    this.upgrades[name] = object;
    return object;
};
Game.prototype.CreateAchievement = function(name) {
    var object = new Achievement(this, name);
    this.achievements[name] = object;
    return object;
};
//Helpers
Game.prototype.Every = function(ticks) {
    return (this.tick % ticks == 0);
};
Game.prototype.MSToTicks = function(ms) {
    return ms / this.timePerTick;
};

/**
 * Component
 */
var Component = function() {
    this.events = new Events();
};

/**
 * Amount
 */
var Amount = function() {
    Component.call(this);
    this.amount = 0.0;
    this.maxAmount = this.amount;
    this.SetAmount = function(value) {
        this.amount = value;
        this.maxAmount = Math.max(this.amount, this.maxAmount);
        return this;
    };
    this.Add = function(value) {
        this.amount += value;
        this.maxAmount = Math.max(this.amount, this.maxAmount);
    };
    this.Remove = function(value) {
        this.Add(-value);
    };
    this.GetAmount = function() {
        return this.amount;
    };
    this.GetMaxAmount = function() {
        return this.maxAmount;
    };
};

/**
 * Purchasable
 */
var Purchasable = function() {
    Component.call(this);
    this.buyPrice = {};
    this.sellPrice = {};
    this.restrictions = {};
    this.AddBuyPrice = function(resource, price) {
        this.buyPrice[resource] = price;
        return this;
    };
    this.AddSellPrice = function(resource, price) {
        this.sellPrice[resource] = price;
        return this;
    };
    this.AddRestriction = function(resource, restriction) {
        this.restrictions[resource] = restriction;
        return this;
    };
    this.Available = function() {
        for (var resource in this.restrictions) {
            var availability = this.restrictions[resource];
            if (this.game.resources[resource].maxAmount < availability) {
                return false;
            }
        }
        return true;
    };
    this.CanBuy = function() {
        for (var resource in this.buyPrice) {
            var cost = this.buyPrice[resource];
            if (this.game.resources[resource].amount < cost) {
                return false;
            }
        }
        return true;
    };
    this.Buy = function() {
        if (!this.CanBuy()) {
            return;
        }
        for (var resource in this.buyPrice) {
            this.game.resources[resource].Remove(this.buyPrice[resource]);
        }
        if (this.OnBuy) {
            this.OnBuy();
        }
    };
    this.Sell = function() {
        for (var resource in this.sellPrice) {
            this.game.resources[resource].Add(this.sellPrice[resource]);
        }
        if (this.OnSell) {
            this.OnSell();
        }
    };
    if (!this.CanSell) {
        this.CanSell = function() {
            return true;
        }
    }
};

/**
 * Entity
 */
var Entity = function(game, name) {
    this.events = new Events();
    this.game = game;
    this.name = name;
    game.events.on('tick', this.Tick, this);
};
Entity.prototype.Tick = function() {
};

/**
 * Resource
 */
var Resource = function(game, name) {
    Entity.call(this, game, name);
    Amount.call(this);
};
Resource.prototype = inherit(Entity.prototype, Resource);

/**
 * Generator
 */
var Generator = function(game, name, manual) {
    Entity.call(this, game, name);
    Amount.call(this);
    Purchasable.call(this);
    this.manual = manual;
    this.rates = {};
    this.multipliers = {};
    if (this.manual) {
        game.events.off('tick', this.Tick);
    }
};
Generator.prototype = inherit(Entity.prototype, Generator);
Generator.prototype.AddRate = function(resource, rate, multiplier) {
    this.rates[resource] = rate;
    this.multipliers[resource] = multiplier;
    return this;
};
Generator.prototype.Tick = function() {
    for (var resource in this.rates) {
        var rate = this.rates[resource];
        var multiplier = this.multipliers[resource];
        var result = this.amount * rate * multiplier;
        this.events.trigger('generate_resource', this, resource, result);
        this.game.resources[resource].Add(result);
    }
};
Generator.prototype.OnBuy = function() {
    this.Add(1);
};
Generator.prototype.CanSell = function() {
    return this.GetAmount() > 0;
};
Generator.prototype.OnSell = function() {
    this.Remove(1);
};

/**
 * Upgrade
 */
var Upgrade = function(game, name) {
    Entity.call(this, game, name);
    this.purchased = false;
    Purchasable.call(this);
};
Upgrade.prototype = inherit(Entity.prototype, Upgrade);
Upgrade.prototype.OnBuy = function() {
    this.purchased = true;
};
Upgrade.prototype.CanSell = function() {
    return true;
};
Upgrade.prototype.OnSell = function() {
    this.purchased = false;
};

/**
 * Achievement
 */
var Achievement = function(game, name) {
    Entity.call(this, game, name);
    this.unlocked = false;
};
Achievement.prototype = inherit(Entity.prototype, Achievement);
