if (!Object.create) {
	Object.create = function(prototype) {
		function ctor() {
		}

		ctor.prototype = prototype;
		return new ctor();
	}
}

function extend(child, parent, prototype) {
	inherit(child, parent);

	for (var key in prototype) {
		child.prototype[key] = prototype[key];
	}
}

function inherit(child, parent) {
	if (parent) {
		child.prototype = Object.create(parent.prototype);
		child.constructor = child;
	}
}

function bind(func, context) {
	return function() {
		return func.apply(context, arguments);
	}
}

function cloneSimple(obj) {
	var copy;

	// Handle the 3 simple types, and null or undefined
	if (null == obj || "object" != typeof obj) return obj;

	// Handle Array
	if (obj instanceof Array) {
		copy = [];
		for (var i = 0, len = obj.length; i < len; i++) {
			copy[i] = obj[i];
		}
		return copy;
	}

	// Handle Object
	if (obj instanceof Object) {
		copy = {};
		for (var attr in obj) {
			if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
		}
		return copy;
	}

	throw new Error("Unable to copy obj! Its type isn't supported.");
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
