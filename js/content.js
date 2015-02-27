var GAME = (function() {

	var game = new Game();

	game.data.resources.money = game.AddResource(new Resource(game, "money"));
	game.data.resources.code = game.AddResource(new Resource(game, "code"));

	//Hires
	game.data.generators.intern = game.AddGenerator(new Generator(game, "intern")
			.describable.SetTitle("Intern")
			.describable.SetEffect("Produces 1 lines of code every 5 seconds.")
			.describable.SetDescription("Don't really know anything and breaks the build every day.")
			.purchasable.SetBuyPrice("money", 100)
			.purchasable.SetDefaultRestriction()
			.SetRateSecond("code", 0.2)
	);
	game.data.generators.junior = game.AddGenerator(new Generator(game, "junior")
			.describable.SetTitle("Junior Programmer")
			.describable.SetEffect("Produces 1 lines of code per second.")
			.describable.SetDescription("Fresh out of college, will code for food.")
			.purchasable.SetBuyPrice("money", 500)
			.purchasable.SetDefaultRestriction()
			.SetRateSecond("code", 1)
	);
	game.data.generators.contractor = game.AddGenerator(new Generator(game, "contractor")
			.describable.SetTitle("Contractor")
			.describable.SetEffect("Produces 5 lines of code per second.")
			.describable.SetDescription("Like a normal employee, except you don't have to pay for his insurance.")
			.purchasable.SetBuyPrice("money", 2000)
			.purchasable.SetDefaultRestriction()
			.SetRateSecond("code", 5)
	);
	game.data.generators.programmer = game.AddGenerator(new Generator(game, "programmer")
			.describable.SetTitle("Programmer")
			.describable.SetEffect("Produces 25 lines of code per second.")
			.describable.SetDescription("Coffee in, code out.")
			.purchasable.SetBuyPrice("money", 10000)
			.purchasable.SetDefaultRestriction()
			.SetRateSecond("code", 15)
	);
	game.data.generators.senior = game.AddGenerator(new Generator(game, "senior")
			.describable.SetTitle("Senior Programmer")
			.describable.SetEffect("Produces 100 lines of code per second.")
			.describable.SetDescription("No no no, you're doing it all wrong!")
			.purchasable.SetBuyPrice("money", 50000)
			.purchasable.SetDefaultRestriction()
			.SetRateSecond("code", 35)
	);
	game.data.generators.architect = game.AddGenerator(new Generator(game, "architect")
			.describable.SetTitle("Software Architect")
			.describable.SetEffect("Produces 400 lines of code per second.")
			.describable.SetDescription("A pro.")
			.purchasable.SetBuyPrice("money", 200000)
			.purchasable.SetDefaultRestriction()
			.SetRateSecond("code", 100)
	);
	game.data.generators.teamlead = game.AddGenerator(new Generator(game, "teamlead")
			.describable.SetTitle("Team Lead")
			.describable.SetEffect("Produces 2000 lines of code per second.")
			.describable.SetDescription("Manages programmers, and code on spare time (Yes they have a lot of spare time).")
			.purchasable.SetBuyPrice("money", 1000000)
			.purchasable.SetDefaultRestriction()
			.SetRateSecond("code", 500)
	);
	game.data.generators.vpeng = game.AddGenerator(new Generator(game, "vpeng")
			.describable.SetTitle("VP of Engineering")
			.describable.SetEffect("Produces 10000 lines of code per second.")
			.describable.SetDescription("Codes really fast.")
			.purchasable.SetBuyPrice("money", 5000000)
			.purchasable.SetDefaultRestriction()
			.SetRateSecond("code", 1000)
	);

	//Features
	game.data.generators.ad = game.AddGenerator(new Generator(game, "ad")
			.describable.SetTitle("Ads on your site")
			.describable.SetEffect("Generates $1 per second.")
			.describable.SetDescription("It\"s crazy how much money you can make with ads.")
			.purchasable.SetBuyPrice("code", 15)
			.purchasable.SetDefaultRestriction()
			.SetRateSecond("money", 1)
	);
	game.data.generators.vm = game.AddGenerator(new Generator(game, "vm")
			.describable.SetTitle("Virtual machine")
			.describable.SetEffect("Generates $5 per second.")
			.describable.SetDescription("Just a powerful as a physical machine.")
			.purchasable.SetBuyPrice("code", 100)
			.purchasable.SetDefaultRestriction()
			.SetRateSecond("money", 5)
	);
	game.data.generators.bugfix = game.AddGenerator(new Generator(game, "bugfix")
			.describable.SetTitle("Bugfix")
			.describable.SetEffect("Generates $12 per second.")
			.describable.SetDescription("Who doesn't hate a buggy product?")
			.purchasable.SetBuyPrice("code", 600)
			.purchasable.SetDefaultRestriction()
			.SetRateSecond("money", 12)
	);
	game.data.generators.feature = game.AddGenerator(new Generator(game, "feature")
			.describable.SetTitle("New feature")
			.describable.SetEffect("Generates $30 per second.")
			.describable.SetDescription("Ship it! :squirrel:")
			.purchasable.SetBuyPrice("code", 2500)
			.purchasable.SetDefaultRestriction()
			.SetRateSecond("money", 30)
	);
	game.data.generators.aisales = game.AddGenerator(new Generator(game, "aisales")
			.describable.SetTitle("AI salesperson")
			.describable.SetEffect("Generates $100 per second.")
			.describable.SetDescription("Who needs a real person when AI can close deals too?")
			.purchasable.SetBuyPrice("code", 12000)
			.purchasable.SetDefaultRestriction()
			.SetRateSecond("money", 100)
	);
	game.data.generators.analytics = game.AddGenerator(new Generator(game, "analytics")
			.describable.SetTitle("Analytics software")
			.describable.SetEffect("Generates $1000 per second.")
			.describable.SetDescription("Know your users.")
			.purchasable.SetBuyPrice("code", 100000)
			.purchasable.SetDefaultRestriction()
			.SetRateSecond("money", 1000)
	);

	//Upgrades
	game.data.upgrades.free = game.AddUpgrade(new Upgrade(game, "free")
			.describable.SetTitle("Free stuff")
			.describable.SetEffect("Gives you some free stuff.")
			.describable.SetDescription("Swag.")
			.rewardable.AddReward(new ResourceReward(game, game.data.resources.code, 1000000))
			.rewardable.AddReward(new ResourceReward(game, game.data.resources.money, 2000000))
	);
	game.data.upgrades.hire = game.AddUpgrade(new Upgrade(game, "hire")
			.describable.SetTitle("Job postings")
			.describable.SetEffect("Able to hire people.")
			.describable.SetDescription("Like a boss.")
			.purchasable.SetBuyPrice("money", 200)
			.purchasable.SetDefaultRestriction()
	);
	game.data.upgrades.chips = game.AddUpgrade(new Upgrade(game, "chips")
			.describable.SetTitle("Free chips")
			.describable.SetEffect("Interns code 50% faster.")
			.describable.SetDescription("Something for your interns to snack on. Be careful of greasy keyboards.")
			.purchasable.SetBuyPrice("money", 500)
			.purchasable.SetDefaultRestriction()
			.purchasable.AddRestriction(new AmountRestriction(game, game.data.generators.intern, 1))
			.rewardable.AddReward(new MultiplierReward(game, game.data.generators.intern, 0, 1.5))
	);
	game.data.upgrades.coffee = game.AddUpgrade(new Upgrade(game, "coffee")
			.describable.SetTitle("Free coffee")
			.describable.SetEffect("Programmers code 50% faster.")
			.describable.SetDescription("Programmers are creatures who convert coffee to code.")
			.purchasable.SetBuyPrice("money", 1000)
			.purchasable.SetDefaultRestriction()
			.purchasable.AddRestriction(new AmountRestriction(game, game.data.generators.programmer, 1))
			.rewardable.AddReward(new MultiplierReward(game, game.data.generators.programmer, 0, 1.5))
	);
	game.data.upgrades.cateredlunch = game.AddUpgrade(new Upgrade(game, "cateredlunch")
			.describable.SetTitle("Catered lunch")
			.describable.SetEffect("Everyone codes 3% faster.")
			.describable.SetDescription("Never bring lunch or eat out again.")
			.purchasable.SetBuyPrice("money", 5000)
			.purchasable.SetDefaultRestriction()
			.rewardable.AddReward(new MultiplierReward(game, game.data.resources.code, 0.03, 0))
	);

	//Achievements
	game.data.upgrades.millionaire = game.AddAchievement(new AmountAchievement(game, "millionaire", game.data.resources.money, 1000000)
			.describable.SetTitle("Millionaire")
			.describable.SetDescription("Get all the chicks you want.")
	);
	game.data.upgrades.billionaire = game.AddAchievement(new AmountAchievement(game, "billionaire", game.data.resources.money, 1000000000)
			.describable.SetTitle("Billionaire")
			.describable.SetDescription("Make it rain.")
	);
	game.data.upgrades.trillionaire = game.AddAchievement(new AmountAchievement(game, "trillionaire", game.data.resources.money, 1000000000000)
			.describable.SetTitle("Trillionaire")
			.describable.SetDescription("(Bill Gates + Mark Zuckerberg + Sean Parker + Elon Musk) * 7.899")
	);

	return game;
})();
