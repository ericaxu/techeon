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
	on: function(name, func, context, every) {
		if (!isInt(every) || every < 1) {
			every = 1;
		}
		this.events.add(name, {func: func, context: context, every: every, current: 0});
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
			object.current = (object.current + 1) % object.every;
			if (object.current == 0) {
				object.func.apply(object.context, args);
			}
		}, this);
		args.unshift(name);
		this.bridges.each(name, function(object) {
			args[0] = object;
			this.trigger.apply(this, args);
		}, this);
	}
});

/**
 * Loader - Save and load functionality
 */
var Loader = function(owner) {
	this.owner = owner;
	this.owner.loader = this;
	this.loading = false;
	this.elements = {};
};
extend(Loader, null, {
	AddElement: function(name) {
		this.elements[name] = true;
		return this;
	},
	Load: function(data) {
		this.loading = true;
		for (var key in this.elements) {
			var result = this.LoadSingle(data[key], this.owner[key]);
			if (result !== null) {
				this.owner[key] = result;
			}
		}
		if (this.owner.events) {
			this.owner.trigger('load', this.owner);
		}
		this.loading = false;
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
	},
	IsLoading: function() {
		return this.loading;
	}
});


/**
 * Game - Main game entry point
 */
var GameEngine = function() {
	this.events = new Events(this);
	this.loopTask = null;
	this.time = 0;
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
			clearTimeout(this.loopTask);
			this.loopTask = null;
			this.trigger('game_stop', this);
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

		this.trigger('render', this);

		this.trigger('post_loop', this);
		this.loopTask = ctxSetTimeout(this.Loop, this.timePerTick, this);
	},
	Reset: function() {
		this.Stop();
		this.tick = 0;
		this.trigger('init', this);
		this.Start();
	},
	Tick: function() {
		this.trigger('pre_tick', this);
		this.tick++;
		this.trigger('tick', this);
		this.trigger('post_tick', this);
	},
	AddEntity: function(type, entity) {
		this.content[type].push(entity);
		this.data[type][entity.GetName()] = entity;
		return entity;
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
		this.tps = ticksPerSecond;
		this.timePerTick = 1000 / ticksPerSecond;
	},
	GetTicksPerSecond: function() {
		return this.tickPerSecond;
	},
	GetRateTickFromSecond: function(second_rate) {
		return second_rate / this.GetTicksPerSecond();
	},
	GetRateSecondFromTick: function(tick_rate) {
		return tick_rate * this.GetTicksPerSecond();
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
	this.game.on('init', this.OnInit, this);
	this.on('init', this.Init, this);
	this.bridge('init', 'update');
	this.bridge('load', 'update');
};
extend(Entity, null, {
	OnInit: function() {
		this.trigger('init', this);
	},
	Init: function() {

	},
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
	this.entity.on('init', this.Init, this);
	this.Init();
};
extend(Component, null, {
	Init: function() {

	}
});

/**
 * Describable
 */
var Describable = function(entity) {
	Component.call(this, entity);
	entity.describable = this;
	this.title = '';
	this.plural = '';
	this.effects = [];
	this.description = '';
	this.detail = '';
	this.icon = '';
};
extend(Describable, Component, {
	Set: function(title, description, effect) {
		this.SetTitle(title);
		this.SetDescription(description);
		if (effect) {
			this.AddEffect(effect);
		}
		return this.entity;
	},
	SetTitle: function(title) {
		this.title = title;
		this.plural = title + 's';
		return this.entity;
	},
	GetTitle: function() {
		return this.title;
	},
	AddEffect: function(effect) {
		this.effects.push(effect);
		return this.entity;
	},
	ClearEffects: function() {
		this.effects = [];
		return this.entity;
	},
	GetEffects: function() {
		return this.effects;
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
	},
	SetPlural: function(plural) {
		this.plural = plural;
		return this.entity;
	},
	GetPlural: function() {
		return this.plural;
	}
});

/**
 * Multiplier
 */
var Multiplier = function(entity) {
	Component.call(this, entity);
	entity.multiplier = this;
	entity.loader.AddElement('multiplier');
	this.loader.AddElement('multiplier');
};
extend(Multiplier, Component, {
	Init: function() {
		this.multiplier = 1;
	},
	Set: function(multiplier) {
		this.multiplier = multiplier;
		this.entity.trigger('multiplier_change', this.entity);
		return this.entity;
	},
	Add: function(value) {
		this.multiplier += value;
		this.entity.trigger('multiplier_change', this.entity);
		return this.entity;
	},
	Mult: function(value) {
		this.multiplier *= value;
		this.entity.trigger('multiplier_change', this.entity);
		return this.entity;
	},
	Div: function(value) {
		this.multiplier /= value;
		this.entity.trigger('multiplier_change', this.entity);
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
	this.trackingRate = false;
	this.approx = false;
	this.loader.AddElement('amount').AddElement('maxAmount').AddElement('totalAmount').AddElement('rate');
	this.entity.bridge('amount_change', 'update');
};
extend(Amount, Component, {
	Init: function() {
		this.amount = 0.0;
		this.maxAmount = 0.0;
		this.totalAmount = 0.0;
		this.rate = 0.0;
		this.prevAmount = 0.0;
		this.approxAmount = 0.0;
		this.lastRate = 0.0;
	},
	Get: function() {
		return this.amount;
	},
	StartApprox: function() {
		if (this.approx) {
			this.entity.game.off('tick', this.UpdateApprox);
		}
		this.approx = true;
		this.entity.game.on('tick', this.UpdateApprox, this);
		return this.entity;
	},
	StopApprox: function() {
		if (this.approx) {
			this.entity.game.off('tick', this.UpdateApprox);
		}
		this.approx = false;
		return this.entity;
	},
	UpdateApprox: function() {
		this.approxAmount = approximateTo(this.approxAmount, this.amount, 0.5);
	},
	GetApprox: function() {
		if (!this.approx) {
			return this.amount;
		}
		return this.approxAmount;
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
	Generate: function(value) {
		this.Add(value);
		if (this.trackingRate) {
			this.rate += value;
		}
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
		if (this.prevAmount != this.amount) {
			this.prevAmount = this.amount;
			this.entity.trigger('amount_change', this.entity);
		}
	},
	TrackTickRate: function() {
		this.entity.game.on('tick', this.Tick, this);
		this.trackingRate = true;
	},
	Tick: function() {
		var rateChanged = false;
		if (!this.lastRate == this.rate) {
			rateChanged = true;
		}
		this.lastRate = this.rate;
		this.rate = 0;
		if (rateChanged) {
			this.entity.trigger('rate_changed', this.entity);
		}
	},
	GetRate: function() {
		return this.lastRate;
	},
	GetRatePerSec: function() {
		return this.entity.game.GetRateSecondFromTick(this.GetRate());
	}
});

/**
 * Obtainable
 */
var Obtainable = function(entity) {
	Component.call(this, entity);
	entity.obtainable = this;
	entity.loader.AddElement('obtainable');
	this.loader.AddElement('obtained').AddElement('everobtained');
	this.entity.bridge('obtain', 'update');
	this.entity.bridge('unobtain', 'update');
};
extend(Obtainable, Component, {
	Init: function() {
		this.obtained = false;
		this.everobtained = false;
	},
	SetObtained: function(value) {
		this.obtained = value;
		if (value) {
			this.everobtained = true;
		}
		return this.entity;
	},
	Obtain: function() {
		this.obtained = true;
		this.everobtained = true;
		this.entity.trigger('obtain', this.entity);
	},
	UnObtain: function() {
		this.obtained = false;
		this.entity.trigger('unobtain', this.entity);
	},
	GetObtained: function() {
		return this.obtained;
	},
	GetEverObtained: function() {
		return this.everobtained;
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
		each(this.rewards, function(reward) {
			reward.Reward();
		});
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

/**
 * Modifiable
 */
var Modifiable = function(entity) {
	Component.call(this, entity);
	entity.modifiable = this;
	entity.loader.AddElement('modifiable');
	this.ticks = {};
	this.timecount = {};
	this.loader.AddElement('ticks').AddElement('timecount');
	this.entity.bridge('modifier_add', 'update');
	this.entity.bridge('modifier_activate', 'update');
	this.entity.bridge('modifier_deactivate', 'update');
	this.entity.game.on('tick', this.TickModifiers, this);
	this.modifiers = {};
};
extend(Modifiable, Component, {
	Init: function() {
		each(this.modifiers, function(modifier) {
			modifier.Init(this);
		}, this);
	},
	AddModifier: function(modifier) {
		modifier.Attach(this.entity, this);
		this.entity.trigger('modifier_add', this.entity, modifier);
		return this.entity;
	},
	ActivateModifier: function(modifier) {
		modifier.Activate(this);
		this.entity.trigger('modifier_activate', this.entity, modifier);
	},
	DeactivateModifier: function(modifier) {
		modifier.Deactivate(this);
		this.entity.trigger('modifier_deactivate', this.entity, modifier);
	},
	TickModifiers: function() {
		each(this.modifiers, function(modifier) {
			modifier.Tick(this);
		}, this);
	},
	GetModifier: function(name) {
		return this.modifiers[name];
	},
	HasModifier: function(modifier) {
		if (this.modifiers[modifier]) {
			return this.modifiers[modifier].Check(this);
		}
		return false;
	},
	ModifierTimeCount: function(modifier) {
		if (this.timecount[modifier]) {
			return this.timecount[modifier];
		}
		return 0;
	}
});

/**
 * Modifier
 */
var Modifier = function(game, name, ticks) {
	this.game = game;
	this.name = name;
	this.ticks = ticks;
	this.entity = null;
};
extend(Modifier, null, {
	Init: function(modifiable) {
		modifiable.ticks[this.name] = -1;
		modifiable.timecount[this.name] = 0;
		modifiable.modifiers[this.name] = this;
	},
	Attach: function(entity, modifiable) {
		this.entity = entity;
		this.Init(modifiable);
	},
	Activate: function(modifiable) {
		modifiable.ticks[this.name] = this.ticks;
		modifiable.timecount[this.name] += 1;
	},
	Deactivate: function(modifiable) {
		modifiable.ticks[this.name] = -1;
	},
	Tick: function(modifiable) {
		if (modifiable.ticks[this.name] != -1) {
			modifiable.ticks[this.name]--;
			if (!this.Check(modifiable)) {
				modifiable.DeactivateModifier(this);
			}
		}
	},
	Check: function(modifiable) {
		return modifiable.ticks[this.name] > 0;
	}
});

/**
 * Restrictable
 */
var Restrictable = function(entity) {
	Component.call(this, entity);
	entity.restrictable = this;
	this.restrictions = [];
	this.level = 0;
	this.entity.bridge('available_change', 'update');
	this.entity.bridge('available_change', 'update');
	this.entity.game.on('tick', this.UpdateAvailable, this);
};
extend(Restrictable, Component, {
	UpdateAvailable: function() {
		var level = Number.MAX_VALUE;
		each(this.restrictions, function(restriction) {
			if (!restriction.Check()) {
				level = Math.min(level, restriction.GetLevel() - 1);
			}
		}, this);
		if (this.level != level) {
			this.level = level;
			this.entity.trigger('available_change', this.entity);
		}
	},
	AddRestriction: function(restriction) {
		this.restrictions.push(restriction);
		return this.entity;
	},
	ClearRestrictions: function() {
		this.restrictions.clear();
		return this.entity;
	},
	GetLevel: function() {
		return this.level;
	}
});

/**
 * Restriction
 */
var Restriction = function(game, entity, level) {
	this.game = game;
	this.entity = entity;
	this.level = level;
};
extend(Restriction, null, {
	Check: function() {
		return true;
	},
	GetLevel: function() {
		return this.level;
	}
});

/**
 * AmountRestriction
 */
var AmountRestriction = function(game, entity, level, amount, current) {
	Restriction.call(this, game, entity, level);
	this.amount = amount;
	this.current = current;
};
extend(AmountRestriction, Restriction, {
	Check: function() {
		if (this.current) {
			return this.entity.amount.Get() >= this.amount;
		}
		return this.entity.amount.GetMax() >= this.amount;
	}
});

/**
 * ObtainableRestriction
 */
var ObtainableRestriction = function(game, entity, level, current) {
	Restriction.call(this, game, entity, level);
	this.current = current;
};
extend(ObtainableRestriction, Restriction, {
	Check: function() {
		if (this.current) {
			return this.entity.obtainable.GetObtained();
		}
		return this.entity.obtainable.GetEverObtained();
	}
});
