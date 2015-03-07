var CodeGenerator = function(game, name) {
	Generator.call(this, game, name);
};
extend(CodeGenerator, Generator, {});

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
		this.amount.Set(Math.max(this.game.GetResourceRatesPerSecond(this.resource) / 5, 1));
	},
	Click: function() {
		this.clicked = true;
	},
	OnTick: function() {
		if (this.clicked) {
			Generator.prototype.OnTick.call(this);
			this.clicked = false;
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
				.amount.StartApprox()
				.SetRateFormatter(function(rate) {
					return "Generates " + formatDollar(rate * game.GetTicksPerSecond()) + " per second.";
				})
		);
		resources.code = game.AddResource(new Resource(game, "code")
				.describable.SetTitle("line of code")
				.describable.SetPlural("lines of code")
				.amount.StartApprox()
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
			generators.intern = game.AddGenerator(new CodeGenerator(game, "intern")
					.describable.Set("Intern", "Don't really know anything and breaks the build every day.")
					.purchasable.SetBuyPrice("money", 100)
					.restrictable.AddRestriction(new AmountRestriction(game, resources.money, 1, 1))
					.SetRateSecond("code", 0.2)
			);
			generators.junior = game.AddGenerator(new CodeGenerator(game, "junior")
					.describable.Set("Junior Programmer", "Fresh out of college, will code for food.")
					.purchasable.SetBuyPrice("money", 500)
					.purchasablerestrictable.AddDefaultPriceRestriction()
					.restrictable.AddRestriction(new AmountRestriction(game, generators.intern, 1, 1))
					.SetRateSecond("code", 2)
			);
			generators.contractor = game.AddGenerator(new CodeGenerator(game, "contractor")
					.describable.Set("Contractor", "Like a normal employee, except you don't have to pay for his insurance.")
					.purchasable.SetBuyPrice("money", 2000)
					.purchasablerestrictable.AddDefaultPriceRestriction()
					.restrictable.AddRestriction(new AmountRestriction(game, generators.junior, 1, 1))
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
					.purchasable.SetBuyPrice("code", 100000)
					.purchasablerestrictable.AddDefaultPriceRestriction()
					.restrictable.AddRestriction(new AmountRestriction(game, generators.mobileapp, 1, 1))
					.SetRateSecond("money", 20000)
			);
			generators.aisales = game.AddGenerator(new MoneyGenerator(game, "aisales")
					.describable.Set("AI Salesperson", "Why hire a human salesperson when robots can close deals too?")
					.describable.SetPlural("AI salespeople")
					.purchasable.SetBuyPrice("code", 1000000)
					.purchasablerestrictable.AddDefaultPriceRestriction()
					.restrictable.AddRestriction(new AmountRestriction(game, generators.seoalgo, 1, 1))
					.SetRateSecond("money", 150000)
			);
			generators.catvidgen = game.AddGenerator(new MoneyGenerator(game, "catvidgen")
					.describable.Set("Cat Video Generator", "Because this is the merriest way to make money.")
					.purchasable.SetBuyPrice("code", 10000000)
					.purchasablerestrictable.AddDefaultPriceRestriction()
					.restrictable.AddRestriction(new AmountRestriction(game, generators.aisales, 1, 1))
					.SetRateSecond("money", 1000000)
			);
		}

		//Click
		{
			generators.click = game.AddGenerator(new ClickGenerator(game, "click", "code")
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
					.describable.SetTitle("Free Stuff")
					.describable.AddEffect("Gives you some free stuff.")
					.describable.SetDescription("Swag.")
					.rewardable.AddReward(new ResourceReward(game, resources.code, 1000000))
					.rewardable.AddReward(new ResourceReward(game, resources.money, 2000000))
			);
			upgrades.hire = game.AddUpgrade(new Upgrade(game, "hire")
					.describable.SetTitle("Job Postings")
					.describable.AddEffect("Able to hire people.")
					.describable.SetDescription("Like a boss.")
					.purchasable.SetBuyPrice("money", 100)
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
				var upgrade = game.AddUpgrade(new Upgrade(game, object.name)
						.describable.Set(object.title, object.description, object.effect)
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
					name: "chips",
					title: "Free Chips",
					effect: "Interns code 50% faster.",
					description: "Something for your interns to snack on. Be careful of greasy keyboards.",
					resource: "money",
					price: 500,
					restrictamount: 1,
					multiplier: 1.5
				},
				{
					name: "instantnoodles",
					title: "Free Instant Noodles",
					effect: "Interns code twice as fast.",
					description: "Smells like college food.",
					resource: "money",
					price: 500,
					restrictamount: 40,
					multiplier: 2
				},
				{
					name: "sode",
					title: "Free Soda",
					effect: "Interns code twice as fast.",
					description: "It's also called 'pop' in Canada.",
					resource: "money",
					price: 500,
					restrictamount: 120,
					multiplier: 2
				}
			]);
			createMultiplierUpgrades(generators.programmer, [
				{
					name: "coffee",
					title: "Free Coffee",
					effect: "Programmers code twice as fast.",
					description: "Convert coffee to code.",
					resource: "money",
					price: 1000,
					restrictamount: 1,
					multiplier: 2
				}
			]);

			upgrades.cateredlunch = game.AddUpgrade(new Upgrade(game, "cateredlunch")
					.describable.SetTitle("Catered lunch")
					.describable.AddEffect("Everyone codes 3% faster.")
					.describable.SetDescription("Never bring lunch or eat out again.")
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
					title: "Online Advertisement",
					effect: "Webapps generate twice their income.",
					description: "Most people don't really know how profitable advertising is",
					resource: "code",
					price: 500,
					restrictamount: 1,
					multiplier: 2
				}
			]);

			createMultiplierUpgrades(generators.mobileapp, [
				{
					name: "inapppurchase",
					title: "In-app Purchases",
					effect: "Mobile apps generate twice their income.",
					description: "Virtual goods costs a lot, you know?",
					resource: "code",
					price: 1000,
					restrictamount: 1,
					multiplier: 2
				},
				{
					name: "inappads",
					title: "In-app Advertisement",
					effect: "Mobile apps generate twice their income.",
					description: "SomeApp Free (Get the pro version to remove ads)",
					resource: "code",
					price: 2000,
					restrictamount: 1,
					multiplier: 2
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
						.describable.SetTitle(object.title)
						.describable.SetDescription(object.description)
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
				{amount: 1, title: "Finger Warm-up Exercise", description: ""},
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
				{amount: 3300000000000, title: "Human", description: "Size of the human DNA"}
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
			createAmountAchievements(generators.junior, [
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

	return game;
})();
