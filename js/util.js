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

function isObject(object) {
	return object !== null && typeof object === 'object';
}

function isArray(object) {
	return object !== null && object.constructor === Array
}

function isString(object) {
	return object !== null && (typeof object == 'string' || object instanceof String)
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

function readableBigNumber(x, digits) {
	var million = 1000000;
	var billion = million * 1000;
	var trillion = billion * 1000;
	var quadrillion = trillion * 1000;

	if (digits === undefined) {
		var digits = 2;
	}

	if (x > quadrillion) {
		return formatNumWithCommas((x / quadrillion).toFixed(2)) + ' quadrillion';
	}
	if (x > trillion) {
		return formatNumWithCommas((x / trillion).toFixed(2)) + ' trillion';
	}
	if (x > billion) {
		return formatNumWithCommas((x / billion).toFixed(2)) + ' billion';
	}
	if (x > million) {
		return formatNumWithCommas((x / million).toFixed(2)) + ' million';
	}

	return formatNumWithCommas(parseFloat(x.toFixed(digits)));
}

function formatNumWithCommas(x) {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatDollar(x) {
	return '$ ' + readableBigNumber(x);
}

function formatLinesOfCode(x) {
	return readableBigNumber(x, 0) + ' lines';
}

function drawDoubleBorder($container) {
	var $outerBorder1 = addEl('div', $container, 'outer-border-1 fancy-border');
	var $outerBorder2 = addEl('div', $outerBorder1, 'outer-border-2 fancy-border');
	var $innerWrapper = addEl('div', $outerBorder2, 'inner-wrapper');
	var $innerBorder1 = addEl('div', $innerWrapper, 'inner-border-1 fancy-border');
	var $innerBorder2 = addEl('div', $innerBorder1, 'inner-border-2 fancy-border');

	return $innerBorder2;
}

// determines if keycode represents a non-control character
function isPrintable(keycode) {
	var valid =
		(keycode > 47 && keycode < 58)   || // number keys
		keycode == 32 || keycode == 13   || // spacebar & return key(s) (if you want to allow carriage returns)
		(keycode > 64 && keycode < 91)   || // letter keys
		(keycode > 95 && keycode < 112)  || // numpad keys
		(keycode > 185 && keycode < 193) || // ;=,-./` (in order)
		(keycode > 218 && keycode < 223);   // [\]' (in order)

	return valid;
}