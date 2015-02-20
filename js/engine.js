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
		var list = this.data[name];
		if (list) {
			for (var i = 0; i < list.length; i++) {
				func.call(context, list[i]);
			}
		}
	},
	get: function() {
		return this.data;
	}
});

/**
 * Events - Simple event system
 */
var Events = function() {
	this.events = new MapList();
	this.bridges = new MapList();
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
		this.bridges.each(name, function(object) {
			this.trigger(object);
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
			this.owner.events.trigger('load', this.owner);
		}
	},
	LoadSingle: function(data, dest) {
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
			this.owner.events.trigger('save', this.owner);
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
	this.events = new Events();
	this.loopTask = null;
	this.time = 0;
	this.tickSubscribers = new TickEvents(this);
	this.SetTicksPerSecond(50);

	this.tick = 0;
	this.content = {};
	new Loader(this).AddElement('tick').AddElement('content');
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
		this.tickSubscribers.tick();
		this.events.trigger('post_tick', this);
	},
	AddContent: function(type, entity) {
		this.content[type][entity.GetName()] = entity;
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
	this.events = new Events();
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
	this.entity.events.bridge('load', 'amount_changed');
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
		this.entity.events.trigger('amount_changed', this.entity);
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
	this.entity.events.on('load', this.TriggerEvent, this);
};
extend(Obtainable, Component, {
	SetObtained: function(value) {
		this.obtained = value;
		return this.entity;
	},
	Obtain: function() {
		this.obtained = true;
		this.TriggerEvent();
	},
	UnObtain: function() {
		this.obtained = false;
		this.TriggerEvent();
	},
	TriggerEvent: function() {
		if (this.obtained) {
			this.entity.events.trigger('obtain', this.entity);
		} else {
			this.entity.events.trigger('unobtain', this.entity);
		}
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
		this.entity.events.trigger('rewarded', this.entity);
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
