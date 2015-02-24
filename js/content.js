var GAME = (function() {

	var game = new Game();

	game.data.resources.money = game.AddResource(new Resource(game, "money"));
	game.data.resources.code = game.AddResource(new Resource(game, "code"));

	//Hires
	game.data.generators.webdev = game.AddGenerator(new Generator(game, "intern")
			.describable.SetTitle("Intern")
			.describable.SetEffect("Produces 1 lines of code every 5 seconds.")
			.describable.SetDescription("Don't really know anything and breaks the build occasionally.")
			.purchasable.SetBuyPrice("money", 100)
			.purchasable.SetSellPriceBuyFactor("money", 0.75)
			.SetRateSecond("code", 0.2)
	);
	game.data.generators.opmanager = game.AddGenerator(new Generator(game, "junior")
			.describable.SetTitle("Junior Programmer")
			.describable.SetEffect("Produces 1 lines of code per second.")
			.describable.SetDescription("Fresh out of college, knows a bit coding.")
			.purchasable.SetBuyPrice("money", 250)
			.purchasable.SetSellPriceBuyFactor("money", 0.75)
			.purchasable.SetRestriction("money", 100)
			.SetRateSecond("code", 1)
	);
	game.data.generators.android = game.AddGenerator(new Generator(game, "contractor")
			.describable.SetTitle("Contractor")
			.describable.SetEffect("Produces 5 lines of code per second.")
			.describable.SetDescription("Like a normal employee, except you don't have to pay for his insurance.")
			.purchasable.SetBuyPrice("money", 500)
			.purchasable.SetSellPriceBuyFactor("money", 0.75)
			.purchasable.SetRestriction("money", 300)
			.SetRateSecond("code", 5)
	);
	game.data.generators.dba = game.AddGenerator(new Generator(game, "programmer")
			.describable.SetTitle("Programmer")
			.describable.SetEffect("Produces 15 lines of code per second.")
			.describable.SetDescription("Coffee in, code out.")
			.purchasable.SetBuyPrice("money", 1000)
			.purchasable.SetSellPriceBuyFactor("money", 0.75)
			.purchasable.SetRestriction("money", 600)
			.SetRateSecond("code", 15)
	);
	game.data.generators.dba = game.AddGenerator(new Generator(game, "senior")
			.describable.SetTitle("Senior Programmer")
			.describable.SetEffect("Produces 35 lines of code per second.")
			.describable.SetDescription("Has consumed more coffee and produced more code.")
			.purchasable.SetBuyPrice("money", 2000)
			.purchasable.SetSellPriceBuyFactor("money", 0.75)
			.purchasable.SetRestriction("money", 1500)
			.SetRateSecond("code", 35)
	);
	game.data.generators.dba = game.AddGenerator(new Generator(game, "architect")
			.describable.SetTitle("Software Architect")
			.describable.SetEffect("Produces 100 lines of code per second.")
			.describable.SetDescription("A pro.")
			.purchasable.SetBuyPrice("money", 5000)
			.purchasable.SetSellPriceBuyFactor("money", 0.75)
			.purchasable.SetRestriction("money", 3000)
			.SetRateSecond("code", 100)
	);
	game.data.generators.dba = game.AddGenerator(new Generator(game, "teamlead")
			.describable.SetTitle("Team Lead")
			.describable.SetEffect("Produces 500 lines of code per second.")
			.describable.SetDescription("Manages programmers.")
			.purchasable.SetBuyPrice("money", 15000)
			.purchasable.SetSellPriceBuyFactor("money", 0.75)
			.purchasable.SetRestriction("money", 7500)
			.SetRateSecond("code", 500)
	);
	game.data.generators.dba = game.AddGenerator(new Generator(game, "vpeng")
			.describable.SetTitle("VP of Engineering")
			.describable.SetEffect("Produces 1000 lines of code per second.")
			.describable.SetDescription("Codes really fast.")
			.purchasable.SetBuyPrice("money", 50000)
			.purchasable.SetSellPriceBuyFactor("money", 0.75)
			.purchasable.SetRestriction("money", 20000)
			.SetRateSecond("code", 1000)
	);

	//Features
	game.data.generators.landing = game.AddGenerator(new Generator(game, "landing")
			.describable.SetTitle("Landing page")
			.describable.SetEffect("Generates $10 per second.")
			.describable.SetDescription("It\"s crazy how much money you can make with ads.")
			.purchasable.SetBuyPrice("code", 15)
			.purchasable.SetSellPriceBuyFactor("money", 0.75)
			.SetRateSecond("money", 10)
	);
	game.data.generators.careerspage = game.AddGenerator(new Generator(game, "careerspage")
			.describable.SetTitle("Careers page")
			.describable.SetEffect("Unlocks hiring.")
			.describable.SetDescription("We have a trillion-dollar idea, come join us.")
			.purchasable.SetBuyPrice("code", 30)
			.purchasable.SetSellPriceBuyFactor("money", 0.75)
			.purchasable.SetRestriction("code", 10)
	);
	game.data.generators.flatdesign = game.AddGenerator(new Generator(game, "flatdesign")
			.describable.SetTitle("Flat UI design")
			.describable.SetEffect("Generates $30 per second.")
			.describable.SetDescription("Back to the good old days of HTML4.")
			.purchasable.SetBuyPrice("code", 50)
			.purchasable.SetSellPriceBuyFactor("money", 0.75)
			.purchasable.SetRestriction("code", 30)
			.SetRateSecond("money", 30)
	);
	game.data.generators.cslivechat = game.AddGenerator(new Generator(game, "cslivechat")
			.describable.SetTitle("Customer service livechat")
			.describable.SetEffect("Generates $50 per second.")
			.describable.SetDescription("Sir, please unplug and replug the power wire to reboot your router.")
			.purchasable.SetBuyPrice("code", 80)
			.purchasable.SetSellPriceBuyFactor("money", 0.75)
			.purchasable.SetRestriction("code", 60)
			.SetRateSecond("money", 50)
	);

	//Upgrades
	game.data.upgrades.freestuff = game.AddUpgrade(new Upgrade(game, "freestuff")
			.describable.SetTitle("Free stuff!")
			.describable.SetEffect("Gives you some free stuff.")
			.describable.SetDescription("Swag.")
			.rewardable.AddReward(new ResourceReward(game, game.data.resources.code, 1000))
			.rewardable.AddReward(new ResourceReward(game, game.data.resources.money, 2000))
	);
	game.data.upgrades.jquery = game.AddUpgrade(new Upgrade(game, "jquery")
			.describable.SetTitle("jQuery for Enterprise")
			.describable.SetEffect("Web developers +5 base lines of code per second.")
			.describable.SetDescription("Imagine the increase in productivity!")
			.purchasable.SetBuyPrice("money", 500)
			.purchasable.SetRestriction("money", 300)
			.rewardable.AddReward(new BaseRateReward(game, "webdev", "code", game.GetRateTickFromSecond(5)))
	);
	game.data.upgrades.ergokeyboard = game.AddUpgrade(new Upgrade(game, "ergokeyboard")
			.describable.SetTitle("Ergonomic Keyboard")
			.describable.SetEffect("Web developers code twice as fast.")
			.describable.SetDescription("Nice keyboard.")
			.purchasable.SetBuyPrice("money", 800)
			.purchasable.SetRestriction("money", 500)
			.rewardable.AddReward(new MultiplierReward(game, "webdev", "code", 0, 2))
	);
	game.data.upgrades.ddosprotect = game.AddUpgrade(new Upgrade(game, "ddosprotect")
			.describable.SetTitle("DDOS protection")
			.describable.SetEffect("Landing pages generates 3 times their revenue.")
			.describable.SetDescription("99.99% uptime guaranteed.")
			.purchasable.SetBuyPrice("money", 1200)
			.purchasable.SetRestriction("money", 800)
			.rewardable.AddReward(new MultiplierReward(game, "landing", "money", 0, 3))
	);

	//Achievements
	game.data.upgrades.live = game.AddAchievement(new AmountAchievement(game, "live", game.data.generators.landing, 1)
			.describable.SetTitle("It\"s Live!")
			.describable.SetDescription("Make a landing page.")
	);
	game.data.upgrades.hiring = game.AddAchievement(new AmountAchievement(game, "hiring", game.data.generators.careerspage, 1)
			.describable.SetTitle("We\"re Hiring!")
			.describable.SetDescription("Make a careers page.")
	);
	game.data.upgrades.flatui = game.AddAchievement(new AmountAchievement(game, "flatui", game.data.generators.flatdesign, 1)
			.describable.SetTitle("It\"s the new trend")
			.describable.SetDescription("Make a flat UI.")
	);
	game.data.upgrades.usersupport = game.AddAchievement(new AmountAchievement(game, "usersupport", game.data.generators.cslivechat, 1)
			.describable.SetTitle("Online call center")
			.describable.SetDescription("Make a customer service livechat page.")
	);

	game.data.upgrades.html = game.AddAchievement(new AmountAchievement(game, "html", game.data.generators.webdev, 1)
			.describable.SetTitle("HTML, HTML everywhere")
			.describable.SetDescription("Hire a web developer.")
	);
	game.data.upgrades.opsman = game.AddAchievement(new AmountAchievement(game, "opsman", game.data.generators.opmanager, 1)
			.describable.SetTitle("Macromanagement")
			.describable.SetDescription("Hire an operation manager.")
	);
	game.data.upgrades.android = game.AddAchievement(new AmountAchievement(game, "android", game.data.generators.android, 1)
			.describable.SetTitle("Jelly Bean")
			.describable.SetDescription("Hire an Android developer.")
	);

	return game;
})();
