var GAME = (function() {

	var game = new Game();

	game.AddResource(new Resource(game, 'money'));
	game.AddResource(new Resource(game, 'code'));

	//Hires
	game.AddGenerator(new Generator(game, 'webdev')
			.desc.SetTitle('Web developer')
			.desc.SetDescription('Writes 5 lines of code per second.')
			.purchase.AddBuyPrice('money', 100)
			.AddRateSecond('code', 5)
	);
	game.AddGenerator(new Generator(game, 'opmanager')
			.desc.SetTitle('Opeartion manager')
			.desc.SetDescription('Doesn\'t code, but can help upgrade your company.')
			.purchase.AddBuyPrice('money', 150)
			.purchase.AddRestriction('money', 100)
	);
	game.AddGenerator(new Generator(game, 'android')
			.desc.SetTitle('Android developer')
			.desc.SetDescription('Writes 20 lines of code per second.')
			.purchase.AddBuyPrice('money', 200)
			.purchase.AddRestriction('money', 150)
			.AddRateSecond('code', 20)
	);
	game.AddGenerator(new Generator(game, 'dba')
			.desc.SetTitle('Database admin')
			.desc.SetDescription('Writes 60 lines of code per second.')
			.purchase.AddBuyPrice('money', 350)
			.purchase.AddRestriction('money', 300)
			.AddRateSecond('code', 60)
	);

	//Features
	game.AddGenerator(new Generator(game, 'landing')
			.desc.SetTitle('Landing page')
			.desc.SetDescription('Earns an additional $10 per second.')
			.purchase.AddBuyPrice('code', 15)
			.AddRateSecond('money', 10)
	);
	game.AddGenerator(new Generator(game, 'careerspage')
			.desc.SetTitle('Careers page')
			.desc.SetDescription('Able to hire people.')
			.purchase.AddBuyPrice('code', 30)
			.purchase.AddRestriction('code', 10)
	);
	game.AddGenerator(new Generator(game, 'flatdesign')
			.desc.SetTitle('Flat UI design')
			.desc.SetDescription('Earns an additional $30 per second.')
			.purchase.AddBuyPrice('code', 50)
			.purchase.AddRestriction('code', 30)
			.AddRateSecond('money', 30)
	);
	game.AddGenerator(new Generator(game, 'cslivechat')
			.desc.SetTitle('Customer service livechat')
			.desc.SetDescription('Earns an additional $50 per second.')
			.purchase.AddBuyPrice('code', 80)
			.purchase.AddRestriction('code', 60)
			.AddRateSecond('money', 50)
	);

	return game;
})();
