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

	return child;
}

function each(obj, func, context) {
	if (obj instanceof Array) {
		for (var i = 0; i < obj.length; i++) {
			if (func.call(context, obj[i], i, obj) === false) {
				return false;
			}
		}
	}
	else if (obj instanceof Object) {
		for (var key in obj) {
			if (func.call(context, obj[key], key, obj) === false) {
				return false;
			}
		}
	}
	return true;
}

function truefalse(input) {
	return input ? true : false;
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

function isInt(n) {
	return Number(n) === n && n % 1 === 0;
}

function approximateTo(from, to, factor) {
	return from + ((to - from) * factor);
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

function randomInt(start, end) {
	if(end === undefined) {
		return Math.floor(Math.random() * (start + 1));
	}
	return Math.floor(Math.random() * (end - start + 1) + start);
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

var BIG_NUMBER_TABLE = [
	{factor: 1000000, title: 'million'},
	{factor: 1000000000, title: 'billion'},
	{factor: 1000000000000, title: 'trillion'},
	{factor: 1000000000000000, title: 'quadrillion'},
	{factor: 1000000000000000000, title: 'quintillion'},
	{factor: 1000000000000000000000, title: 'sixtillion'}
];

function readableBigNumber(x, digits, overridedigits) {
	var million = 1000000;
	var billion = million * 1000;
	var trillion = billion * 1000;
	var quadrillion = trillion * 1000;

	if (digits === undefined) {
		digits = 0;
	}

	if (overridedigits === undefined) {
		overridedigits = 2;
	}

	var factor = Math.pow(10, digits);
	x = Math.round(x * factor) / factor;

	for(var i = BIG_NUMBER_TABLE.length - 1; i >= 0; i--) {
		if(x >= BIG_NUMBER_TABLE[i].factor) {
			return formatNumWithCommas((x / BIG_NUMBER_TABLE[i].factor).toFixed(overridedigits)) + ' ' + BIG_NUMBER_TABLE[i].title;
		}
	}

	return formatNumWithCommas(x.toFixed(digits));
}

function formatNumWithCommas(x) {
	return x.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatDollar(x) {
	if (x < 10) {
		return '$ ' + readableBigNumber(x, 1);
	} else {
		return '$ ' + readableBigNumber(x);
	}
}

function formatDollar(x) {
	if (x < 10) {
		return '$ ' + readableBigNumber(x, 1);
	} else {
		return '$ ' + readableBigNumber(x);
	}
}

function formatLinesOfCode(x) {
	return readableBigNumber(Math.ceil(x), 0) + ' lines';
}

function formatLinesOfCodePerSec(x) {
	if (x < 10) {
		return readableBigNumber(x, 1) + ' lines';
	} else {
		return readableBigNumber(x) + ' lines';
	}
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
		(keycode > 47 && keycode < 58) || // number keys
		keycode == 32 || keycode == 13 || // spacebar & return key(s) (if you want to allow carriage returns)
		(keycode > 64 && keycode < 91) || // letter keys
		(keycode > 95 && keycode < 112) || // numpad keys
		(keycode > 185 && keycode < 193) || // ;=,-./` (in order)
		(keycode > 218 && keycode < 223);   // [\]' (in order)

	return valid;
}