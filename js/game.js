var Game = function() {
    this.events = new Events();
    this.task = null;
    this.tick = 0;
    this.time = 0;
    this.timePerTick = 1000 / 60;
    this.objects = [];
    this.resources = {};
    this.generators = {};
    this.upgrades = {};
    this.achievements = {};
    var self = this;
    this.RunLoop = function() {
        self.Loop();
    }
};
Game.prototype.Run = function() {
    this.events.trigger("game_start", this);
    this.time = currentTimeMS();
    this.Loop();
};
Game.prototype.Stop = function() {
    if (this.task) {
        this.events.trigger("game_stop", this);
        clearTimeout(this.task);
        this.task = null;
    }
};
Game.prototype.Loop = function() {
    this.events.trigger("pre_loop", this);
    var targetTime = currentTimeMS();

    // Lots of lag, maybe went sleep?
    if (targetTime - this.time > 5000) {
        this.time = targetTime;
    }
    while (targetTime > this.time) {
        this.Tick();
        this.time += this.timePerTick;
    }

    this.events.trigger("post_loop", this);
    this.task = setTimeout(this.RunLoop, this.timePerTick);
};
Game.prototype.Tick = function() {
    this.events.trigger("pre_tick", this);
    this.tick++;
    for (var i = 0; i < this.objects.length; i++) {
        this.objects[i].Tick();
    }
    this.events.trigger("post_tick", this);
};
Game.prototype.Run = function() {
    this.events.trigger("game_start", this);
    this.time = currentTimeMS();
    this.Loop();
};
Game.prototype.Every = function(ticks) {
    return this.tick % ticks == 0;
};
Game.prototype.AddResource = function(object) {
    this.resources[object.name] = object;
    this.objects.push(object);
};
Game.prototype.AddGenerator = function(object) {
    this.generators[object.name] = object;
    this.objects.push(object);
};
Game.prototype.AddUpgrade = function(object) {
    this.upgrades[object.name] = object;
    this.objects.push(object);
};
Game.prototype.AddAchievement = function(object) {
    this.achievements[object.name] = object;
    this.objects.push(object);
};

var GameObject = function(game, name) {
    this.events = new Events();
    this.game = game;
    this.name = name;
}
GameObject.prototype.Tick = function() {
};

var Generator = function(game, name) {
    GameObject.call(this, game, name);
    this.count = 0;
    this.rates = {};
    this.multipliers = {};
};
Generator.prototype = inherit(GameObject.prototype, Generator);
Generator.prototype.SetBaseRate = function(resourceName, rate) {
    this.rates[resourceName] = rate;
    this.multipliers[resourceName] = 1;
    return this;
};
Generator.prototype.Add = function(value) {
    this.count += value;
};
Generator.prototype.Remove = function(value) {
    this.count -= value;
};
Generator.prototype.Tick = function() {
    GameObject.prototype.Tick.call(this);
    for (var resourceName in this.rates) {
        var rate = this.rates[resourceName];
        var multiplier = this.multipliers[resourceName];
        this.game.resources[resourceName].Add(rate, multiplier);
    }
};

var Resource = function(game, name) {
    GameObject.call(this, game, name);
    this.value = 0.0;
};
Resource.prototype = inherit(GameObject.prototype, Resource);
Resource.prototype.Add = function(value) {
    this.value += value;
};
Resource.prototype.Remove = function(value) {
    this.value -= value;
};

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
        for (var resourceName in this.cost) {
            var cost = this.cost[resourceName];
            this.game.resources[resource].Remove(cost);
        }
    }
};

var Achievement = function(game, name) {
    GameObject.call(this, game, name);
    this.available = false;
};
Achievement.prototype = inherit(GameObject.prototype, Achievement);

var GAME = new Game();
GAME.AddResource(new Resource(GAME, "money"));
GAME.AddResource(new Resource(GAME, "code"));

GAME.AddGenerator(new Generator(GAME, "webdev").SetBaseRate("money", 1));

GAME.events.on("post_loop", function(game) {
    if (game.Every(10)) {
        console.log(game.tick);
    }
});
