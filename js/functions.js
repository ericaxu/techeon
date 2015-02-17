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
