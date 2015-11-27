/* globals require, Buffer, describe, it */

var assert = require('assert');
var File = require('vinyl');
var tf = require('../src/index.js');

describe('gulp-simple-text', function () {

	describe('as transparent function', function () {

		it('should call the transformation function', function () {
			var called = false;
			var f = function () { called = true; };
			var t = tf(f);
			assert(!called, 'called f during construction');
			t("text");
			assert(called, 'did not call f during application with string');
		});

		it('should pass the input text to the transformation function', function () {
			var expected = "text";
			var result = undefined;
			var f = function (text) { result = text; };
			var t = tf(f);
			t(expected);
			assert(expected === result, 'did not pass the input to f');
		});

		it('should pass options to the transformation function', function () {
			var expected = new Object();
			var result = undefined;
			var f = function (text, options) { result = options; };
			var t = tf(f);
			t("something", expected);
			assert(expected === result, 'did not pass the options to f');
		});

		it('should return result of the transformation function', function () {
			var expected = new Object();
			var f = function () { return expected; };
			var t = tf(f);
			var result = t("something");
			assert(expected === result, 'did not return the result of f');
		});

	});

});
