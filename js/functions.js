if (!Object.create) {
    Object.create = function(prototype) {
        function ctor() {
        }

        ctor.prototype = prototype;
        return new ctor();
    }
}

function inherit(prototype, constructor) {
    var result = Object.create(prototype);
    result.constructor = constructor;
    return result;
}

function currentTimeMS() {
    return new Date().getTime();
}

function ctxSetTimeout(func, timeout, context) {
    var callback = function() {
        func.call(context);
    };
    return setTimeout(callback, timeout);
}

Events = function() {
    this.events = {};
};
Events.prototype.on = function(name, func, context) {
    if (!this.events[name]) {
        this.events[name] = [];
    }
    this.events[name].push({func: func, context: context})
};
Events.prototype.off = function(name, func) {
    if (!func || !this.events[name]) {
        return;
    }
    var list = this.events[name];
    for (var i = 0; i < list.length; i++) {
        if (list[i] == func) {
            list.splice(i, 1);
        }
    }
};
Events.prototype.trigger = function() {
    var args = Array.apply([], arguments);
    var name = args.shift();
    var list = this.events[name];
    if (!list) {
        return;
    }
    for (var i = 0; i < list.length; i++) {
        list[i].func.apply(list[i].context, args);
    }
};
