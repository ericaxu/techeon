var GAME = (function() {

	var game = new Game();

	game.AddResource(new Resource(game, 'money'));
	game.AddResource(new Resource(game, 'code'));

	//Hires
	game.AddGenerator(new Generator(game, 'webdev')
			.describable.SetTitle('Web developer')
			.describable.SetEffect('Produces 5 lines of code per second.')
			.describable.SetDescription('Knows HTML, Javascript and CSS.')
			.purchasable.SetBuyPrice('money', 100)
			.purchasable.SetSellPriceBuyFactor('money', 0.75)
			.SetRateSecond('code', 5)
	);
	game.AddGenerator(new Generator(game, 'opmanager')
			.describable.SetTitle('Opeartion manager')
			.describable.SetEffect('Unlocks upgrades.')
			.describable.SetDescription('Doesn\'t code, but can help your company.')
			.purchasable.SetBuyPrice('money', 150)
			.purchasable.SetSellPriceBuyFactor('money', 0.75)
			.purchasable.SetRestriction('money', 100)
	);
	game.AddGenerator(new Generator(game, 'android')
			.describable.SetTitle('Android developer')
			.describable.SetEffect('Produces 20 lines of code per second.')
			.describable.SetDescription('Yeah, we\'ll need mobile apps.')
			.purchasable.SetBuyPrice('money', 200)
			.purchasable.SetSellPriceBuyFactor('money', 0.75)
			.purchasable.SetRestriction('money', 150)
			.SetRateSecond('code', 20)
	);
	game.AddGenerator(new Generator(game, 'dba')
			.describable.SetTitle('Database admin')
			.describable.SetEffect('Produces 60 lines of code per second.')
			.describable.SetDescription('Need an SQL query anyone?')
			.purchasable.SetBuyPrice('money', 350)
			.purchasable.SetSellPriceBuyFactor('money', 0.75)
			.purchasable.SetRestriction('money', 300)
			.SetRateSecond('code', 60)
	);

	//Features
	game.AddGenerator(new Generator(game, 'landing')
			.describable.SetTitle('Landing page')
			.describable.SetEffect('Generates $10 per second.')
			.describable.SetDescription('It\'s crazy how much money you can make with ads.')
			.purchasable.SetBuyPrice('code', 15)
			.purchasable.SetSellPriceBuyFactor('money', 0.75)
			.SetRateSecond('money', 10)
	);
	game.AddGenerator(new Generator(game, 'careerspage')
			.describable.SetTitle('Careers page')
			.describable.SetEffect('Unlocks hiring.')
			.describable.SetDescription('We have a trillion-dollar idea, come join us.')
			.purchasable.SetBuyPrice('code', 30)
			.purchasable.SetSellPriceBuyFactor('money', 0.75)
			.purchasable.SetRestriction('code', 10)
	);
	game.AddGenerator(new Generator(game, 'flatdesign')
			.describable.SetTitle('Flat UI design')
			.describable.SetEffect('Generates $30 per second.')
			.describable.SetDescription('Back to the good old days of HTML4.')
			.purchasable.SetBuyPrice('code', 50)
			.purchasable.SetSellPriceBuyFactor('money', 0.75)
			.purchasable.SetRestriction('code', 30)
			.SetRateSecond('money', 30)
	);
	game.AddGenerator(new Generator(game, 'cslivechat')
			.describable.SetTitle('Customer service livechat')
			.describable.SetEffect('Generates $50 per second.')
			.describable.SetDescription('Sir, please unplug and replug the power wire to reboot your router.')
			.purchasable.SetBuyPrice('code', 80)
			.purchasable.SetSellPriceBuyFactor('money', 0.75)
			.purchasable.SetRestriction('code', 60)
			.SetRateSecond('money', 50)
	);

	//Upgrades
	game.AddUpgrade(new Upgrade(game, 'freestuff')
			.describable.SetTitle('Free stuff!')
			.describable.SetEffect('Gives you some free stuff.')
			.describable.SetDescription('Swag.')
			.rewardable.AddReward(new ResourceReward(game, 'code', 1000))
			.rewardable.AddReward(new ResourceReward(game, 'money', 2000))
	);
	game.AddUpgrade(new Upgrade(game, 'jquery')
			.describable.SetTitle('jQuery for Enterprise')
			.describable.SetEffect('Web developers +5 base lines of code per second.')
			.describable.SetDescription('Imagine the increase in productivity!')
			.purchasable.SetBuyPrice('money', 500)
			.purchasable.SetRestriction('money', 300)
			.rewardable.AddReward(new BaseRateReward(game, 'webdev', 'code', game.GetRateTickFromSecond(5)))
	);
	game.AddUpgrade(new Upgrade(game, 'ergokeyboard')
			.describable.SetTitle('Ergonomic Keyboard')
			.describable.SetEffect('Web developers code twice as fast.')
			.describable.SetDescription('Nice keyboard.')
			.purchasable.SetBuyPrice('money', 800)
			.purchasable.SetRestriction('money', 500)
			.rewardable.AddReward(new MultiplierReward(game, 'webdev', 'code', 0, 2))
	);
	game.AddUpgrade(new Upgrade(game, 'ddosprotect')
			.describable.SetTitle('DDOS protection')
			.describable.SetEffect('Landing pages generates 3 times their revenue.')
			.describable.SetDescription('99.99% uptime guaranteed.')
			.purchasable.SetBuyPrice('money', 1200)
			.purchasable.SetRestriction('money', 800)
			.rewardable.AddReward(new MultiplierReward(game, 'landing', 'money', 0, 3))
	);

	//Achievements
	game.AddAchievement(new AmountAchievement(game, 'live', game.content.generators['landing'], 1)
			.describable.SetTitle('It\'s Live!')
			.describable.SetDescription('Make a landing page.')
	);
	game.AddAchievement(new AmountAchievement(game, 'hiring', game.content.generators['careerspage'], 1)
			.describable.SetTitle('We\'re Hiring!')
			.describable.SetDescription('Make a careers page.')
	);
	game.AddAchievement(new AmountAchievement(game, 'flatui', game.content.generators['flatdesign'], 1)
			.describable.SetTitle('It\'s the new trend')
			.describable.SetDescription('Make a flat UI.')
	);
	game.AddAchievement(new AmountAchievement(game, 'usersupport', game.content.generators['cslivechat'], 1)
			.describable.SetTitle('Online call center')
			.describable.SetDescription('Make a customer service livechat page.')
	);

	game.AddAchievement(new AmountAchievement(game, 'html', game.content.generators['webdev'], 1)
			.describable.SetTitle('HTML, HTML everywhere')
			.describable.SetDescription('Hire a web developer.')
	);
	game.AddAchievement(new AmountAchievement(game, 'opsman', game.content.generators['opmanager'], 1)
			.describable.SetTitle('Macromanagement')
			.describable.SetDescription('Hire an operation manager.')
	);
	game.AddAchievement(new AmountAchievement(game, 'android', game.content.generators['android'], 1)
			.describable.SetTitle('Jelly Bean')
			.describable.SetDescription('Hire an Android developer.')
	);

	return game;
})();
