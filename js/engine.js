/**
 * MapList - A map with Lists as values
 */
var MapList = function() {
	this.data = {};
};
extend(MapList, null, {
	add: function(name, object) {
		var data = this.data[name];
		if (!data) {
			data = [];
			this.data[name] = data;
		}
		data.push(object);
	},
	remove: function(name, object) {
		this.removePredicate(name, function(obj) {
			return obj == object;
		});
	},
	removePredicate: function(name, func) {
		if (!this.data[name]) {
			return;
		}
		var list = this.data[name];
		for (var i = 0; i < list.length; i++) {
			if (func(list[i])) {
				list.splice(i, 1);
			}
		}
		if (list.length == 0) {
			delete this.data[name];
		}
	},
	each: function(name, func, context) {
		each(this.data[name], func, context);
	},
	get: function() {
		return this.data;
	}
});

/**
 * Events - Simple event system
 */
var Events = function(owner) {
	this.owner = owner;
	this.events = new MapList();
	this.bridges = new MapList();
	this.owner.on = bind(this.on, this);
	this.owner.off = bind(this.off, this);
	this.owner.trigger = bind(this.trigger, this);
	this.owner.bridge = bind(this.bridge, this);
	this.owner.unbridge = bind(this.unbridge, this);
};
extend(Events, null, {
	on: function(name, func, context) {
		this.events.add(name, {func: func, context: context});
	},
	off: function(name, func) {
		this.events.removePredicate(name, function(obj) {
			return obj.func == func;
		});
	},
	bridge: function(name1, name2) {
		this.bridges.add(name1, name2);
	},
	unbridge: function(name1, name2) {
		this.bridges.remove(name1, name2);
	},
	trigger: function() {
		var args = Array.apply([], arguments);
		var name = args.shift();

		this.events.each(name, function(object) {
			object.func.apply(object.context, args);
		}, this);
		args.unshift(name);
		this.bridges.each(name, function(object) {
			args[0] = object;
			this.trigger.apply(this, args);
		}, this);
	}
});

/**
 * TickEvents - Tick event system
 */
var TickEvents = function(game) {
	this.events = new MapList();
	this.game = game;
};
extend(TickEvents, null, {
	on: function(ticks, func, context) {
		this.events.add(ticks, {func: func, context: context});
	},
	off: function(func) {
		for (var ticks in this.events) {
			this.events.removePredicate(ticks, function(obj) {
				return obj.func == func;
			});
		}
	},
	tick: function() {
		for (var ticks in this.events.get()) {
			if (this.game.Every(ticks)) {
				this.events.each(ticks, function(object) {
					object.func.call(object.context, this.game);
				}, this);
			}
		}
	}
});

/**
 * Loader - Save and load functionality
 */
var Loader = function(owner) {
	this.owner = owner;
	this.owner.loader = this;
	this.elements = {};
};
extend(Loader, null, {
	AddElement: function(name) {
		this.elements[name] = true;
		return this;
	},
	Load: function(data) {
		for (var key in this.elements) {
			var result = this.LoadSingle(data[key], this.owner[key]);
			if (result !== null) {
				this.owner[key] = result;
			}
		}
		if (this.owner.events) {
			this.owner.trigger('load', this.owner);
		}
	},
	LoadSingle: function(data, dest) {
		if (data === undefined) {
			return dest;
		}
		if (isObject(data) && isObject(dest)) {
			if (dest.loader) {
				dest.loader.Load(data);
			}
			else {
				for (var key in data) {
					dest[key] = this.LoadSingle(data[key], dest[key]);
				}
			}
			return dest;
		}
		return data;
	},
	Save: function() {
		var data = {};

		for (var key in this.elements) {
			data[key] = this.SaveSingle(this.owner[key]);
		}

		if (this.owner.events) {
			this.owner.trigger('save', this.owner);
		}

		return data;
	},
	SaveSingle: function(dest) {
		var data = dest;
		if (isObject(dest)) {
			if (dest.loader) {
				data = dest.loader.Save();
			}
			else {
				data = {};
				for (var key in dest) {
					data[key] = this.SaveSingle(dest[key]);
				}
			}
		}
		return data;
	}
});


/**
 * Game - Main game entry point
 */
var GameEngine = function() {
	this.events = new Events(this);
	this.loopTask = null;
	this.time = 0;
	this.tickSubscribers = new TickEvents(this);
	this.SetTicksPerSecond(50);

	this.tick = 0;
	this.data = {};
	this.content = {};
	new Loader(this).AddElement('tick').AddElement('data');
};
extend(GameEngine, null, {
	Start: function() {
		this.trigger('game_start', this);
		this.time = currentTimeMS();
		this.Loop();
	},
	Stop: function() {
		if (this.loopTask) {
			this.trigger('game_stop', this);
			clearTimeout(this.loopTask);
			this.loopTask = null;
		}
	},
	Loop: function() {
		this.trigger('pre_loop', this);
		var targetTime = currentTimeMS();

		// Lots of lag, maybe went sleep?
		if (targetTime - this.time > 5000) {
			this.time = targetTime;
		}
		while (targetTime > this.time) {
			this.Tick();
			this.time += this.timePerTick;
		}

		this.trigger('post_loop', this);
		this.loopTask = ctxSetTimeout(this.Loop, this.timePerTick, this);
	},
	Tick: function() {
		this.trigger('pre_tick', this);
		this.tick++;
		this.trigger('tick', this);
		this.tickSubscribers.tick();
		this.trigger('post_tick', this);
	},
	AddEntity: function(type, entity) {
		this.content[type].push(entity);
		this.data[type][entity.GetName()] = entity;
		return entity;
	},
	SubscribePeriodic: function(ticks, func, context) {
		this.tickSubscribers.on(ticks, func, context);
	},
	UnsubscribePeriodic: function(func) {
		this.tickSubscribers.off(func);
	},

	//Helpers
	Every: function(ticks) {
		if (isString(ticks)) {
			ticks = parseInt(ticks);
		}
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
	this.events = new Events(this);
	this.game = game;
	this.name = name;
	this.components = [];
	this.AddComponent(Describable);
	new Loader(this);
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
	}
});

/**
 * Component
 */
var Component = function(entity) {
	this.entity = entity;
	new Loader(this);
};

/**
 * Describable
 */
var Describable = function(entity) {
	Component.call(this, entity);
	entity.describable = this;
	this.title = '';
	this.effect = '';
	this.description = '';
	this.detail = '';
	this.icon = '';
};
extend(Describable, Component, {
	SetTitle: function(title) {
		this.title = title;
		return this.entity;
	},
	GetTitle: function() {
		return this.title;
	},
	SetEffect: function(effect) {
		this.effect = effect;
		return this.entity;
	},
	GetEffect: function() {
		return this.effect;
	},
	SetDescription: function(description) {
		this.description = description;
		return this.entity;
	},
	GetDescription: function() {
		return this.description;
	},
	SetDetail: function(detail) {
		this.detail = detail;
		return this.entity;
	},
	GetDetail: function() {
		return this.detail;
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
 * Multiplier
 */
var Multiplier = function(entity) {
	Component.call(this, entity);
	entity.multiplier = this;
	this.multiplier = 1;
};
extend(Multiplier, Component, {
	Set: function(multiplier) {
		this.multiplier = multiplier;
		this.trigger('multiplier_change', this.entity);
		return this.entity;
	},
	Add: function(value) {
		this.multiplier += value;
		this.trigger('multiplier_change', this.entity);
		return this.entity;
	},
	Mult: function(value) {
		this.multiplier *= value;
		this.trigger('multiplier_change', this.entity);
		return this.entity;
	},
	Get: function() {
		return this.multiplier;
	}
});

/**
 * Amount
 */
var Amount = function(entity) {
	Component.call(this, entity);
	entity.amount = this;
	entity.loader.AddElement('amount');
	this.amount = 0.0;
	this.maxAmount = 0.0;
	this.totalAmount = 0.0;
	this.loader.AddElement('amount').AddElement('maxAmount').AddElement('totalAmount');
	this.entity.bridge('load', 'update');
	this.entity.bridge('amount_change', 'update');
};
extend(Amount, Component, {
	Get: function() {
		return this.amount;
	},
	Set: function(value) {
		this.amount = value;
		this.TriggerChanged();
		return this.entity;
	},
	GetMax: function() {
		return this.maxAmount;
	},
	SetMax: function(value) {
		this.maxAmount = value;
		this.TriggerChanged();
		return this.entity;
	},
	GetTotal: function() {
		return this.totalAmount;
	},
	Add: function(value) {
		this.amount += value;
		this.totalAmount += value;
		this.maxAmount = Math.max(this.amount, this.maxAmount);
		this.TriggerChanged();
	},
	Remove: function(value) {
		this.amount -= value;
		this.TriggerChanged();
	},
	Reset: function() {
		this.amount = 0.0;
		this.maxAmount = 0.0;
		this.TriggerChanged();
	},
	TriggerChanged: function() {
		this.entity.trigger('amount_change', this.entity);
	}
});

/**
 * Obtainable
 */
var Obtainable = function(entity) {
	Component.call(this, entity);
	entity.obtainable = this;
	entity.loader.AddElement('obtainable');
	this.obtained = false;
	this.loader.AddElement('obtained');
	this.entity.bridge('load', 'update');
	this.entity.bridge('obtain', 'update');
	this.entity.bridge('unobtain', 'update');
};
extend(Obtainable, Component, {
	SetObtained: function(value) {
		this.obtained = value;
		return this.entity;
	},
	Obtain: function() {
		this.obtained = true;
		this.entity.trigger('obtain', this.entity);
	},
	UnObtain: function() {
		this.obtained = false;
		this.entity.trigger('unobtain', this.entity);
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
	this.entity.bridge('reward_add', 'update');
};
extend(Rewardable, Component, {
	AddReward: function(reward) {
		this.rewards.push(reward);
		this.entity.trigger('reward_add', this.entity);
		return this.entity;
	},
	GiveRewards: function() {
		for (var i = 0; i < this.rewards.length; i++) {
			this.rewards[i].Reward();
		}
		this.entity.trigger('reward', this.entity);
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
