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

	var resources = game.data.resources;

	resources.money = game.AddResource(new Resource(game, "money")
			.amount.StartApprox()
			.SetRateFormatter(function(rate) {
				return "Generates " + formatDollar(rate * game.GetTicksPerSecond()) + " per second.";
			})
	);
	resources.code = game.AddResource(new Resource(game, "code")
			.amount.StartApprox()
			.SetRateFormatter(function(rate) {
				return "Produces " + formatLinesOfCodePerSec(rate * game.GetTicksPerSecond()) + " per second.";
			})
	);

	var generators = game.data.generators;

	//Hires
	generators.intern = game.AddGenerator(new CodeGenerator(game, "intern")
			.describable.SetTitle("Intern")
			.describable.SetDescription("Don't really know anything and breaks the build every day.")
			.purchasable.SetBuyPrice("money", 100)
			.restrictable.AddRestriction(new AmountRestriction(game, resources.money, 1, 1))
			.SetRateSecond("code", 0.2)
	);
	generators.junior = game.AddGenerator(new CodeGenerator(game, "junior")
			.describable.SetTitle("Junior Programmer")
			.describable.SetDescription("Fresh out of college, will code for food.")
			.purchasable.SetBuyPrice("money", 500)
			.purchasablerestrictable.AddDefaultPriceRestriction()
			.restrictable.AddRestriction(new AmountRestriction(game, generators.intern, 1, 1))
			.SetRateSecond("code", 1)
	);
	generators.contractor = game.AddGenerator(new CodeGenerator(game, "contractor")
			.describable.SetTitle("Contractor")
			.describable.SetDescription("Like a normal employee, except you don't have to pay for his insurance.")
			.purchasable.SetBuyPrice("money", 2000)
			.purchasablerestrictable.AddDefaultPriceRestriction()
			.restrictable.AddRestriction(new AmountRestriction(game, generators.junior, 1, 1))
			.SetRateSecond("code", 5)
	);
	generators.programmer = game.AddGenerator(new CodeGenerator(game, "programmer")
			.describable.SetTitle("Programmer")
			.describable.SetDescription("Coffee in, code out.")
			.purchasable.SetBuyPrice("money", 10000)
			.purchasablerestrictable.AddDefaultPriceRestriction()
			.restrictable.AddRestriction(new AmountRestriction(game, generators.contractor, 1, 1))
			.SetRateSecond("code", 15)
	);
	generators.senior = game.AddGenerator(new CodeGenerator(game, "senior")
			.describable.SetTitle("Senior Programmer")
			.describable.SetDescription("No no no, you're doing it all wrong!")
			.purchasable.SetBuyPrice("money", 50000)
			.purchasablerestrictable.AddDefaultPriceRestriction()
			.restrictable.AddRestriction(new AmountRestriction(game, generators.programmer, 1, 1))
			.SetRateSecond("code", 35)
	);
	generators.architect = game.AddGenerator(new CodeGenerator(game, "architect")
			.describable.SetTitle("Software Architect")
			.describable.SetDescription("A pro.")
			.purchasable.SetBuyPrice("money", 200000)
			.purchasablerestrictable.AddDefaultPriceRestriction()
			.restrictable.AddRestriction(new AmountRestriction(game, generators.senior, 1, 1))
			.SetRateSecond("code", 100)
	);
	generators.teamlead = game.AddGenerator(new CodeGenerator(game, "teamlead")
			.describable.SetTitle("Team Lead")
			.describable.SetDescription("Manages programmers, and code on spare time (Yes they have a lot of spare time).")
			.purchasable.SetBuyPrice("money", 1000000)
			.purchasablerestrictable.AddDefaultPriceRestriction()
			.restrictable.AddRestriction(new AmountRestriction(game, generators.architect, 1, 1))
			.SetRateSecond("code", 500)
	);
	generators.vpeng = game.AddGenerator(new CodeGenerator(game, "vpeng")
			.describable.SetTitle("VP of Engineering")
			.describable.SetPlural("VPs of Engineering")
			.describable.SetDescription("Codes really fast.")
			.purchasable.SetBuyPrice("money", 5000000)
			.purchasablerestrictable.AddDefaultPriceRestriction()
			.restrictable.AddRestriction(new AmountRestriction(game, generators.teamlead, 1, 1))
			.SetRateSecond("code", 1000)
	);

	//Features
	generators.webapp = game.AddGenerator(new MoneyGenerator(game, "webapp")
			.describable.SetTitle("Web app")
			.describable.SetDescription("HTML 5, CSS 3, and JavaScript.")
			.purchasable.SetBuyPrice("code", 15)
			.restrictable.AddRestriction(new AmountRestriction(game, resources.code, 1, 1))
			.SetRateSecond("money", 1)
	);
	generators.abtesting = game.AddGenerator(new MoneyGenerator(game, "abtesting")
			.describable.SetTitle("A/B testing")
			.describable.SetPlural("A/B tests")
			.describable.SetDescription("User preferences proven by analytics.")
			.purchasable.SetBuyPrice("code", 100)
			.purchasablerestrictable.AddDefaultPriceRestriction()
			.restrictable.AddRestriction(new AmountRestriction(game, generators.webapp, 1, 1))
			.SetRateSecond("money", 5)
	);
	generators.emailcampaign = game.AddGenerator(new MoneyGenerator(game, "emailcampaign")
			.describable.SetTitle("Email campaign")
			.describable.SetPlural("Email campaign")
			.describable.SetDescription("The fine line between email campaign and spamming.")
			.purchasable.SetBuyPrice("code", 600)
			.purchasablerestrictable.AddDefaultPriceRestriction()
			.restrictable.AddRestriction(new AmountRestriction(game, generators.abtesting, 1, 1))
			.SetRateSecond("money", 12)
	);
	generators.desktop = game.AddGenerator(new MoneyGenerator(game, "desktop")
			.describable.SetTitle("Desktop application")
			.describable.SetDescription("Applications that won't run on a Chromebook.")
			.purchasable.SetBuyPrice("code", 2500)
			.purchasablerestrictable.AddDefaultPriceRestriction()
			.restrictable.AddRestriction(new AmountRestriction(game, generators.emailcampaign, 1, 1))
			.SetRateSecond("money", 30)
	);
	generators.mobileapp = game.AddGenerator(new MoneyGenerator(game, "mobileapp")
			.describable.SetTitle("Mobile app")
			.describable.SetDescription("The reason why your phone battery never lasts for more than one day.")
			.purchasable.SetBuyPrice("code", 12000)
			.purchasablerestrictable.AddDefaultPriceRestriction()
			.restrictable.AddRestriction(new AmountRestriction(game, generators.desktop, 1, 1))
			.SetRateSecond("money", 100)
	);
	generators.seoalgo = game.AddGenerator(new MoneyGenerator(game, "seoalgo")
			.describable.SetTitle("SEO algorithm")
			.describable.SetDescription("A thousand ways to fool a search engine.")
			.purchasable.SetBuyPrice("code", 100000)
			.purchasablerestrictable.AddDefaultPriceRestriction()
			.restrictable.AddRestriction(new AmountRestriction(game, generators.mobileapp, 1, 1))
			.SetRateSecond("money", 1000)
	);
	generators.aisales = game.AddGenerator(new MoneyGenerator(game, "aisales")
			.describable.SetTitle("AI salesperson")
			.describable.SetPlural("AI salespeople")
			.describable.SetDescription("Why hire a human salesperson when robots can close deals too?")
			.purchasable.SetBuyPrice("code", 1000000)
			.purchasablerestrictable.AddDefaultPriceRestriction()
			.restrictable.AddRestriction(new AmountRestriction(game, generators.seoalgo, 1, 1))
			.SetRateSecond("money", 12000)
	);
	generators.catvidgen = game.AddGenerator(new MoneyGenerator(game, "catvidgen")
			.describable.SetTitle("Cat video generator")
			.describable.SetDescription("Because this is the merriest way to make money.")
			.purchasable.SetBuyPrice("code", 10000000)
			.purchasablerestrictable.AddDefaultPriceRestriction()
			.restrictable.AddRestriction(new AmountRestriction(game, generators.aisales, 1, 1))
			.SetRateSecond("money", 999999)
	);

	//Click
	generators.click = game.AddGenerator(new ClickGenerator(game, "click", "code")
			.describable.SetTitle("Clicker")
			.describable.SetDescription("Dat finger.")
			.SetRate("code", 1)
	);

	//Upgrades
	game.data.upgrades.free = game.AddUpgrade(new Upgrade(game, "free")
			.describable.SetTitle("Free stuff")
			.describable.AddEffect("Gives you some free stuff.")
			.describable.SetDescription("Swag.")
			.rewardable.AddReward(new ResourceReward(game, resources.code, 1000000))
			.rewardable.AddReward(new ResourceReward(game, resources.money, 2000000))
	);
	game.data.upgrades.hire = game.AddUpgrade(new Upgrade(game, "hire")
			.describable.SetTitle("Job postings")
			.describable.AddEffect("Able to hire people.")
			.describable.SetDescription("Like a boss.")
			.purchasable.SetBuyPrice("money", 100)
			.restrictable.AddRestriction(new AmountRestriction(game, resources.money, 1, 1))
	);
	game.data.upgrades.chips = game.AddUpgrade(new Upgrade(game, "chips")
			.describable.SetTitle("Free chips")
			.describable.AddEffect("Interns code 50% faster.")
			.describable.SetDescription("Something for your interns to snack on. Be careful of greasy keyboards.")
			.purchasable.SetBuyPrice("money", 500)
			.purchasablerestrictable.AddDefaultPriceRestriction()
			.restrictable.AddRestriction(new AmountRestriction(game, generators.intern, 1, 2))
			.rewardable.AddReward(new MultiplierReward(game, generators.intern, 0.5, 0))
	);
	game.data.upgrades.coffee = game.AddUpgrade(new Upgrade(game, "coffee")
			.describable.SetTitle("Free coffee")
			.describable.AddEffect("Programmers code 50% faster.")
			.describable.SetDescription("Programmers are creatures who convert coffee to code.")
			.purchasable.SetBuyPrice("money", 1000)
			.purchasablerestrictable.AddDefaultPriceRestriction()
			.restrictable.AddRestriction(new AmountRestriction(game, generators.programmer, 1, 2))
			.rewardable.AddReward(new MultiplierReward(game, generators.programmer, 0.5, 0))
	);
	game.data.upgrades.cateredlunch = game.AddUpgrade(new Upgrade(game, "cateredlunch")
			.describable.SetTitle("Catered lunch")
			.describable.AddEffect("Everyone codes 3% faster.")
			.describable.SetDescription("Never bring lunch or eat out again.")
			.purchasable.SetBuyPrice("money", 5000)
			.purchasablerestrictable.AddDefaultPriceRestriction()
			.rewardable.AddReward(new MultiplierReward(game, resources.code, 0.03, 0))
	);

	// Achievements
	// $$$
	game.AddAchievement(new AmountAchievement(game, "millionaire", resources.money, 1000000)
			.describable.SetTitle("Millionaire")
			.describable.SetDescription("Get all the chicks you want.")
	);
	game.AddAchievement(new AmountAchievement(game, "billionaire", resources.money, 1000000000)
			.describable.SetTitle("Billionaire")
			.describable.SetDescription("Make it rain.")
	);
	game.AddAchievement(new AmountAchievement(game, "trillionaire", resources.money, 1000000000000)
			.describable.SetTitle("Trillionaire")
			.describable.SetDescription("(Bill Gates + Mark Zuckerberg + Sean Parker + Elon Musk) * 7.899")
	);

	// Interns
	game.AddAchievement(new AmountAchievement(game, "intern1", generators.intern, 1)
			.describable.SetTitle("The Internship")
			.AddDefaultEffect()
	);
	game.AddAchievement(new AmountAchievement(game, "intern50", generators.intern, 50)
			.describable.SetTitle("Class of 2015")
			.AddDefaultEffect()
	);
	game.AddAchievement(new AmountAchievement(game, "intern100", generators.intern, 100)
			.describable.SetTitle("Intern catastrophe")
			.AddDefaultEffect()
	);
	game.AddAchievement(new AmountAchievement(game, "intern150", generators.intern, 150)
			.describable.SetTitle("Internapocalypse")
			.AddDefaultEffect()
	);
	game.AddAchievement(new AmountAchievement(game, "intern200", generators.intern, 200)
			.describable.SetTitle("University campus")
			.AddDefaultEffect()
	);

	// Junior
	game.AddAchievement(new AmountAchievement(game, "junior1", generators.junior, 1)
			.describable.SetTitle("Fresh Grad")
			.AddDefaultEffect()
	);
	game.AddAchievement(new AmountAchievement(game, "junior50", generators.junior, 50)
			.describable.SetTitle("Hacky Code")
			.AddDefaultEffect()
	);
	game.AddAchievement(new AmountAchievement(game, "junior100", generators.junior, 100)
			.describable.SetTitle("Young Professionals")
			.AddDefaultEffect()
	);
	game.AddAchievement(new AmountAchievement(game, "junior150", generators.junior, 150)
			.describable.SetTitle("Junior Junior")
			.AddDefaultEffect()
	);
	game.AddAchievement(new AmountAchievement(game, "junior200", generators.junior, 200)
			.describable.SetTitle("Yolo")
			.AddDefaultEffect()
	);

	// Contractor
	game.AddAchievement(new AmountAchievement(game, "contractor1", generators.contractor, 1)
			.describable.SetTitle("Working remote")
			.AddDefaultEffect()
	);
	game.AddAchievement(new AmountAchievement(game, "contractor50", generators.contractor, 50)
			.describable.SetTitle("Subcontracting")
			.AddDefaultEffect()
	);
	game.AddAchievement(new AmountAchievement(game, "contractor100", generators.contractor, 100)
			.describable.SetTitle("Outsourced")
			.AddDefaultEffect()
	);
	game.AddAchievement(new AmountAchievement(game, "contractor150", generators.contractor, 150)
			.describable.SetTitle("Outsourced")
			.AddDefaultEffect()
	);
	game.AddAchievement(new AmountAchievement(game, "contractor200", generators.contractor, 200)
			.describable.SetTitle("Crowdsourcing")
			.AddDefaultEffect()
	);

	// Programmer
	game.AddAchievement(new AmountAchievement(game, "programmer1", generators.programmer, 1)
			.describable.SetTitle("Ready to code")
			.AddDefaultEffect()
	);
	game.AddAchievement(new AmountAchievement(game, "programmer50", generators.programmer, 50)
			.describable.SetTitle("Code monkeys")
			.AddDefaultEffect()
	);

	// Senior
	game.AddAchievement(new AmountAchievement(game, "senior1", generators.senior, 1)
			.describable.SetTitle("Slow and steady")
			.AddDefaultEffect()
	);

	// Architect
	game.AddAchievement(new AmountAchievement(game, "architect1", generators.architect, 1)
			.describable.SetTitle("Refactor")
			.AddDefaultEffect()
	);
	game.AddAchievement(new AmountAchievement(game, "architect50", generators.architect, 50)
			.describable.SetTitle("Young Professionals")
			.AddDefaultEffect()
	);
	game.AddAchievement(new AmountAchievement(game, "architect100", generators.architect, 100)
			.describable.SetTitle("Hacky code")
			.AddDefaultEffect()
	);

	// Team leads
	game.AddAchievement(new AmountAchievement(game, "teamlead1", generators.teamlead, 1)
			.describable.SetTitle("Leadership")
			.AddDefaultEffect()
	);
	game.AddAchievement(new AmountAchievement(game, "teamlead50", generators.teamlead, 50)
			.describable.SetTitle("50 shades of grey")
			.AddDefaultEffect()
	);
	game.AddAchievement(new AmountAchievement(game, "teamlead100", generators.teamlead, 100)
			.describable.SetTitle("Too many teams")
			.AddDefaultEffect()
	);
	game.AddAchievement(new AmountAchievement(game, "teamlead150", generators.teamlead, 150)
			.describable.SetTitle("A team for almost everything")
			.AddDefaultEffect()
	);
	game.AddAchievement(new AmountAchievement(game, "teamlead200", generators.teamlead, 200)
			.describable.SetTitle("Who are we leading, anyway?")
			.AddDefaultEffect()
	);

	// VP
	game.AddAchievement(new AmountAchievement(game, "vpeng1", generators.vpeng, 1)
			.describable.SetTitle("The one and only")
			.AddDefaultEffect()
	);
	game.AddAchievement(new AmountAchievement(game, "vpeng10", generators.vpeng, 10)
			.describable.SetTitle("10 and counting")
			.AddDefaultEffect()
	);
	game.AddAchievement(new AmountAchievement(game, "vpeng50", generators.vpeng, 50)
			.describable.SetTitle("50 under 50")
			.AddDefaultEffect()
	);
	game.AddAchievement(new AmountAchievement(game, "vpeng100", generators.vpeng, 100)
			.describable.SetTitle("VPs, VPs everywhere")
			.AddDefaultEffect()
	);

	return game;
})();
