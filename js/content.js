var CodeGenerator = function(game, name) {
	Generator.call(this, game, name);
};
extend(CodeGenerator, Generator, {});

var InternGenerator = function(game, name) {
	CodeGenerator.call(this, game, name);
	this.AddComponent(Modifiable);
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
	Modifier.call(this, game, 'whip', ticks);
	this.multiplier = 1;
	this.tickrate = tickrate;
	this.callback = callback;
};
extend(WhippingModifier, Modifier, {
	SetMultiplier: function(multiplier) {
		this.multiplier = multiplier;
		return this;
	},
	Activate: function(modifiable) {
		Modifier.prototype.Activate.call(this, modifiable);
		this.entity.multiplier.Mult(this.multiplier);
	},
	Deactivate: function(modifiable) {
		Modifier.prototype.Deactivate.call(this, modifiable);
		this.entity.multiplier.Div(this.multiplier);
	},
	Tick: function(modifiable) {
		var ticks = modifiable.modifiers[this.name];
		if (this.callback && ticks % this.tickrate == 0) {
			this.callback(this.game);
		}
		Modifier.prototype.Tick.call(this, modifiable);
	}
});

var WhippingAchievement = function(game, name, entity, count) {
	Achievement.call(this, game, name);
	this.entity = entity;
	this.count = count;
	this.entity.on('modifier_activate', this.Check, this);
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
	this.entity.on('escape', this.Check, this);
};
extend(EscapeAchievement, Achievement, {
	Check: function() {
		if (!this.obtainable.GetObtained() && this.entity.escaped >= this.count) {
			console.log("Obtained " + this.name);
			this.obtainable.Obtain();
		}
	}
});

var CreateGame = function() {

	var game = new Game();

	//Resources
	{
		var resources = game.data.resources;

		resources.money = game.AddResource(new Resource(game, "money")
				.describable.SetTitle("$")
				.describable.SetPlural("$")
				.SetFormatter("genrate", function(rate) {
					return "Generates " + formatDollar(rate * game.GetTicksPerSecond()) + " per second.";
				})
				.SetFormatter("totalgenrate", function(rate) {
					return "Together generates " + formatDollar(rate * game.GetTicksPerSecond()) + " per second.";
				})
		);
		resources.code = game.AddResource(new Resource(game, "code")
				.describable.SetTitle("line of code")
				.describable.SetPlural("lines of code")
				.SetFormatter("genrate", function(rate) {
					return "Produces " + formatLinesOfCodePerSec(rate * game.GetTicksPerSecond()) + " per second.";
				})
				.SetFormatter("totalgenrate", function(rate) {
					return "Together produces " + formatLinesOfCodePerSec(rate * game.GetTicksPerSecond()) + " per second.";
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
					.modifiable.AddModifier(new WhippingModifier(game, 10 * 60 * game.tps, game.tps * 60, function(game) {
						var intern = game.data.generators.intern;
						if (intern.amount.Get() > 0 && randomInt(9) == 0) {
							intern.amount.Remove(1);
							intern.trigger('escape', intern);
						}
					}).SetMultiplier(20))
			);
			generators.newgrad = game.AddGenerator(new CodeGenerator(game, "newgrad")
					.describable.Set("New Grad", "Fresh out of college, will code for food.")
					.purchasable.SetBuyPrice("money", 500)
					.purchasablerestrictable.AddDefaultPriceRestriction()
					.restrictable.AddRestriction(new AmountRestriction(game, generators.intern, 1, 1))
					.SetRateSecond("code", 1)
			);
			generators.contractor = game.AddGenerator(new CodeGenerator(game, "contractor")
					.describable.Set("Contractor", "Like a normal employee, except you don't have to pay for his insurance.")
					.purchasable.SetBuyPrice("money", 2000)
					.purchasablerestrictable.AddDefaultPriceRestriction()
					.restrictable.AddRestriction(new AmountRestriction(game, generators.newgrad, 1, 1))
					.SetRateSecond("code", 8)
			);
			generators.programmer = game.AddGenerator(new CodeGenerator(game, "programmer")
					.describable.Set("Programmer", "Coffee in, code out.")
					.purchasable.SetBuyPrice("money", 10000)
					.purchasablerestrictable.AddDefaultPriceRestriction()
					.restrictable.AddRestriction(new AmountRestriction(game, generators.contractor, 1, 1))
					.SetRateSecond("code", 50)
			);
			generators.senior = game.AddGenerator(new CodeGenerator(game, "senior")
					.describable.Set("Senior Programmer", "No no no, you're doing it all wrong!")
					.purchasable.SetBuyPrice("money", 50000)
					.purchasablerestrictable.AddDefaultPriceRestriction()
					.restrictable.AddRestriction(new AmountRestriction(game, generators.programmer, 1, 1))
					.SetRateSecond("code", 300)
			);
			generators.architect = game.AddGenerator(new CodeGenerator(game, "architect")
					.describable.Set("Software Architect", "Writes design documents, and then code.")
					.purchasable.SetBuyPrice("money", 200000)
					.purchasablerestrictable.AddDefaultPriceRestriction()
					.restrictable.AddRestriction(new AmountRestriction(game, generators.senior, 1, 1))
					.SetRateSecond("code", 2000)
			);
			generators.teamlead = game.AddGenerator(new CodeGenerator(game, "teamlead")
					.describable.Set("Team Lead", "Manages programmers, and code on spare time (Yes they have a lot of spare time).")
					.purchasable.SetBuyPrice("money", 1000000)
					.purchasablerestrictable.AddDefaultPriceRestriction()
					.restrictable.AddRestriction(new AmountRestriction(game, generators.architect, 1, 1))
					.SetRateSecond("code", 11000)
			);
			generators.startup = game.AddGenerator(new CodeGenerator(game, "startup")
					.describable.Set("Startup", "Move fast, break things.")
					.purchasable.SetBuyPrice("money", 5000000)
					.purchasablerestrictable.AddDefaultPriceRestriction()
					.restrictable.AddRestriction(new AmountRestriction(game, generators.teamlead, 1, 1))
					.SetRateSecond("code", 90000)
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
					.SetRateSecond("money", 2)
			);
			generators.emailcampaign = game.AddGenerator(new MoneyGenerator(game, "emailcampaign")
					.describable.Set("Email Campaign", "The fine line between email campaign and spamming.")
					.describable.SetPlural("Email campaign")
					.purchasable.SetBuyPrice("code", 600)
					.purchasablerestrictable.AddDefaultPriceRestriction()
					.restrictable.AddRestriction(new AmountRestriction(game, generators.abtesting, 1, 1))
					.SetRateSecond("money", 15)
			);
			generators.desktop = game.AddGenerator(new MoneyGenerator(game, "desktop")
					.describable.Set("Desktop Application", "Applications that won't run on a Chromebook.")
					.purchasable.SetBuyPrice("code", 2500)
					.purchasablerestrictable.AddDefaultPriceRestriction()
					.restrictable.AddRestriction(new AmountRestriction(game, generators.emailcampaign, 1, 1))
					.SetRateSecond("money", 80)
			);
			generators.mobileapp = game.AddGenerator(new MoneyGenerator(game, "mobileapp")
					.describable.Set("Mobile App", "The reason why your phone battery never lasts for more than one day.")
					.purchasable.SetBuyPrice("code", 12000)
					.purchasablerestrictable.AddDefaultPriceRestriction()
					.restrictable.AddRestriction(new AmountRestriction(game, generators.desktop, 1, 1))
					.SetRateSecond("money", 450)
			);
			generators.seoalgo = game.AddGenerator(new MoneyGenerator(game, "seoalgo")
					.describable.Set("SEO Algorithm", "A thousand ways to fool a search engine.")
					.purchasable.SetBuyPrice("code", 50000)
					.purchasablerestrictable.AddDefaultPriceRestriction()
					.restrictable.AddRestriction(new AmountRestriction(game, generators.mobileapp, 1, 1))
					.SetRateSecond("money", 3000)
			);
			generators.aisales = game.AddGenerator(new MoneyGenerator(game, "aisales")
					.describable.Set("AI Salesperson", "Why hire a human salesperson when robots can close deals too?")
					.describable.SetPlural("AI salespeople")
					.purchasable.SetBuyPrice("code", 200000)
					.purchasablerestrictable.AddDefaultPriceRestriction()
					.restrictable.AddRestriction(new AmountRestriction(game, generators.seoalgo, 1, 1))
					.SetRateSecond("money", 20000)
			);
			generators.catvidgen = game.AddGenerator(new MoneyGenerator(game, "catvidgen")
					.describable.Set("Cat Video Generator", "Because this is the merriest way to make money.")
					.purchasable.SetBuyPrice("code", 1000000)
					.purchasablerestrictable.AddDefaultPriceRestriction()
					.restrictable.AddRestriction(new AmountRestriction(game, generators.aisales, 1, 1))
					.SetRateSecond("money", 130000)
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
				var name = entity.GetName() + object.restrictamount;
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
					var speed = (object.multiplier * 100) + "%";
					if (object.multiplier == 2) {
						speed = "twice";
					}
					if (object.multiplier == 3) {
						speed = "three times";
					}
					if (object.multiplier == 4) {
						speed = "four times";
					}
					effect = entity.describable.GetPlural() + " generate " + speed + " their income.";
				}

				var upgrade = game.AddUpgrade(new Upgrade(game, name)
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

		function createResourceUpgrades(resource, costResource, objects) {
			each(objects, function(object) {
				game.AddUpgrade(new Upgrade(game, object.name)
						.describable.Set(object.title, object.description, object.effect)
						.purchasable.SetBuyPrice(costResource, object.price)
						.purchasablerestrictable.AddDefaultPriceRestriction()
						.rewardable.AddReward(new MultiplierReward(game, resource, object.multiplier))
				);
			});
		}

		//Hires
		{
			createMultiplierUpgrades(generators.intern, [
				{
					title: "Swag Laptop Stickers",
					description: "Fill those laptop backs!",
					resource: "money",
					price: 1000,
					restrictamount: 10,
					multiplier: 3
				},
				{
					title: "Free Chips",
					description: "Something for your interns to snack on. Be careful of greasy keyboards.",
					resource: "money",
					price: 6000,
					restrictamount: 20,
					multiplier: 4
				},
				{
					title: "Free Soda",
					description: "It's also called 'pop' in Canada.",
					resource: "money",
					price: 15000,
					restrictamount: 30,
					multiplier: 4
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
					title: "Free Intern Uniforms",
					description: "The official intern uniform.",
					resource: "money",
					price: 500000,
					restrictamount: 50,
					multiplier: 4
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
					title: "Free Textbook Lending",
					description: "Any textbook you need.",
					resource: "money",
					price: 4000000,
					restrictamount: 70,
					multiplier: 4
				},
				{
					title: "Lifetime Pro Membership",
					description: "Pro membership to whatever we're selling. Apps, services, anything for the interns.",
					resource: "money",
					price: 30000000,
					restrictamount: 80,
					multiplier: 4
				},
				{
					title: "Free Ferrero Rocher",
					description: "Those interns are gonna be nuts when they get a taste of this hazelnut flavored chocolate.",
					resource: "money",
					price: 90000000,
					restrictamount: 90,
					multiplier: 4
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
					title: "Hackbook pro",
					description: "A powerful laptop for a good cause.",
					resource: "money",
					price: 1000000000,
					restrictamount: 110,
					multiplier: 4
				},
				{
					title: "Intern Events",
					description: "Road trips sounds nice. Let's also try skydiving.",
					resource: "money",
					price: 5000000000,
					restrictamount: 120,
					multiplier: 4
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
					title: "Parent day",
					description: "Impress your parents with this free pair of round trip plane tickets & luxurious hotel arrangements for a visit to your workplace.",
					resource: "money",
					price: 70000000000,
					restrictamount: 140,
					multiplier: 4
				},
				{
					title: "Intern Campus",
					description: "A dedicated campus just for interns. I'm sure they'll appreciate it.",
					resource: "money",
					price: 300000000000,
					restrictamount: 150,
					multiplier: 4
				},
				{
					title: "Scholarships",
					description: "We'll also fund your education.",
					resource: "money",
					price: 2000000000000,
					restrictamount: 160,
					multiplier: 4
				}
			]);

			upgrades.internwhip.rewardable.AddReward(new ModifierReward(game, generators.intern, "whip", upgrades.internwhip));

			createMultiplierUpgrades(generators.newgrad, [
				{
					title: "Swag Ping-Pong Balls",
					description: "Some ping-pong balls with the company logo printed.",
					resource: "money",
					price: 4000,
					restrictamount: 10,
					multiplier: 3
				},
				{
					title: "Free Gym Membership",
					description: "Workout around the block.",
					resource: "money",
					price: 300000,
					restrictamount: 40,
					multiplier: 4
				},
				{
					title: "Swag T-Shirts",
					description: "Good quality tech company t-shirts.",
					resource: "money",
					price: 100000000,
					restrictamount: 80,
					multiplier: 4
				},
				{
					title: "Dual Monitor Setup",
					description: "Two is better than one.",
					resource: "money",
					price: 20000000000,
					restrictamount: 120,
					multiplier: 4
				},
				{
					title: "Free Onsite Gym",
					description: "Yoga classes included.",
					resource: "money",
					price: 5000000000000,
					restrictamount: 160,
					multiplier: 4
				}
			]);

			createMultiplierUpgrades(generators.contractor, [
				{
					title: "Skype Business License",
					description: "Now you can group conference call!",
					resource: "money",
					price: 15000,
					restrictamount: 10,
					multiplier: 3
				},
				{
					title: "Free Delivered Lunch",
					description: "Here's some free food.",
					resource: "money",
					price: 1000000,
					restrictamount: 40,
					multiplier: 4
				},
				{
					title: "Free Dropbox Pro",
					description: "Sync those files!",
					resource: "money",
					price: 300000000,
					restrictamount: 80,
					multiplier: 4
				},
				{
					title: "Frequent Flier Program",
					description: "For those who needs to fly into the office.",
					resource: "money",
					price: 80000000000,
					restrictamount: 120,
					multiplier: 4
				},
				{
					title: "Health Insurance",
					description: "In the end... they're still like employees",
					resource: "money",
					price: 25000000000000,
					restrictamount: 160,
					multiplier: 4
				}
			]);

			createMultiplierUpgrades(generators.programmer, [
				{
					title: "Dedicated '$' Keyboards",
					description: "Designed for PHP developers by PHP developers.",
					resource: "money",
					price: 80000,
					restrictamount: 10,
					multiplier: 3
				},
				{
					title: "Free Coffee",
					description: "Convert coffee to code.",
					resource: "money",
					price: 6000000,
					restrictamount: 40,
					multiplier: 4
				},
				{
					title: "IntelliJ Licenses",
					description: "Seriously, try it.",
					resource: "money",
					price: 1500000000,
					restrictamount: 80,
					multiplier: 4
				},
				{
					title: "SSDs",
					description: "Blazing fast boot speeds.",
					resource: "money",
					price: 400000000000,
					restrictamount: 120,
					multiplier: 4
				},
				{
					title: "Commuter Stipend",
					description: "Flights are not included.",
					resource: "money",
					price: 100000000000000,
					restrictamount: 160,
					multiplier: 4
				}
			]);

			createMultiplierUpgrades(generators.senior, [
				{
					title: "Organic Fruits",
					description: "Fresh locally-sourced apples, oranges and bananas.",
					resource: "money",
					price: 500000,
					restrictamount: 10,
					multiplier: 3
				},
				{
					title: "Take Your Kid To Work Days",
					description: "\"Officer, we swear that this is not child labor.\"",
					resource: "money",
					price: 30000000,
					restrictamount: 40,
					multiplier: 4
				},
				{
					title: "Family Health Insurance",
					description: "Now that your family is fully insured... (Hint, the keyword is 'work')",
					resource: "money",
					price: 8000000000,
					restrictamount: 80,
					multiplier: 4
				},
				{
					title: "Day Care Program",
					description: "No need to worry about kids during summer breaks.",
					resource: "money",
					price: 2000000000000,
					restrictamount: 120,
					multiplier: 4
				},
				{
					title: "Pension Plan",
					description: "Planning for retirement already?",
					resource: "money",
					price: 500000000000000,
					restrictamount: 160,
					multiplier: 4
				}
			]);

			createMultiplierUpgrades(generators.architect, [
				{
					title: "Whiteboards",
					description: "Large whiteboards are ideal for drawing diagrams.",
					resource: "money",
					price: 1200000,
					restrictamount: 10,
					multiplier: 3
				},
				{
					title: "Free Beer",
					description: "Get the perfect blood alcohol level for coding.",
					resource: "money",
					price: 100000000,
					restrictamount: 40,
					multiplier: 4
				},
				{
					title: "Ergonomic Keyboard",
					description: "The only kind of keyboard that comes in two pieces.",
					resource: "money",
					price: 25000000000,
					restrictamount: 80,
					multiplier: 4
				},
				{
					title: "Standing Desks",
					description: "They said it would reduce back pain.",
					resource: "money",
					price: 6000000000000,
					restrictamount: 120,
					multiplier: 4
				},
				{
					title: "Paid Time Off",
					description: "I mean, you don't need to redesign the whole system every day, right?",
					resource: "money",
					price: 1500000000000000,
					restrictamount: 160,
					multiplier: 4
				}
			]);

			createMultiplierUpgrades(generators.teamlead, [
				{
					title: "Free Cocktails",
					description: "An all inclusive experience, bartender included. Great selection of more than 30 drinks!",
					resource: "money",
					price: 10000000,
					restrictamount: 10,
					multiplier: 3
				},
				{
					title: "Onsite Massages",
					description: "Professional stress reliever.",
					resource: "money",
					price: 600000000,
					restrictamount: 40,
					multiplier: 4
				},
				{
					title: "Ergonomic Office Chairs",
					description: "We're really tired of beanbags.",
					resource: "money",
					price: 150000000000,
					restrictamount: 80,
					multiplier: 4
				},
				{
					title: "Pet Friendly Workplace",
					description: "Office dogs, anyone?",
					resource: "money",
					price: 40000000000000,
					restrictamount: 120,
					multiplier: 4
				},
				{
					title: "Pet Insurance Policy",
					description: "Peace of mind for your pets.",
					resource: "money",
					price: 10000000000000000,
					restrictamount: 160,
					multiplier: 4
				}
			]);

			createMultiplierUpgrades(generators.startup, [
				{
					title: "Trophy of Recognition",
					description: "Giving some respect goes a long way.",
					resource: "money",
					price: 40000000,
					restrictamount: 10,
					multiplier: 3
				},
				{
					title: "Themed Office Area",
					description: "A big sign saying: \"[Startup Name Here] team\".",
					resource: "money",
					price: 2500000000,
					restrictamount: 40,
					multiplier: 4
				},
				{
					title: "Team trips",
					description: "Ski trips, anyone?",
					resource: "money",
					price: 600000000000,
					restrictamount: 80,
					multiplier: 4
				},
				{
					title: "Stock Options",
					description: "Sharing is caring!",
					resource: "money",
					price: 150000000000000,
					restrictamount: 120,
					multiplier: 4
				},
				{
					title: "Dedicated Project Funding",
					description: "Be your own boss, kinda.",
					resource: "money",
					price: 40000000000000000,
					restrictamount: 160,
					multiplier: 4
				}
			]);

			createResourceUpgrades(resources.code, "money", [
				{
					name: "allhires1",
					title: "Instant Noodles",
					description: "Too lazy to eat lunch? No problem.",
					effect: "Everyone codes 4% faster.",
					price: 100000,
					multiplier: 1.04
				},
				{
					name: "allhires2",
					title: "McDonald's for Lunch",
					description: "It tastes good... Until you eat it for the 10th time of the week.",
					effect: "Everyone codes 8% faster.",
					price: 10000000,
					multiplier: 1.08
				},
				{
					name: "allhires3",
					title: "Catered lunch",
					description: "Never bring lunch or eat out again.",
					effect: "Everyone codes 16% faster.",
					price: 1000000000,
					multiplier: 1.16
				},
				{
					name: "allhires4",
					title: "In-House Cafe",
					description: "Freshly cooked lunch, straight out of the oven.",
					effect: "Everyone codes 32% faster.",
					price: 100000000000,
					multiplier: 1.32
				},
				{
					name: "allhires5",
					title: "In-house Kitchen",
					description: "Gourmet food, three times a day.",
					effect: "Everyone codes 64% faster.",
					price: 10000000000000,
					multiplier: 1.64
				},
				{
					name: "allhires6",
					title: "Three Michelin Stars",
					description: "Michelin star awarded restaurant, rated three stars by the Michelin Red Guide.",
					effect: "Everyone codes 128% faster.",
					price: 1000000000000000,
					multiplier: 2.28
				}
			]);
		}

		//Features
		{
			createMultiplierUpgrades(generators.webapp, [
				{
					title: "Online Ads",
					description: "Most people can't even imagine how profitable advertising is.",
					resource: "code",
					price: 120,
					restrictamount: 10,
					multiplier: 3
				},
				{
					title: "SQL Injection Protection",
					description: "Why didn't we think of this before.",
					resource: "code",
					price: 7000,
					restrictamount: 40,
					multiplier: 4
				},
				{
					title: "XSS Detector",
					description: "That'll teach ya hackers a lesson!",
					resource: "code",
					price: 2000000,
					restrictamount: 80,
					multiplier: 4
				},
				{
					title: "DDoS Protection",
					description: "99.9999% uptime guaranteed.",
					resource: "code",
					price: 500000000,
					restrictamount: 120,
					multiplier: 4
				},
				{
					title: "SSL Certificate",
					description: "Your connection to this website is encrypted with 42-bit encryption.",
					resource: "code",
					price: 130000000000,
					restrictamount: 160,
					multiplier: 4
				}
			]);

			createMultiplierUpgrades(generators.abtesting, [
				{
					title: "SQLite Database",
					description: "Simple & Easy. Doesn't really scale.",
					resource: "code",
					price: 800,
					restrictamount: 10,
					multiplier: 3
				},
				{
					title: "MySQL Database",
					description: "Industry-proven.",
					resource: "code",
					price: 50000,
					restrictamount: 40,
					multiplier: 4
				},
				{
					title: "Oracle Database",
					description: "Heavy-weight heavy-duty.",
					resource: "code",
					price: 13000000,
					restrictamount: 80,
					multiplier: 4
				},
				{
					title: "Dedicated Data Center",
					description: "Why pay others when you can host your own?",
					resource: "code",
					price: 3000000000,
					restrictamount: 120,
					multiplier: 4
				},
				{
					title: "Hadoop Distributed Computing",
					description: "Big data is apparently... REALLY BIG.",
					resource: "code",
					price: 700000000000,
					restrictamount: 160,
					multiplier: 4
				}
			]);

			createMultiplierUpgrades(generators.emailcampaign, [
				{
					title: "Newsletter",
					description: "Social media aggregation? Check.",
					resource: "code",
					price: 5000,
					restrictamount: 10,
					multiplier: 3
				},
				{
					title: "Option to Unsubscribe",
					description: "I've been waiting for this long enough.",
					resource: "code",
					price: 300000,
					restrictamount: 40,
					multiplier: 4
				},
				{
					title: "Promotion Emails",
					description: "Your weekly deals.",
					resource: "code",
					price: 75000000,
					restrictamount: 80,
					multiplier: 4
				},
				{
					title: "Holiday E-Cards",
					description: "A surprising amount of people still use this, even though it sounds so 2000.",
					resource: "code",
					price: 20000000000,
					restrictamount: 120,
					multiplier: 4
				},
				{
					title: "Targeted Emails",
					description: "You didn't think that personal email written to your name was written by me algorithm, did you?",
					resource: "code",
					price: 5000000000000,
					restrictamount: 160,
					multiplier: 4
				}
			]);

			createMultiplierUpgrades(generators.desktop, [
				{
					title: "Background Process",
					description: "Always running, silently.",
					resource: "code",
					price: 20000,
					restrictamount: 10,
					multiplier: 3
				},
				{
					title: "Command-Line Interface",
					description: "GUI's are for the weak.",
					resource: "code",
					price: 1200000,
					restrictamount: 40,
					multiplier: 4
				},
				{
					title: "Automatic Updates",
					description: "You won't even need to reboot your PC!",
					resource: "code",
					price: 300000000,
					restrictamount: 80,
					multiplier: 4
				},
				{
					title: "Native UI",
					description: "It's time to ditch the WebView and go native!",
					resource: "code",
					price: 75000000000,
					restrictamount: 120,
					multiplier: 4
				},
				{
					title: "C++ rewrite",
					description: "Well... This may take a while.",
					resource: "code",
					price: 20000000000000,
					restrictamount: 160,
					multiplier: 4
				}
			]);

			createMultiplierUpgrades(generators.mobileapp, [
				{
					title: "In-App Ads",
					description: "SomeApp Free (Get the pro version to remove ads).",
					resource: "code",
					price: 100000,
					restrictamount: 10,
					multiplier: 3
				},
				{
					title: "In-App Purchase",
					description: "Virtual goods costs a lot, you know?",
					resource: "code",
					price: 6000000,
					restrictamount: 40,
					multiplier: 4
				},
				{
					title: "Featured in App Store",
					description: "Featured App of the week!",
					resource: "code",
					price: 1500000000,
					restrictamount: 80,
					multiplier: 4
				},
				{
					title: "Press Review",
					description: "Get trusted Tech aggregates, blogs, and reviewers to review your app!",
					resource: "code",
					price: 400000000000,
					restrictamount: 120,
					multiplier: 4
				},
				{
					title: "Preloaded Apps",
					description: "Partner with wireless carriers to preload your app in mobile phones.",
					resource: "code",
					price: 100000000000000,
					restrictamount: 160,
					multiplier: 4
				}
			]);

			createMultiplierUpgrades(generators.seoalgo, [
				{
					title: "Trend Analysis",
					description: "Catch the waves and bring traffic to your business.",
					resource: "code",
					price: 400000,
					restrictamount: 10,
					multiplier: 3
				},
				{
					title: "Keyword Spamming",
					description: "The good ol' Black-Hat trick.",
					resource: "code",
					price: 25000000,
					restrictamount: 40,
					multiplier: 4
				},
				{
					title: "URL Normalization",
					description: "Redirects, redirects, redirects.",
					resource: "code",
					price: 6000000000,
					restrictamount: 80,
					multiplier: 4
				},
				{
					title: "Paid Ranks",
					description: "If it all fails, just pay the search engine.",
					resource: "money",
					price: 1500000000000,
					restrictamount: 120,
					multiplier: 4
				},
				{
					title: "Search Engine Partnerships",
					description: "Optimize to the max by browsing the search engine's source code.",
					resource: "code",
					price: 350000000000000,
					restrictamount: 160,
					multiplier: 4
				}
			]);

			createMultiplierUpgrades(generators.aisales, [
				{
					title: "Tele-Presence Devices",
					description: "Robots looking like robots acting like humans.",
					resource: "code",
					price: 1600000,
					restrictamount: 10,
					multiplier: 3
				},
				{
					title: "Terabit Internet Access",
					description: "(Nearly) Unlimited bandwidth.",
					resource: "code",
					price: 100000000,
					restrictamount: 40,
					multiplier: 4
				},
				{
					title: "Machine Learning Algorithm",
					description: "Mathematical & Statistical.",
					resource: "code",
					price: 25000000000,
					restrictamount: 80,
					multiplier: 4
				},
				{
					title: "Genetic Algorithm",
					description: "Artificial evolution.",
					resource: "code",
					price: 35000000000000,
					restrictamount: 120,
					multiplier: 4
				},
				{
					title: "Neural Networks",
					description: "Brain simulation gone wrong.",
					resource: "code",
					price: 6000000000000,
					restrictamount: 160,
					multiplier: 4
				}
			]);

			createMultiplierUpgrades(generators.catvidgen, [
				{
					title: "4K HD video",
					description: "Ultra high definition like you've never seen before.",
					resource: "code",
					price: 8000000,
					restrictamount: 10,
					multiplier: 3
				},
				{
					title: "Meow Simulator",
					description: "Awwwwwwwwwww.",
					resource: "code",
					price: 500000000,
					restrictamount: 40,
					multiplier: 4
				},
				{
					title: "Cat Picture Analysis Algorithm",
					description: "Once you've got enough, the rest will come along.",
					resource: "code",
					price: 130000000000,
					restrictamount: 80,
					multiplier: 4
				},
				{
					title: "Tactile Feedback",
					description: "Come here, you cute little fluffy ball.",
					resource: "code",
					price: 32000000000000,
					restrictamount: 120,
					multiplier: 4
				},
				{
					title: "VR Cat Cafe",
					description: "Buy this VR set for ony $999.99. Includes cat simulation.",
					resource: "code",
					price: 8000000000000000,
					restrictamount: 160,
					multiplier: 4
				}
			]);

			createResourceUpgrades(resources.money, "code", [
				{
					name: "allfeatures1",
					title: "Free Online Hosting",
					description: "There are tons of free online hosts. Beware: ads may be inserted automatically.",
					effect: "Everything generates 4% more money.",
					price: 10000,
					multiplier: 1.04
				},
				{
					name: "allfeatures2",
					title: "Dedicated Server Hosting",
					description: "Finally hosting your own services.",
					effect: "Everything generates 8% more money.",
					price: 1000000,
					multiplier: 1.08
				},
				{
					name: "allfeatures3",
					title: "Virtual Machine Hosting",
					description: "Virtual machines are awesome!",
					effect: "Everything generates 16% more money.",
					price: 100000000,
					multiplier: 1.16
				},
				{
					name: "allfeatures4",
					title: "Amazon Web Services Hosting",
					description: "Let AWS do the work for you.",
					effect: "Everything generates 32% more money.",
					price: 10000000000,
					multiplier: 1.32
				},
				{
					name: "allfeatures5",
					title: "Content Distribution Networks",
					description: "Accessible from every country, area, and internet provider in the world. Except China and a few others.",
					effect: "Everything generates 64% more money.",
					price: 1000000000000,
					multiplier: 1.64
				},
				{
					name: "allfeatures6",
					title: "The Cloud\u2122",
					description: "You have no idea where things are running, but it's fast.",
					effect: "Everything generates 128% more money.",
					price: 100000000000000,
					multiplier: 2.28
				}
			]);
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
					.describable.Set("There's a First in Everything", "Ouch!", "Whip the interns.")
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

	game.content.upgrades.sort(function(a, b) {
		var m1 = a.purchasable.GetBuyPrice().money;
		var c1 = a.purchasable.GetBuyPrice().code;
		var m2 = b.purchasable.GetBuyPrice().money;
		var c2 = b.purchasable.GetBuyPrice().code;


		return (m1 || c1) - (m2 || c2);
	});

	return game;
};
