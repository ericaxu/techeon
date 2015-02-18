var GAME = (function() {

	var game = new Game();

	game.AddResource(new Resource(game, 'money'));
	game.AddResource(new Resource(game, 'code'));

	//Hires
	game.AddGenerator(new Generator(game, 'webdev')
			.describable.SetTitle('Web developer')
			.describable.SetDescription('Writes 5 lines of code per second.')
			.purchasable.AddBuyPrice('money', 100)
			.AddRateSecond('code', 5)
	);
	game.AddGenerator(new Generator(game, 'opmanager')
			.describable.SetTitle('Opeartion manager')
			.describable.SetDescription('Doesn\'t code, but can help upgrade your company.')
			.purchasable.AddBuyPrice('money', 150)
			.purchasable.AddRestriction('money', 100)
	);
	game.AddGenerator(new Generator(game, 'android')
			.describable.SetTitle('Android developer')
			.describable.SetDescription('Writes 20 lines of code per second.')
			.purchasable.AddBuyPrice('money', 200)
			.purchasable.AddRestriction('money', 150)
			.AddRateSecond('code', 20)
	);
	game.AddGenerator(new Generator(game, 'dba')
			.describable.SetTitle('Database admin')
			.describable.SetDescription('Writes 60 lines of code per second.')
			.purchasable.AddBuyPrice('money', 350)
			.purchasable.AddRestriction('money', 300)
			.AddRateSecond('code', 60)
	);

	//Features
	game.AddGenerator(new Generator(game, 'landing')
			.describable.SetTitle('Landing page')
			.describable.SetDescription('Generates $10 of Ads revenue per second.')
			.purchasable.AddBuyPrice('code', 15)
			.AddRateSecond('money', 10)
	);
	game.AddGenerator(new Generator(game, 'careerspage')
			.describable.SetTitle('Careers page')
			.describable.SetDescription('Able to hire people.')
			.purchasable.AddBuyPrice('code', 30)
			.purchasable.AddRestriction('code', 10)
	);
	game.AddGenerator(new Generator(game, 'flatdesign')
			.describable.SetTitle('Flat UI design')
			.describable.SetDescription('Earns an additional $30 per second.')
			.purchasable.AddBuyPrice('code', 50)
			.purchasable.AddRestriction('code', 30)
			.AddRateSecond('money', 30)
	);
	game.AddGenerator(new Generator(game, 'cslivechat')
			.describable.SetTitle('Customer service livechat')
			.describable.SetDescription('Earns an additional $50 per second.')
			.purchasable.AddBuyPrice('code', 80)
			.purchasable.AddRestriction('code', 60)
			.AddRateSecond('money', 50)
	);

	//Upgrades
	game.AddUpgrade(new Upgrade(game, 'freestuff')
			.describable.SetTitle('Free stuff!')
			.describable.SetDescription('Here\'s some free stuff to get you started!')
			.rewardable.AddReward(new ResourceReward(game, game.content.resources.code, 1000))
			.rewardable.AddReward(new ResourceReward(game, game.content.resources.money, 2000))
	);
	game.AddUpgrade(new Upgrade(game, 'jquery')
			.describable.SetTitle('JQuery')
			.describable.SetDescription('Web developers can write more code in the same amount of time (+5 base).')
			.rewardable.AddReward(new BaseRateReward(game, game.content.generators.webdev, 'code', game.GetRateTickFromSecond(5)))
	);
	game.AddUpgrade(new Upgrade(game, 'ergokeyboard')
			.describable.SetTitle('Ergonomic Keyboard')
			.describable.SetDescription('Web developers code twice as fast.')
			.rewardable.AddReward(new MultiplierReward(game, game.content.generators.webdev, 'code', 0, 2))
	);
	game.AddUpgrade(new Upgrade(game, 'ddosprotect')
			.describable.SetTitle('DDOS protection')
			.describable.SetDescription('Landing pages generates 3 times their Ads revenue.')
			.rewardable.AddReward(new MultiplierReward(game, game.content.generators.landing, 'money', 0, 3))
	);

	//Achievements
	game.AddAchievement(new AmountAchievement(game, 'live', game.content.generators.landing, 1)
			.describable.SetTitle('It\'s Live!')
			.describable.SetDescription('Make a landing page.')
	);
	game.AddAchievement(new AmountAchievement(game, 'hiring', game.content.generators.careerspage, 1)
			.describable.SetTitle('We\'re Hiring!')
			.describable.SetDescription('Make a careers page.')
	);
	game.AddAchievement(new AmountAchievement(game, 'flatui', game.content.generators.flatdesign, 1)
			.describable.SetTitle('It\'s the new trend')
			.describable.SetDescription('Make a flat UI.')
	);
	game.AddAchievement(new AmountAchievement(game, 'usersupport', game.content.generators.cslivechat, 1)
			.describable.SetTitle('Online call center')
			.describable.SetDescription('Make a customer service livechat page.')
	);

	game.AddAchievement(new AmountAchievement(game, 'html', game.content.generators.webdev, 1)
			.describable.SetTitle('HTML, HTML everywhere')
			.describable.SetDescription('Hire a web developer.')
	);
	game.AddAchievement(new AmountAchievement(game, 'opsman', game.content.generators.opmanager, 1)
			.describable.SetTitle('Macromanagement')
			.describable.SetDescription('Hire an operation manager.')
	);
	game.AddAchievement(new AmountAchievement(game, 'android', game.content.generators.android, 1)
			.describable.SetTitle('Jelly Bean')
			.describable.SetDescription('Hire an Android developer.')
	);

	return game;
})();
