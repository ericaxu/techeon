var CodeGenerator = function(game, name) {
	Generator.call(this, game, name);
};
extend(CodeGenerator, Generator, {});

var InternGenerator = function(game, name) {
	CodeGenerator.call(this, game, name);
	this.escaped = 0;
	this.loader.AddElement('escaped');
	this.on('escape', this.Escaped, this);
};
extend(InternGenerator, CodeGenerator, {
	Escaped: function() {
		this.escaped++;
		this.trigger('update', this);
	}
});

var MoneyGenerator = function(game, name) {
	Generator.call(this, game, name);
};
extend(MoneyGenerator, Generator, {});

var ClickGenerator = function(game, name, resource) {
	Generator.call(this, game, name, true);
	this.resource = resource;
	this.clicked = false;
	game.on('tick', this.UpdateRate, this, 10);
};
extend(ClickGenerator, Generator, {
	UpdateRate: function() {
		this.amount.Set(Math.max(this.resource.amount.GetRate() / 5, 1));
	},
	Click: function() {
		this.clicked = true;
	},
	OnTick: function() {
		if (this.clicked) {
			Generator.prototype.OnTick.call(this, true);
			this.clicked = false;
		}
	}
});

var WhippingModifier = function(game, ticks, tickrate, callback) {
	Modifier.call(this, game, 'whipped', ticks);
	this.multiplier = 1;
	this.tickrate = tickrate;
	this.callback = callback;
};
extend(WhippingModifier, Modifier, {
	SetMultiplier: function(multiplier) {
		this.multiplier = multiplier;
		return this;
	},
	Activate: function(entity) {
		entity.multiplier.Mult(this.multiplier);
	},
	Deactivate: function(entity) {
		entity.multiplier.Div(this.multiplier);
	},
	Tick: function(modifiable) {
		var ticks = modifiable.modifiers[this.name];
		if (this.callback && ticks % this.tickrate == 0) {
			this.callback(this.game);
		}
		return Modifier.prototype.Tick.call(this, modifiable);
	}
});

var WhippingAchievement = function(game, name, entity, count) {
	Achievement.call(this, game, name);
	this.entity = entity;
	this.count = count;
	this.entity.on('modifier_add', this.Check, this);
};
extend(WhippingAchievement, Achievement, {
	Check: function() {
		if (!this.obtainable.GetObtained() && this.entity.modifiable.ModifierTimeCount("whipped") >= this.count) {
			this.obtainable.Obtain();
		}
	}
});

var EscapeAchievement = function(game, name, entity, count) {
	Achievement.call(this, game, name);
	this.entity = entity;
	this.count = count;
	this.entity.on('update', this.Check, this);
};
extend(EscapeAchievement, Achievement, {
	Check: function() {
		if (!this.obtainable.GetObtained() && this.entity.escaped >= this.count) {
			this.obtainable.Obtain();
		}
	}
});

var GAME = (function() {

	var game = new Game();

	//Resources
	{
		var resources = game.data.resources;

		resources.money = game.AddResource(new Resource(game, "money")
				.describable.SetTitle("$")
				.describable.SetPlural("$")
				.SetRateFormatter(function(rate) {
					return "Generates " + formatDollar(rate * game.GetTicksPerSecond()) + " per second.";
				})
		);
		resources.code = game.AddResource(new Resource(game, "code")
				.describable.SetTitle("line of code")
				.describable.SetPlural("lines of code")
				.SetRateFormatter(function(rate) {
					return "Produces " + formatLinesOfCodePerSec(rate * game.GetTicksPerSecond()) + " per second.";
				})
		);
	}

	//Generators
	{
		var generators = game.data.generators;

		//Hires
		{
			generators.intern = game.AddGenerator(new InternGenerator(game, "intern")
					.describable.Set("Intern", "Don't really know anything and breaks the build every day.")
					.purchasable.SetBuyPrice("money", 100)
					.restrictable.AddRestriction(new AmountRestriction(game, resources.money, 1, 1))
					.SetRateSecond("code", 0.2)
					.AddComponent(Modifiable)
			);
			generators.newgrad = game.AddGenerator(new CodeGenerator(game, "newgrad")
					.describable.Set("New Grad", "Fresh out of college, will code for food.")
					.purchasable.SetBuyPrice("money", 500)
					.purchasablerestrictable.AddDefaultPriceRestriction()
					.restrictable.AddRestriction(new AmountRestriction(game, generators.intern, 1, 1))
					.SetRateSecond("code", 2)
			);
			generators.contractor = game.AddGenerator(new CodeGenerator(game, "contractor")
					.describable.Set("Contractor", "Like a normal employee, except you don't have to pay for his insurance.")
					.purchasable.SetBuyPrice("money", 2000)
					.purchasablerestrictable.AddDefaultPriceRestriction()
					.restrictable.AddRestriction(new AmountRestriction(game, generators.newgrad, 1, 1))
					.SetRateSecond("code", 15)
			);
			generators.programmer = game.AddGenerator(new CodeGenerator(game, "programmer")
					.describable.Set("Programmer", "Coffee in, code out.")
					.purchasable.SetBuyPrice("money", 10000)
					.purchasablerestrictable.AddDefaultPriceRestriction()
					.restrictable.AddRestriction(new AmountRestriction(game, generators.contractor, 1, 1))
					.SetRateSecond("code", 100)
			);
			generators.senior = game.AddGenerator(new CodeGenerator(game, "senior")
					.describable.Set("Senior Programmer", "No no no, you're doing it all wrong!")
					.purchasable.SetBuyPrice("money", 50000)
					.purchasablerestrictable.AddDefaultPriceRestriction()
					.restrictable.AddRestriction(new AmountRestriction(game, generators.programmer, 1, 1))
					.SetRateSecond("code", 800)
			);
			generators.architect = game.AddGenerator(new CodeGenerator(game, "architect")
					.describable.Set("Software Architect", "Writes design documents, and then code.")
					.purchasable.SetBuyPrice("money", 200000)
					.purchasablerestrictable.AddDefaultPriceRestriction()
					.restrictable.AddRestriction(new AmountRestriction(game, generators.senior, 1, 1))
					.SetRateSecond("code", 10000)
			);
			generators.teamlead = game.AddGenerator(new CodeGenerator(game, "teamlead")
					.describable.Set("Team Lead", "Manages programmers, and code on spare time (Yes they have a lot of spare time).")
					.purchasable.SetBuyPrice("money", 1000000)
					.purchasablerestrictable.AddDefaultPriceRestriction()
					.restrictable.AddRestriction(new AmountRestriction(game, generators.architect, 1, 1))
					.SetRateSecond("code", 80000)
			);
			generators.startup = game.AddGenerator(new CodeGenerator(game, "startup")
					.describable.Set("Startup", "Move fast, break things.")
					.purchasable.SetBuyPrice("money", 5000000)
					.purchasablerestrictable.AddDefaultPriceRestriction()
					.restrictable.AddRestriction(new AmountRestriction(game, generators.teamlead, 1, 1))
					.SetRateSecond("code", 800000)
			);
		}

		//Features
		{
			generators.webapp = game.AddGenerator(new MoneyGenerator(game, "webapp")
					.describable.Set("Web App", "HTML 5, CSS 3, and JavaScript.")
					.purchasable.SetBuyPrice("code", 15)
					.restrictable.AddRestriction(new AmountRestriction(game, resources.code, 1, 1))
					.SetRateSecond("money", 0.5)
			);
			generators.abtesting = game.AddGenerator(new MoneyGenerator(game, "abtesting")
					.describable.Set("A/B Testing", "User preferences proven by analytics.")
					.describable.SetPlural("A/B tests")
					.purchasable.SetBuyPrice("code", 100)
					.purchasablerestrictable.AddDefaultPriceRestriction()
					.restrictable.AddRestriction(new AmountRestriction(game, generators.webapp, 1, 1))
					.SetRateSecond("money", 5)
			);
			generators.emailcampaign = game.AddGenerator(new MoneyGenerator(game, "emailcampaign")
					.describable.Set("Email Campaign", "The fine line between email campaign and spamming.")
					.describable.SetPlural("Email campaign")
					.purchasable.SetBuyPrice("code", 600)
					.purchasablerestrictable.AddDefaultPriceRestriction()
					.restrictable.AddRestriction(new AmountRestriction(game, generators.abtesting, 1, 1))
					.SetRateSecond("money", 40)
			);
			generators.desktop = game.AddGenerator(new MoneyGenerator(game, "desktop")
					.describable.Set("Desktop Application", "Applications that won't run on a Chromebook.")
					.purchasable.SetBuyPrice("code", 2500)
					.purchasablerestrictable.AddDefaultPriceRestriction()
					.restrictable.AddRestriction(new AmountRestriction(game, generators.emailcampaign, 1, 1))
					.SetRateSecond("money", 300)
			);
			generators.mobileapp = game.AddGenerator(new MoneyGenerator(game, "mobileapp")
					.describable.Set("Mobile App", "The reason why your phone battery never lasts for more than one day.")
					.purchasable.SetBuyPrice("code", 12000)
					.purchasablerestrictable.AddDefaultPriceRestriction()
					.restrictable.AddRestriction(new AmountRestriction(game, generators.desktop, 1, 1))
					.SetRateSecond("money", 2500)
			);
			generators.seoalgo = game.AddGenerator(new MoneyGenerator(game, "seoalgo")
					.describable.Set("SEO Algorithm", "A thousand ways to fool a search engine.")
					.purchasable.SetBuyPrice("code", 50000)
					.purchasablerestrictable.AddDefaultPriceRestriction()
					.restrictable.AddRestriction(new AmountRestriction(game, generators.mobileapp, 1, 1))
					.SetRateSecond("money", 20000)
			);
			generators.aisales = game.AddGenerator(new MoneyGenerator(game, "aisales")
					.describable.Set("AI Salesperson", "Why hire a human salesperson when robots can close deals too?")
					.describable.SetPlural("AI salespeople")
					.purchasable.SetBuyPrice("code", 200000)
					.purchasablerestrictable.AddDefaultPriceRestriction()
					.restrictable.AddRestriction(new AmountRestriction(game, generators.seoalgo, 1, 1))
					.SetRateSecond("money", 150000)
			);
			generators.catvidgen = game.AddGenerator(new MoneyGenerator(game, "catvidgen")
					.describable.Set("Cat Video Generator", "Because this is the merriest way to make money.")
					.purchasable.SetBuyPrice("code", 1000000)
					.purchasablerestrictable.AddDefaultPriceRestriction()
					.restrictable.AddRestriction(new AmountRestriction(game, generators.aisales, 1, 1))
					.SetRateSecond("money", 1000000)
			);
		}

		//Click
		{
			generators.click = game.AddGenerator(new ClickGenerator(game, "click", resources.code)
					.describable.Set("Clicker", "Dat finger.")
					.SetRate("code", 1)
			);
		}
	}

	//Upgrades
	{
		var upgrades = game.data.upgrades;

		//General
		{
			upgrades.free = game.AddUpgrade(new Upgrade(game, "free")
					.describable.Set("Free Stuff", "Swag.", "Gives you some free stuff.")
					.rewardable.AddReward(new ResourceReward(game, resources.code, 1000000000000000000))
					.rewardable.AddReward(new ResourceReward(game, resources.money, 2000000000000000000))
			);
			upgrades.hire = game.AddUpgrade(new Upgrade(game, "hire")
					.describable.Set("Job Postings", "Like a boss.", "Unleashes the recruiting pipeline.")
					.purchasable.SetBuyPrice("money", 50)
					.restrictable.AddRestriction(new AmountRestriction(game, resources.money, 1, 1))
			);
		}

		var sampleMultiplierUpgradeObject = {
			name: "testname",
			title: "Sample Title",
			effect: "Sample effect",
			description: "Sample description",
			resource: "money",
			price: 50,
			restrictamount: 5,
			multiplier: 0,
			callback: function(upgradeEntity) {
				upgradeEntity.describable.AddEffect("Effect!");
			}
		};
		var createMultiplierUpgrades = function(entity, objects) {
			each(objects, function(object) {
				if (object instanceof Upgrade) {
					game.AddUpgrade(object);
					return;
				}
				var effect;
				if (entity instanceof CodeGenerator) {
					var speed = ((object.multiplier - 1) * 100) + "% faster";
					if (object.multiplier == 2) {
						speed = "twice as fast";
					}
					if (object.multiplier == 3) {
						speed = "three times as fast";
					}
					if (object.multiplier == 4) {
						speed = "four times as fast";
					}
					effect = entity.describable.GetPlural() + " code " + speed + ".";
				}
				else if (entity instanceof MoneyGenerator) {
					effect = entity.describable.GetPlural() + " generate " +
					(object.multiplier == 2 ? "twice" : (object.multiplier * 100) + "%") + " their income.";
				}

				var upgrade = game.AddUpgrade(new Upgrade(game, object.name)
						.describable.Set(object.title, object.description, effect)
						.purchasable.SetBuyPrice(object.resource, object.price)
						.purchasablerestrictable.AddDefaultPriceRestriction()
						.restrictable.AddRestriction(new AmountRestriction(game, entity, 2, object.restrictamount))
						.rewardable.AddReward(new MultiplierReward(game, entity, object.multiplier))
				);
				if (object.callback) {
					object.callback(upgrade);
				}
			});
		};

		//Hires
		{
			createMultiplierUpgrades(generators.intern, [
				{
					name: "swagstickers",
					title: "Swag Laptop Stickers",
					description: "Fill those laptop backs!",
					resource: "money",
					price: 1000,
					restrictamount: 10,
					multiplier: 1.5
				},
				{
					name: "chips",
					title: "Free Chips",
					description: "Something for your interns to snack on. Be careful of greasy keyboards.",
					resource: "money",
					price: 6000,
					restrictamount: 20,
					multiplier: 2
				},
				{
					name: "sode",
					title: "Free Soda",
					description: "It's also called 'pop' in Canada.",
					resource: "money",
					price: 15000,
					restrictamount: 30,
					multiplier: 2
				},
				new Upgrade(game, "internwhip")
					.describable.Set("Whip the interns", "In reality, you're really just whipping the ground to scare them to work faster.",
					"Interns code 20 times faster for 10 minutes, but there's a small chance for an intern to escape every minute.")
					.purchasable.SetBuyPrice("money", 500000)
					.restrictable.AddRestriction(new AmountRestriction(game, generators.intern, 2, 40))
					.restrictable.AddRestriction(new AmountRestriction(game, resources.money, 2, 500000 / 10))
					.AddComponent(Amount)
					.AddComponent(ExponentialAmountPurchasable)
					.exponentialamountpurchasable.SetExponentialFactor(4)
				,
				{
					name: "uniform",
					title: "Free Intern Uniforms",
					description: "The official intern uniform.",
					resource: "money",
					price: 500000,
					restrictamount: 50,
					multiplier: 2
				},
				new Upgrade(game, "monthlyhackathon")
					.describable.Set("Monthly Intern Hackathons", "The panel of judges will give away 3 prizes at the end of each event.",
					"Interns starts coding with 1 more line per second.")
					.purchasable.SetBuyPrice("money", 2000000)
					.restrictable.AddRestriction(new AmountRestriction(game, generators.intern, 2, 60))
					.restrictable.AddRestriction(new AmountRestriction(game, resources.money, 2, 2000000 / 2))
					.rewardable.AddReward(new BaseRateReward(game, generators.intern, "code", game.GetRateTickFromSecond(1)))
				,
				{
					name: "texbooks",
					title: "Free Textbook Lending",
					description: "Any textbook you need.",
					resource: "money",
					price: 4000000,
					restrictamount: 70,
					multiplier: 2
				},
				{
					name: "promembership",
					title: "Lifetime Pro Membership",
					description: "Pro membership to whatever we're selling. Apps, services, anything for the interns.",
					resource: "money",
					price: 30000000,
					restrictamount: 80,
					multiplier: 2
				},
				{
					name: "ferrero",
					title: "Free Ferrero Rocher",
					description: "Those interns are gonna be nuts when they get a taste of this hazelnut flavored chocolate.",
					resource: "money",
					price: 90000000,
					restrictamount: 90,
					multiplier: 2
				},
				new Upgrade(game, "overtime")
					.describable.Set("Paid Overtime", "Overtime is paid 1.5x regular wages. Interns have student loans to pay. Win-win?",
					"Interns starts coding with 10 more line per second.")
					.purchasable.SetBuyPrice("money", 1000000000)
					.restrictable.AddRestriction(new AmountRestriction(game, generators.intern, 2, 100))
					.restrictable.AddRestriction(new AmountRestriction(game, resources.money, 2, 1000000000 / 10))
					.rewardable.AddReward(new BaseRateReward(game, generators.intern, "code", game.GetRateTickFromSecond(10)))
				,
				{
					name: "hackbook",
					title: "Hackbook pro",
					description: "A powerful laptop for a good cause.",
					resource: "money",
					price: 1000000000,
					restrictamount: 110,
					multiplier: 2
				},
				{
					name: "internevents",
					title: "Intern Events",
					description: "Road trips sounds nice. Let's also try skydiving.",
					resource: "money",
					price: 5000000000,
					restrictamount: 120,
					multiplier: 2
				},
				new Upgrade(game, "dedicatedmentors")
					.describable.Set("Dedicated Mentors", "Intern mentors are now full time mentors.",
					"Interns starts coding with 100 more line per second.")
					.purchasable.SetBuyPrice("money", 70000000000)
					.restrictable.AddRestriction(new AmountRestriction(game, generators.intern, 2, 130))
					.restrictable.AddRestriction(new AmountRestriction(game, resources.money, 2, 70000000000 / 10))
					.rewardable.AddReward(new BaseRateReward(game, generators.intern, "code", game.GetRateTickFromSecond(100)))
				,
				{
					name: "parentday",
					title: "Parent day",
					description: "Impress your parents with this free pair of round trip plane tickets & luxurious hotel arrangements for a visit to your workplace.",
					resource: "money",
					price: 70000000000,
					restrictamount: 140,
					multiplier: 2
				},
				{
					name: "interncampus",
					title: "Intern Campus",
					description: "A dedicated campus just for interns. I'm sure they'll appreciate it.",
					resource: "money",
					price: 300000000000,
					restrictamount: 150,
					multiplier: 2
				},
				{
					name: "scholarships",
					title: "Scholarships",
					description: "We'll also fund your education.",
					resource: "money",
					price: 2000000000000,
					restrictamount: 160,
					multiplier: 2
				}
			]);

			upgrades.internwhip.rewardable.AddReward(new ModifierReward(game, generators.intern,
				new WhippingModifier(game, 10 * 60 * game.tps, game.tps * 60, function(game) {
					var intern = game.data.generators.intern;
					if (randomInt(9) == 0) {
						intern.amount.Remove(1);
						intern.trigger('escape', intern);
					}
				}).SetMultiplier(20), upgrades.internwhip));

			createMultiplierUpgrades(generators.newgrad, [
				{
					name: "swagpingpong",
					title: "Swag Ping-Pong Balls",
					description: "Some ping-pong balls with the company logo printed.",
					resource: "money",
					price: 4000,
					restrictamount: 10,
					multiplier: 1.5
				},
				{
					name: "gymmember",
					title: "Free Gym Membership",
					description: "Workout around the block.",
					resource: "money",
					price: 300000,
					restrictamount: 40,
					multiplier: 2
				},
				{
					name: "swagtshirt",
					title: "Swag T-Shirts",
					description: "Good quality tech company t-shirts.",
					resource: "money",
					price: 100000000,
					restrictamount: 80,
					multiplier: 2
				},
				{
					name: "dualmonitor",
					title: "Dual Monitor Setup",
					description: "Two is better than one.",
					resource: "money",
					price: 20000000000,
					restrictamount: 120,
					multiplier: 2
				},
				{
					name: "onsitegym",
					title: "Free Onsite Gym",
					description: "Yoga classes included.",
					resource: "money",
					price: 5000000000000,
					restrictamount: 160,
					multiplier: 2
				}
			]);

			createMultiplierUpgrades(generators.contractor, [
				{
					name: "skypebusiness",
					title: "Skype Business License",
					description: "Now you can group conference call!",
					resource: "money",
					price: 15000,
					restrictamount: 10,
					multiplier: 1.5
				},
				{
					name: "freedeliveredlunch",
					title: "Free Delivered Lunch",
					description: "Here's some free food.",
					resource: "money",
					price: 1000000,
					restrictamount: 40,
					multiplier: 2
				},
				{
					name: "freedropbox",
					title: "Free Dropbox Pro",
					description: "Sync those files!",
					resource: "money",
					price: 300000000,
					restrictamount: 80,
					multiplier: 2
				},
				{
					name: "frequentflier",
					title: "Frequent Flier Program",
					description: "For those who needs to fly into the office.",
					resource: "money",
					price: 80000000000,
					restrictamount: 120,
					multiplier: 2
				},
				{
					name: "healthinsurance",
					title: "Health Insurance",
					description: "In the end... they're still like employees",
					resource: "money",
					price: 25000000000000,
					restrictamount: 160,
					multiplier: 2
				}
			]);

			createMultiplierUpgrades(generators.programmer, [
				{
					name: "dollarkeyboards",
					title: "Dedicated '$' Keyboards",
					description: "Designed for PHP developers by PHP developers.",
					resource: "money",
					price: 80000,
					restrictamount: 10,
					multiplier: 1.5
				},
				{
					name: "coffee",
					title: "Free Coffee",
					description: "Convert coffee to code.",
					resource: "money",
					price: 6000000,
					restrictamount: 40,
					multiplier: 2
				},
				{
					name: "intellij",
					title: "IntelliJ Licenses",
					description: "Seriously, try it.",
					resource: "money",
					price: 1500000000,
					restrictamount: 80,
					multiplier: 2
				},
				{
					name: "ssds",
					title: "SSDs",
					description: "Blazing fast boot speeds.",
					resource: "money",
					price: 400000000000,
					restrictamount: 120,
					multiplier: 2
				},
				{
					name: "transportation",
					title: "Commuter Stipend",
					description: "Flights are not included.",
					resource: "money",
					price: 100000000000000,
					restrictamount: 160,
					multiplier: 2
				}
			]);

			createMultiplierUpgrades(generators.senior, [
				{
					name: "organicfruits",
					title: "Organic Fruits",
					description: "Fresh locally-sourced apples, oranges and bananas.",
					resource: "money",
					price: 500000,
					restrictamount: 10,
					multiplier: 1.5
				},
				{
					name: "kidtowork",
					title: "Take Your Kid To Work Days",
					description: "\"Officer, we swear that this is not child labor.\"",
					resource: "money",
					price: 30000000,
					restrictamount: 40,
					multiplier: 2
				},
				{
					name: "familyhealthinsurance",
					title: "Family Health Insurance",
					description: "Now that my family is insured.",
					resource: "money",
					price: 8000000000,
					restrictamount: 80,
					multiplier: 2
				},
				{
					name: "daycare",
					title: "Day Care Program",
					description: "No need to worry about kids during summer breaks.",
					resource: "money",
					price: 2000000000000,
					restrictamount: 120,
					multiplier: 2
				},
				{
					name: "pension",
					title: "Pension Plan",
					description: "Planning for retirement already?",
					resource: "money",
					price: 500000000000000,
					restrictamount: 160,
					multiplier: 2
				}
			]);

			createMultiplierUpgrades(generators.architect, [
				{
					name: "whiteboard",
					title: "Whiteboards",
					description: "Large whiteboards are ideal for drawing diagrams.",
					resource: "money",
					price: 1200000,
					restrictamount: 10,
					multiplier: 1.5
				},
				{
					name: "freebeer",
					title: "Free Beer",
					description: "Get the perfect blood alcohol level for coding.",
					resource: "money",
					price: 100000000,
					restrictamount: 40,
					multiplier: 2
				},
				{
					name: "ergokeyboard",
					title: "Ergonomic Keyboard",
					description: "The only place where one keyboard may come in two pieces.",
					resource: "money",
					price: 25000000000,
					restrictamount: 80,
					multiplier: 2
				},
				{
					name: "standingdesk",
					title: "Standing Desks",
					description: "They said it would reduce back pain.",
					resource: "money",
					price: 6000000000000,
					restrictamount: 120,
					multiplier: 2
				},
				{
					name: "pto",
					title: "Paid Time Off",
					description: "I mean, you don't need to redesign the whole system every day, right?",
					resource: "money",
					price: 1500000000000000,
					restrictamount: 160,
					multiplier: 2
				}
			]);

			createMultiplierUpgrades(generators.teamlead, [
				{
					name: "cocktail",
					title: "Free Cocktails",
					description: "An all inclusive experience, bartender included. Great selection of more than 30 drinks!",
					resource: "money",
					price: 10000000,
					restrictamount: 10,
					multiplier: 1.5
				},
				{
					name: "onsitemassages",
					title: "Onsite Massages",
					description: "Professional stress reliever.",
					resource: "money",
					price: 600000000,
					restrictamount: 40,
					multiplier: 2
				},
				{
					name: "ergochairs",
					title: "Ergonomic Office Chairs",
					description: "We're really tired of beanbags.",
					resource: "money",
					price: 150000000000,
					restrictamount: 80,
					multiplier: 2
				},
				{
					name: "petworkplace",
					title: "Pet Friendly Workplace",
					description: "Office dogs, anyone?",
					resource: "money",
					price: 40000000000000,
					restrictamount: 120,
					multiplier: 2
				},
				{
					name: "petinsurance",
					title: "Pet Insurance Policy",
					description: "Peace of mind for your pets.",
					resource: "money",
					price: 10000000000000000,
					restrictamount: 160,
					multiplier: 2
				}
			]);

			createMultiplierUpgrades(generators.startup, [
				{
					name: "trophyofrecognition",
					title: "Trophy of Recognition",
					description: "Giving some respect goes a long way.",
					resource: "money",
					price: 40000000,
					restrictamount: 10,
					multiplier: 1.5
				},
				{
					name: "themedoffice",
					title: "Themed Office Area",
					description: "A big sign saying: \"[Startup Name Here] team\".",
					resource: "money",
					price: 2500000000,
					restrictamount: 40,
					multiplier: 2
				},
				{
					name: "teamtrips",
					title: "Team trips",
					description: "Ski trips, anyone?",
					resource: "money",
					price: 600000000000,
					restrictamount: 80,
					multiplier: 2
				},
				{
					name: "stockoptions",
					title: "Stock Options",
					description: "Sharing is caring!",
					resource: "money",
					price: 150000000000000,
					restrictamount: 120,
					multiplier: 2
				},
				{
					name: "dedicatedprojectfunding",
					title: "Dedicated Project Funding",
					description: "Be your own boss, kinda.",
					resource: "money",
					price: 40000000000000000,
					restrictamount: 160,
					multiplier: 2
				}
			]);

			//others
			//- Instant Noodles
			//- Mcdonalds
			//- Catered Lunch
			//- In-house Cafe
			//- In-house Kitchen
			//- Five Star Chef
			//- Holiday Party
			//- Halloween Party
			//- Thanksgiving Dinner

			upgrades.cateredlunch = game.AddUpgrade(new Upgrade(game, "cateredlunch")
					.describable.Set("Catered lunch", "Never bring lunch or eat out again.", "Everyone codes 3% faster.")
					.purchasable.SetBuyPrice("money", 1000000)
					.purchasablerestrictable.AddDefaultPriceRestriction()
					.rewardable.AddReward(new MultiplierReward(game, resources.code, 1.03))
			);
		}

		//Features
		{
			createMultiplierUpgrades(generators.webapp, [
				{
					name: "onlineads",
					title: "Online Ads",
					description: "Most people can't even imagine how profitable advertising is.",
					resource: "code",
					price: 120,
					restrictamount: 10,
					multiplier: 1.5
				},
				{
					name: "sqlinjection",
					title: "SQL Injection Protection",
					description: "Why didn't we think about this before.",
					resource: "code",
					price: 7000,
					restrictamount: 40,
					multiplier: 2
				},
				{
					name: "xssdetector",
					title: "XSS Detector",
					description: "That'll teach ya hackers a lesson!",
					resource: "code",
					price: 2000000,
					restrictamount: 80,
					multiplier: 2
				},
				{
					name: "ddosprotect",
					title: "DDoS Protection",
					description: "99.9999 uptime guaranteed!",
					resource: "code",
					price: 500000000,
					restrictamount: 120,
					multiplier: 2
				},
				{
					name: "sslcert",
					title: "SSL Certificate",
					description: "Your connection to this website is encrypted with 42-bit encryption",
					resource: "code",
					price: 130000000000,
					restrictamount: 160,
					multiplier: 2
				}
			]);

			createMultiplierUpgrades(generators.abtesting, [
				{
					name: "sqlite",
					title: "SQLite Database",
					description: "Simple & Easy. Doesn't really scale.",
					resource: "code",
					price: 800,
					restrictamount: 10,
					multiplier: 1.5
				},
				{
					name: "mysql",
					title: "MySQL Database",
					description: "Industry-proven.",
					resource: "code",
					price: 50000,
					restrictamount: 40,
					multiplier: 2
				},
				{
					name: "oracle",
					title: "Oracle Database",
					description: "Heavy-weight heavy-duty.",
					resource: "code",
					price: 13000000,
					restrictamount: 80,
					multiplier: 2
				},
				{
					name: "datacenter",
					title: "Dedicated Data-Center",
					description: "Why pay others when you can host your own?",
					resource: "code",
					price: 3000000000,
					restrictamount: 120,
					multiplier: 2
				},
				{
					name: "hadoop",
					title: "Hadoop Distributed Computing",
					description: "Big data is apparently...REALLY BIG.",
					resource: "code",
					price: 700000000000,
					restrictamount: 160,
					multiplier: 2
				}
			]);

			createMultiplierUpgrades(generators.emailcampaign, [
				{
					name: "newsletter",
					title: "Newsletter",
					description: "Social media aggregation? Check.",
					resource: "code",
					price: 5000,
					restrictamount: 10,
					multiplier: 1.5
				},
				{
					name: "unsubscribe",
					title: "Option to Unsubscribe",
					description: "I've been waiting for this long enough.",
					resource: "code",
					price: 300000,
					restrictamount: 40,
					multiplier: 2
				},
				{
					name: "promotion",
					title: "Promotion Emails",
					description: "Your weekly deals.",
					resource: "code",
					price: 75000000,
					restrictamount: 80,
					multiplier: 2
				},
				{
					name: "ecards",
					title: "Birthday/Holiday E-Cards",
					description: "A surprising amount of people still use this, even though it sounds so 2000.",
					resource: "code",
					price: 20000000000,
					restrictamount: 120,
					multiplier: 2
				},
				{
					name: "targetedemails",
					title: "Targeted Emails",
					description: "You didn't think that personal email written to your name was written by me algorithm, did you?",
					resource: "code",
					price: 5000000000000,
					restrictamount: 160,
					multiplier: 2
				}
			]);

			createMultiplierUpgrades(generators.desktop, [
				{
					name: "backgroudprocess",
					title: "Background Process",
					description: "Always running, silently.",
					resource: "code",
					price: 20000,
					restrictamount: 10,
					multiplier: 1.5
				},
				{
					name: "cli",
					title: "Command-Line Interface",
					description: "GUI's are for the weak.",
					resource: "code",
					price: 1200000,
					restrictamount: 40,
					multiplier: 2
				},
				{
					name: "autoupdates",
					title: "Automatic Updates",
					description: "You won't even need a restart!",
					resource: "code",
					price: 300000000,
					restrictamount: 80,
					multiplier: 2
				},
				{
					name: "nativeui",
					title: "Native UI",
					description: "It's time to ditch the WebView and go native!",
					resource: "code",
					price: 75000000000,
					restrictamount: 120,
					multiplier: 2
				},
				{
					name: "cpprewrite",
					title: "C++ rewrite",
					description: "Well... This may take a while.",
					resource: "code",
					price: 20000000000000,
					restrictamount: 160,
					multiplier: 2
				}
			]);

			createMultiplierUpgrades(generators.mobileapp, [
				{
					name: "inappads",
					title: "In-App Ads",
					description: "SomeApp Free (Get the pro version to remove ads)",
					resource: "code",
					price: 100000,
					restrictamount: 10,
					multiplier: 1.5
				},
				{
					name: "inapppurchase",
					title: "In-App Purchase",
					description: "Virtual goods costs a lot, you know?",
					resource: "code",
					price: 6000000,
					restrictamount: 40,
					multiplier: 2
				},
				{
					name: "featuredappstore",
					title: "Featured in App Store",
					description: "Featured App of the week!",
					resource: "code",
					price: 1500000000,
					restrictamount: 80,
					multiplier: 2
				},
				{
					name: "pressreview",
					title: "Press Review",
					description: "Get trusted Tech aggregates, blogs, and reviewers to review your app!",
					resource: "code",
					price: 400000000000,
					restrictamount: 120,
					multiplier: 2
				},
				{
					name: "preloadedapps",
					title: "Preloaded Apps",
					description: "Partner with wireless carriers to preload your app in mobile phones.",
					resource: "code",
					price: 100000000000000,
					restrictamount: 160,
					multiplier: 2
				}
			]);

			createMultiplierUpgrades(generators.seoalgo, [
				{
					name: "trendanalysis",
					title: "Trend Analysis",
					description: "Catch the waves and bring traffic to your business.",
					resource: "code",
					price: 400000,
					restrictamount: 10,
					multiplier: 1.5
				},
				{
					name: "inapppurchase",
					title: "Keyword Spamming",
					description: "The good ol' Black-Hat trick.",
					resource: "code",
					price: 25000000,
					restrictamount: 40,
					multiplier: 2
				},
				{
					name: "featuredappstore",
					title: "URL Normalization",
					description: "Redirects, redirects, redirects.",
					resource: "code",
					price: 6000000000,
					restrictamount: 80,
					multiplier: 2
				},
				{
					name: "pressreview",
					title: "Paid Ranks",
					description: "If it all fails, just pay the search engine.",
					resource: "money",
					price: 1500000000000,
					restrictamount: 120,
					multiplier: 2
				},
				{
					name: "preloadedapps",
					title: "Search Engine Partnerships",
					description: "Optimize to the max by browsing the search engine's source code.",
					resource: "code",
					price: 350000000000000,
					restrictamount: 160,
					multiplier: 2
				}
			]);

			createMultiplierUpgrades(generators.aisales, [
				{
					name: "telepresence",
					title: "Tele-Presence Devices",
					description: "Robots looking like robots acting like humans.",
					resource: "code",
					price: 1600000,
					restrictamount: 10,
					multiplier: 1.5
				},
				{
					name: "terabitintenet",
					title: "Terabit Internet Access",
					description: "(Nearly) Unlimited bandwidth.",
					resource: "code",
					price: 100000000,
					restrictamount: 40,
					multiplier: 2
				},
				{
					name: "machinelearning",
					title: "Machine Learning Algorithm",
					description: "Mathematical & Statistical.",
					resource: "code",
					price: 25000000000,
					restrictamount: 80,
					multiplier: 2
				},
				{
					name: "geneticalgorithm",
					title: "Genetic Algorithm",
					description: "Artificial evolution.",
					resource: "code",
					price: 35000000000000,
					restrictamount: 120,
					multiplier: 2
				},
				{
					name: "neuralnetworks",
					title: "Neural Networks",
					description: "Brain simulation gone wrong.",
					resource: "code",
					price: 6000000000000,
					restrictamount: 160,
					multiplier: 2
				}
			]);

			createMultiplierUpgrades(generators.catvidgen, [
				{
					name: "4khd",
					title: "4K HD video",
					description: "Ultra high definition like you've never seen before.",
					resource: "code",
					price: 8000000,
					restrictamount: 10,
					multiplier: 1.5
				},
				{
					name: "meowsimulator",
					title: "Meow Simulator",
					description: "Awwwwwwwwwww.",
					resource: "code",
					price: 500000000,
					restrictamount: 40,
					multiplier: 2
				},
				{
					name: "catpicanalysis",
					title: "Cat Picture Analysis Algorithm",
					description: "Once you've got enough, the rest will come along.",
					resource: "code",
					price: 130000000000,
					restrictamount: 80,
					multiplier: 2
				},
				{
					name: "tactilefeedback",
					title: "Tactile Feedback",
					description: "Come here, you cute little fluffy ball.",
					resource: "code",
					price: 32000000000000,
					restrictamount: 120,
					multiplier: 2
				},
				{
					name: "vrcatcafe",
					title: "VR Cat Cafe",
					description: "Buy this VR set for ony $999.99. Includes cat simulation.",
					resource: "code",
					price: 8000000000000000,
					restrictamount: 160,
					multiplier: 2
				}
			]);

			/*
			 all
			 -Free Online Hosting
			 -Dedicated Server Hosting
			 -Amazon Web Services Hosting
			 -Content Distribution Network
			 -The Cloud TM

			 */

		}
	}

	// Achievements
	{
		var achievements = game.data.achievements;

		var sampleAmountAchievementObject = {
			amount: 1,
			title: "Sample Title",
			description: "Sample description",
			callback: function(achievementEntity) {
				achievementEntity.describable.AddEffect("Effect!");
			}
		};
		var createAmountAchievements = function(entity, objects, generate) {
			var name = entity.GetName();
			each(objects, function(object) {
				var achievement = game.AddAchievement(new AmountAchievement(game, name + object.amount, entity, object.amount)
						.describable.Set(object.title, object.description)
				);
				if (generate) {
					achievement.AddDefaultProduceEffect();
				} else {
					achievement.AddDefaultPurchaseEffect();
				}
				if (object.callback) {
					object.callback(achievement);
				}
			});
		};

		// Resources
		{
			createAmountAchievements(resources.money, [
				{amount: 1, title: "Barely Profitable", description: "Now go buy some ramen."},
				{amount: 1000, title: "Running a Business", description: "Moderate income."},
				{amount: 1000000, title: "Millionaire", description: "Get all the chicks you want."},
				{amount: 1000000000, title: "Billionaire", description: "Make it rain."},
				{
					amount: 1000000000000,
					title: "The World Bank",
					description: "Lend money to other countries. Watch out for the US government."
				}
			], true);

			createAmountAchievements(resources.code, [
				{amount: 10, title: "Hello world", description: ""},
				{amount: 100000, title: "One Hundred-Thousand Lines", description: "Size of Photoshop 1.0."},
				{amount: 1000000, title: "Lines by the Millions", description: "Size of Age of empires online."},
				{amount: 10000000, title: "Age of Browsers", description: "Size of Firefox."},
				{amount: 50000000, title: "Entire Operating Systems", description: "Size of Windows Vista."},
				{
					amount: 100000000,
					title: "Self Driving Cars?",
					description: "Just enough code to fit in a modern car (software)."
				},
				{amount: 1000000000, title: "Monolithic", description: "Largest software on earth."},
				{
					amount: 1000000000000,
					title: "Think Like a Person",
					description: "Achieve artificial human intelligence."
				},
				{amount: 3300000000000, title: "Human", description: "Size of the human DNA."}
			], true);
		}

		//Hires
		{
			createAmountAchievements(generators.intern, [
				{amount: 1, title: "The Internship", description: ""},
				{amount: 50, title: "Class of 2015", description: ""},
				{amount: 100, title: "Intern Catastrophe", description: ""},
				{amount: 150, title: "Internapocalypse", description: ""},
				{amount: 200, title: "University Campus", description: ""}
			]);
			game.AddAchievement(new WhippingAchievement(game, "whip1", generators.intern, 1)
					.describable.Set("There's A First In Everything", "Ouch!", "Whip the interns.")
			);
			game.AddAchievement(new WhippingAchievement(game, "whip10", generators.intern, 10)
					.describable.Set("Faster!", "Ouch!", "Whip interns 10 times.")
			);
			game.AddAchievement(new WhippingAchievement(game, "whip50", generators.intern, 50)
					.describable.Set("Intern Protest", "Ouch!", "Whip interns 50 times.")
			);
			game.AddAchievement(new WhippingAchievement(game, "whip100", generators.intern, 100)
					.describable.Set("Intern Revolution", "Ouch!", "Whip interns 100 times.")
			);

			game.AddAchievement(new EscapeAchievement(game, "escape1", generators.intern, 1)
					.describable.Set("The Great Escape", "I sure hope it doesn't impact our reputation.", "Have 1 intern escape.")
			);
			game.AddAchievement(new EscapeAchievement(game, "escape10", generators.intern, 10)
					.describable.Set("Prison Break", "We're losing the herd.", "Have 10 interns escape.")
			);
			game.AddAchievement(new EscapeAchievement(game, "escape20", generators.intern, 20)
					.describable.Set("Run Forrest Run", "Run for it!", "Have 20 interns escape.")
			);
			game.AddAchievement(new EscapeAchievement(game, "escape40", generators.intern, 40)
					.describable.Set("Catch Me If You Can", "Pesky interns!", "Have 40 interns escape.")
			);
			game.AddAchievement(new EscapeAchievement(game, "escape100", generators.intern, 100)
					.describable.Set("I'm sorry", "This isn't fun anymore", "Have 100 interns escape.")
			);

			createAmountAchievements(generators.newgrad, [
				{amount: 1, title: "Fresh Grad", description: ""},
				{amount: 50, title: "Hacky Code", description: ""},
				{amount: 100, title: "Junior Junior", description: ""},
				{amount: 150, title: "Young Professionals", description: ""},
				{amount: 200, title: "Yolo", description: ""}
			]);
			createAmountAchievements(generators.contractor, [
				{amount: 1, title: "Working Remotely", description: ""},
				{amount: 50, title: "Subcontracting", description: ""},
				{amount: 100, title: "Outsourcing", description: ""},
				{amount: 150, title: "Offshore Contracting", description: ""},
				{amount: 200, title: "Crowdsourcing", description: ""}
			]);
			createAmountAchievements(generators.programmer, [
				{amount: 1, title: "Ready to Code", description: ""},
				{amount: 50, title: "Code Monkeys", description: ""},
				{amount: 100, title: "Coding Contest", description: ""},
				{amount: 150, title: "Floor of Coders", description: ""},
				{amount: 200, title: "Code Merge Disaster", description: ""}
			]);
			createAmountAchievements(generators.senior, [
				{amount: 1, title: "Slow and Steady", description: ""},
				{amount: 50, title: "Demanding Code Reviews", description: ""},
				{amount: 100, title: "Reliability First", description: ""},
				{amount: 150, title: "Rich and Accomplished", description: ""},
				{amount: 200, title: "Retirement Home", description: ""}
			]);
			createAmountAchievements(generators.architect, [
				{amount: 1, title: "Professional Refactorer", description: ""},
				{amount: 50, title: "Design Document Overflow", description: ""},
				{amount: 100, title: "Code Modularization", description: ""},
				{amount: 150, title: "Standardization Conflict", description: ""},
				{amount: 200, title: "Too Many Library Imports", description: ""}
			]);
			createAmountAchievements(generators.teamlead, [
				{amount: 1, title: "Leadership", description: ""},
				{amount: 50, title: "50 Shades of Grey", description: ""},
				{amount: 100, title: "Too Many Teams", description: ""},
				{amount: 150, title: "A Team for Almost Everything", description: ""},
				{amount: 200, title: "Who Are We Leading, Anyway?", description: ""}
			]);
			createAmountAchievements(generators.startup, [
				{amount: 1, title: "Subsidiary", description: ""},
				{amount: 50, title: "Aqua-Hire", description: ""},
				{amount: 100, title: "Serial-Acquirer", description: ""},
				{amount: 150, title: "On a Roll", description: ""},
				{amount: 200, title: "Company Eater", description: ""}
			]);
		}

		//Features
		{
			createAmountAchievements(generators.webapp, [
				{amount: 1, title: "It's Live!", description: ""},
				{amount: 50, title: "Alexa Top 100", description: ""},
				{amount: 100, title: "Dot-Com Boom", description: ""},
				{amount: 150, title: "Internationalized Domain Names", description: ""},
				{amount: 200, title: "Generic Top-Level Domains", description: ""}
			]);
			createAmountAchievements(generators.abtesting, [
				{amount: 1, title: "Analytics Works", description: ""},
				{amount: 50, title: "Scientific Decisions", description: ""},
				{amount: 100, title: "User-Driven", description: ""},
				{amount: 150, title: "Research in Progress", description: ""},
				{amount: 200, title: "Revealing Human Nature", description: ""}
			]);
			createAmountAchievements(generators.emailcampaign, [
				{amount: 1, title: "Housing an SMTP Server", description: ""},
				{amount: 50, title: "Email Templating", description: ""},
				{amount: 100, title: "Inbox Flooding", description: ""},
				{amount: 150, title: "Natural Language Generator", description: ""},
				{amount: 200, title: "SmartSpam\u2122", description: ""} //trademark sign
			]);
			createAmountAchievements(generators.desktop, [
				{amount: 1, title: "Unzip This File", description: ""},
				{amount: 50, title: "Please do Not Lose Your CD-KEY", description: ""},
				{amount: 100, title: "InstallShield Express Installer", description: ""},
				{amount: 150, title: "Auto-Update", description: ""},
				{amount: 200, title: "Mass Deployment", description: ""}
			]);
			createAmountAchievements(generators.mobileapp, [
				{amount: 1, title: "iOS & Android!", description: ""},
				{amount: 50, title: "Internal App Store", description: ""},
				{amount: 100, title: "App Generator", description: ""},
				{amount: 150, title: "Out of Phone Memory", description: ""},
				{amount: 200, title: "Top Rated Apps", description: ""}
			]);
			createAmountAchievements(generators.seoalgo, [
				{amount: 1, title: "Keywords Everywhere", description: ""},
				{amount: 50, title: "Front Page Results", description: ""},
				{amount: 100, title: "Advanced Internet Marketing", description: ""},
				{amount: 150, title: "Fully Automated Internet Marketing", description: ""},
				{amount: 200, title: "Paid Search Results", description: ""}
			]);
			createAmountAchievements(generators.aisales, [
				{amount: 1, title: "Enterprise Targeted", description: ""},
				{amount: 50, title: "Closing Deals", description: ""},
				{amount: 100, title: "Wins of the Week", description: ""},
				{amount: 150, title: "Automatic Partnerships", description: ""},
				{amount: 200, title: "Salesforce", description: ""}
			]);
			createAmountAchievements(generators.catvidgen, [
				{amount: 1, title: "Kittens!", description: ""},
				{amount: 10, title: "Viral Content", description: ""},
				{amount: 50, title: "View-count Through the roofs", description: ""},
				{amount: 100, title: "The New Youtube", description: ""},
				{amount: 150, title: "The Default Screensaver", description: ""}
			]);

		}
	}

	game.GetGenerator("intern").on("modifier_add", function(entity, modifier) {
		if (modifier.name == "whipped") {
			console.log("Play sound 'whip'");
		}
	}, this);

	game.GetGenerator("intern").on("escape", function(entity) {
		console.log("Notify: An intern has escaped!");
	}, this);

	return game;
})();
