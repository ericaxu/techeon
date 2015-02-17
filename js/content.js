var GAME = (function() {

    var generators = [
        {
            name: 'webdev',
            title: 'Web developer',
            description: 'Writes 20 lines of code per second.',
            price: {
                money: 100
            },
            rates: {
                code: 5
            },
            restriction: {
                money: 0
            }
        },
        {
            name: 'opmanager',
            title: 'Opeartion manager',
            description: 'Doesn\'t code, but can help upgrade your company.',
            price: {
                money: 150
            },
            rates: {
                //enables upgrades
            },
            restriction: {
                money: 100
            }
        },
        {
            name: 'android',
            title: 'Android developer',
            description: 'Writes 40 lines of code per second.',
            price: {
                money: 200
            },
            rates: {
                code: 20
            },
            restriction: {
                money: 150
            }
        },
        {
            name: 'dba',
            title: 'Database admin',
            description: 'Writes 60 lines of code per second.',
            price: {
                money: 350
            },
            rates: {
                code: 90
            },
            restriction: {
                money: 300
            }
        }
    ];

    var features = [
        {
            name: 'landing',
            title: 'Landing page',
            description: 'Earns an additional $10 per second.',
            price: {
                code: 15
            },
            rates: {
                money: 10
            },
            restriction: {
                code: 0
            }
        },
        {
            name: 'careerspage',
            title: 'Careers page',
            description: 'Able to hire people.',
            price: {
                code: 30
            },
            rates: {
                // enable hiring people
            },
            restriction: {
                code: 10
            }
        },
        {
            name: 'flatdesign',
            title: 'Flat UI design',
            description: 'Earns an additional $10 per second.',
            price: {
                code: 50
            },
            rates: {
                money: 30
            },
            restriction: {
                code: 30
            }
        },
        {
            name: 'cslivechat',
            title: 'Customer service livechat',
            description: 'Earns an additional $50 per second.',
            price: {
                code: 80
            },
            rates: {
                money: 50
            },
            restriction: {
                code: 60
            }
        }
    ];


    var game = new Game();

    game.CreateResource('money');
    game.CreateResource('code');

    var importGenerator = function(generator) {
        var object = game.CreateGenerator(generator.name).SetTitle(generator.title).SetDescription(generator.description);
        for (var key in generator.price) {
            object.AddBuyPrice(key, generator.price[key]);
        }
        for (var key in generator.rates) {
            object.AddRate(key, generator.rates[key] / game.GetTicksPerSecond());
        }
        for (var key in generator.restriction) {
            object.AddRestriction(key, generator.restriction[key]);
        }
    };

    for (var i = 0; i < generators.length; i++) {
        importGenerator(generators[i]);
    }

    for (var i = 0; i < features.length; i++) {
        importGenerator(features[i]);
    }

    return game;
})();
