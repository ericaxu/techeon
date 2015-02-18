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
			.describable.SetDescription('Earns an additional $10 per second.')
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

	return game;
})();
