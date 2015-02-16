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
    var self = this;
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
    this.resources[name] = new Resource(this, name);
};
Game.prototype.CreateGenerator = function(name, auto) {
    this.generators[name] = new Generator(this, name, auto);
};
Game.prototype.CreateUpgrade = function(name) {
    this.upgrades[name] = new Upgrade(this, name);
};
Game.prototype.CreateAchievement = function(name) {
    this.achievements[name] = new Achievement(this, name);
};

//Helpers
Game.prototype.Every = function(ticks) {
    return (this.tick % ticks == 0);
};
Game.prototype.MSToTicks = function(ms) {
    return ms / this.timePerTick;
};

/**
 * GameObject
 */
var GameObject = function(game, name) {
    this.events = new Events();
    this.game = game;
    this.name = name;
    game.events.on('tick', this.Tick, this);
};
GameObject.prototype.Tick = function() {
};

/**
 * Resource
 */
var Resource = function(game, name) {
    GameObject.call(this, game, name);
    this.value = 0.0;
};
Resource.prototype = inherit(GameObject.prototype, Resource);
Resource.prototype.Add = function(value) {
    this.value += value;
    return this;
};
Resource.prototype.Remove = function(value) {
    this.value -= value;
    return this;
};

/**
 * Generator
 */
var Generator = function(game, name, auto) {
    GameObject.call(this, game, name);
    this.count = 0;
    this.auto = auto;
    this.rates = {};
    this.multipliers = {};
    if (!this.auto) {
        game.events.off('tick', this.Tick);
    }
};
Generator.prototype = inherit(GameObject.prototype, Generator);
Generator.prototype.SetBaseRate = function(resource, rate) {
    this.rates[resource] = rate;
    this.multipliers[resource] = 1;
    return this;
};
Generator.prototype.Add = function(value) {
    this.count += value;
    return this;
};
Generator.prototype.Remove = function(value) {
    this.count -= value;
    return this;
};
Generator.prototype.Tick = function() {
    GameObject.prototype.Tick.call(this);
    for (var resource in this.rates) {
        var rate = this.rates[resource];
        var multiplier = this.multipliers[resource];
        var result = this.count * rate * multiplier;
        this.events.trigger('generate_resource', this, resource, result);
        this.game.resources[resource].Add(result);
    }
};

/**
 * Upgrade
 */
var Upgrade = function(game, name) {
    GameObject.call(this, game, name);
    this.available = false;
    this.purchased = false;
    this.cost = {};
};
Upgrade.prototype = inherit(GameObject.prototype, Upgrade);
Upgrade.prototype.CanBuy = function() {
    for (var resource in this.cost) {
        var cost = this.cost[resource];
        if (this.game.resources[resource].value < cost) {
            return false;
        }
    }
    return true;
};
Upgrade.prototype.Buy = function() {
    if (this.CanBuy()) {
        for (var resource in this.cost) {
            var cost = this.cost[resource];
            this.game.resources[resource].Remove(cost);
        }
    }
};

/**
 * Achievement
 */
var Achievement = function(game, name) {
    GameObject.call(this, game, name);
    this.available = false;
};
Achievement.prototype = inherit(GameObject.prototype, Achievement);
