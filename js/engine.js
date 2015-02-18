/**
 * Events - Simple event system
 */
var Events = function() {
	this.events = {};
};
extend(Events, null, {
	on: function(name, func, context) {
		var event = this.events[name];
		if (!event) {
			event = [];
			this.events[name] = event;
		}
		event.push({func: func, context: context})
	},
	off: function(name, func) {
		if (!func || !this.events[name]) {
			return;
		}
		var list = this.events[name];
		for (var i = 0; i < list.length; i++) {
			if (list[i] == func) {
				list.splice(i, 1);
			}
		}
	},
	trigger: function() {
		var args = Array.apply([], arguments);
		var name = args.shift();
		var list = this.events[name];
		if (!list) {
			return;
		}
		for (var i = 0; i < list.length; i++) {
			list[i].func.apply(list[i].context, args);
		}
	}
});


/**
 * Game - Main game entry point
 */
var GameEngine = function() {
	this.events = new Events();
	this.loopTask = null;
	this.tick = 0;
	this.time = 0;
	this.content = {};
	this.SetTicksPerSecond(50);
};
extend(GameEngine, null, {
	Start: function() {
		this.events.trigger('game_start', this);
		this.time = currentTimeMS();
		this.Loop();
	},
	Stop: function() {
		if (this.loopTask) {
			this.events.trigger('game_stop', this);
			clearTimeout(this.loopTask);
			this.loopTask = null;
		}
	},
	Loop: function() {
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
		this.loopTask = ctxSetTimeout(this.Loop, this.timePerTick, this);
	},
	Tick: function() {
		this.events.trigger('pre_tick', this);
		this.tick++;
		this.events.trigger('tick', this);
		this.events.trigger('post_tick', this);
	},
	AddContent: function(type, entity) {
		this.content[type][entity.GetName()] = entity;
	},

	//Helpers
	Every: function(ticks) {
		//Ticks must be an integer!
		ticks = Math.ceil(ticks);
		return (this.tick % ticks == 0);
	},
	MSToTicks: function(ms) {
		return ms / this.timePerTick;
	},
	SetTicksPerSecond: function(ticksPerSecond) {
		this.tickPerSecond = ticksPerSecond;
		this.timePerTick = 1000 / ticksPerSecond;
	},
	GetTicksPerSecond: function() {
		return this.tickPerSecond;
	},
	GetRateTickFromSecond: function(second_rate) {
		return second_rate / this.GetTicksPerSecond();
	}
});

/**
 * Entity
 */
var Entity = function(game, name) {
	this.events = new Events();
	this.game = game;
	this.name = name;
	this.components = [];
	this.AddComponent(Describable);
	game.events.on('tick', this.OnTick, this);
};
extend(Entity, null, {
	AddComponent: function(component) {
		//Don't create same component twice
		for (var i = 0; i < this.components.length; i++) {
			if (this.components[i] instanceof component) {
				return this;
			}
		}
		this.components.push(new component(this));
		return this;
	},
	GetName: function() {
		return this.name;
	},
	OnTick: function() {

	}
});

/**
 * Component
 */
var Component = function(entity) {
	this.entity = entity;
};

/**
 * Describable
 */
var Describable = function(entity) {
	Component.call(this, entity);
	entity.describable = this;
};
extend(Describable, Component, {
	SetTitle: function(title) {
		this.title = title;
		return this.entity;
	},
	GetTitle: function() {
		return this.title;
	},
	SetDescription: function(description) {
		this.description = description;
		return this.entity;
	},
	GetDescription: function() {
		return this.description;
	},
	SetIcon: function(icon) {
		this.icon = icon;
		return this.entity;
	},
	GetIcon: function() {
		return this.icon;
	}
});

/**
 * Amount
 */
var Amount = function(entity) {
	Component.call(this, entity);
	entity.amount = this;
	this.amount = 0.0;
	this.maxAmount = 0.0;
	this.totalAmount = 0.0;
};
extend(Amount, Component, {
	Get: function() {
		return this.amount;
	},
	Set: function(value) {
		this.amount = value;
		return this.entity;
	},
	GetMax: function() {
		return this.maxAmount;
	},
	SetMax: function(value) {
		this.maxAmount = value;
		return this.entity;
	},
	GetTotal: function() {
		return this.totalAmount;
	},
	Add: function(value) {
		this.amount += value;
		this.totalAmount += value;
		this.maxAmount = Math.max(this.amount, this.maxAmount);
	},
	Remove: function(value) {
		this.amount -= value;
	},
	Reset: function() {
		this.amount = 0.0;
		this.maxAmount = 0.0;
	}
});

/**
 * Obtainable
 */
var Obtainable = function(entity) {
	Component.call(this, entity);
	entity.obtainable = this;
	this.obtained = false;
};
extend(Obtainable, Component, {
	SetObtained: function(value) {
		this.obtained = value;
		return this.entity;
	},
	Obtain: function() {
		this.obtained = true;
		this.entity.events.trigger('obtain', this.entity);
	},
	UnObtain: function() {
		this.obtained = false;
		this.entity.events.trigger('unobtain', this.entity);
	},
	GetObtained: function() {
		return this.obtained;
	}
});

/**
 * Rewardable
 */
var Rewardable = function(entity) {
	Component.call(this, entity);
	entity.rewardable = this;
	this.rewards = [];
};
extend(Rewardable, Component, {
	AddReward: function(reward) {
		this.rewards.push(reward);
		return this.entity;
	},
	GiveRewards: function() {
		for (var i = 0; i < this.rewards.length; i++) {
			this.rewards[i].Reward();
		}
		this.entity.events.trigger('reward', this.entity);
	}
});

/**
 * Reward
 */
var Reward = function(game) {
	this.game = game;
};
extend(Reward, null, {
	Reward: function() {

	}
});
