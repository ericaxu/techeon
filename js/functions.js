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

function addEl(tag, parent, className, text, attr) {
    var $el = $('<' + tag + '/>');

    if (className) {
        $el.attr('class', className)
    }

    if (text) {
        $el.text(text)
    }

    if (attr) {
        $el.attr(attr);
    }

    if (parent) {
        parent.append($el);
    }

    return $el;
}

function formatNumWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
