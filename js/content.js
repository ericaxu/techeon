var generatorsData = [
    {
        name: 'webdev',
        title: 'Web developer',
        description: 'Writes 20 lines of code per second.',
        cost: {
            money: 100
        },
        effect: {
            code: 5
        },
        restriction: {
            money: 0
        }
    },
    {
        name: 'opmanager',
        title: 'Opeartion manager',
        description: 'Doesn\' code, but can help upgrade your company.',
        cost: {
            money: 150
        },
        effect: {
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
        cost: {
            money: 200
        },
        effect: {
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
        cost: {
            money: 350
        },
        effect: {
            code: 90
        },
        restriction: {
            money: 300
        }
    }
];

var featuresData = [
    {
        name: 'landing',
        title: 'Landing page',
        description: 'Earns an additional $10 per second.',
        cost: {
            code: 15
        },
        effect: {
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
        cost: {
            code: 30
        },
        effect: {
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
        cost: {
            code: 50
        },
        effect: {
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
        cost: {
            code: 80
        },
        effect: {
            money: 50
        },
        restriction: {
            code: 60
        }
    }
];

var GAME = new Game();
GAME.CreateResource('money');
GAME.CreateResource('code');

for (var i = 0; i < generatorsData.length; i++) {
    var generatorData = generatorsData[i];
    var generator = GAME.CreateGenerator(generatorData.name);
    for (var c in generatorData.cost) {
        generator.AddBuyPrice(c, generatorData.cost[c]);
    }
    for (var r in generatorData.effect) {
        generator.AddRate(r, generatorData.effect[r] / GAME.GetTicksPerSecond());
    }
    for (var r in generatorData.restriction) {
        generator.AddRestriction(r, generatorData.restriction[r]);
    }
}

for (var i = 0; i < featuresData.length; i++) {
    var featureData = featuresData[i];
    var feature = GAME.CreateGenerator(featureData.name);
    for (var c in featureData.cost) {
        feature.AddBuyPrice(c, featureData.cost[c]);
    }
    for (var r in featureData.effect) {
        feature.AddRate(r, featureData.effect[r] / GAME.GetTicksPerSecond());
    }
    for (var r in featureData.restriction) {
        feature.AddRestriction(r, featureData.restriction[r]);
    }
}