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
