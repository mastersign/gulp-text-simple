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

	describe('as Gulp transformation', function () {

		describe('with null files', function () {

			it('should not call the transformation function', function (done) {
				var fakeFile = new File({ contents: null });
				var called = false;
				var f = function () { called = true; };
				
				var t = tf(f);
				var gt = t();
				
				gt.write(fakeFile);
				
				gt.once('data', function (file) {
					assert(!called, 'called transformation function');
					done();
				});
			});

			it('should pass the file unchanged', function (done) {
				var fakeFile = new File({ contents: null });

				var t = tf(function () {});
				var gt = t();
				
				gt.write(fakeFile);
				gt.once('data', function (file) {
					assert(file.isNull(), 'passed file is not a null file');
					assert(file === fakeFile, 'file was not passed unchanged');
					done();
				});
			});

		});

		describe('in buffer mode', function () {
			
			it('should call the transformation function', function (done) {
				var fakeFile = new File({ contents: new Buffer("abc", 'utf-8') });
				var called = false;
				var f = function () { called = true; return "xyz"; };

				var t = tf(f);
				var gt = t();

				gt.write(fakeFile);
				gt.once('data', function (file) {
					assert(called, 'did not call transformation function');
					done();
				});
			});

			it('should pass the input to the transformation function', function (done) {
				var expected = "input text";
				var result = undefined;
				var fakeFile = new File({ contents: new Buffer(expected, 'utf-8') });
				var f = function (text) { result = text; return "xyz"; };

				var t = tf(f);
				var gt = t();

				gt.write(fakeFile);
				gt.once('data', function (file) {
					assert.equal(result, expected, 'did not pass the input text to f');
					done();
				});
			});

			it('should pass the options to the transformation function', function (done) {
				var expected = { a: 1 };
				var result = undefined;
				var fakeFile = new File({ contents: new Buffer("abc", 'utf-8') });
				var f = function (text, options) { result = options; return "xyz"; };

				var t = tf(f);
				var gt = t(expected);

				gt.write(fakeFile);
				gt.once('data', function (file) {
					assert(result === expected, 'did not pass the options to f');
					done();
				});
			});

			it('should pass a buffer file with the result of f', function (done) {
				var expected = "xyz";
				var fakeFile = new File({ contents: new Buffer("abc", 'utf-8') });
				var f = function () { return expected; };

				var t = tf(f);
				var gt = t();

				gt.write(fakeFile);
				gt.once('data', function (file) {
					assert(file.isBuffer(), 'did not pass a buffer file object');
					var result = file.contents.toString('utf-8');
					assert.equal(result, expected, 'did not pass the result into the buffer');
					done();
				});
			});

			it('should convert a null result from f into an empty file', function (done) {
				var data = null;
				var expected = '';
				var fakeFile = new File({ contents: new Buffer("abc", 'utf-8') });
				var f = function () { return data; };

				var t = tf(f);
				var gt = t();

				gt.write(fakeFile);
				gt.once('data', function (file) {
					assert(file.isBuffer(), 'did not pass a buffer file object');
					var result = file.contents.toString('utf-8');
					assert.equal(result, expected, 'did not convert the null result properly');
					done();
				});
			});

			it('should convert an object result from f into a JSON string', function (done) {
				var data = { a: 1, b: 2 };
				var expected = JSON.stringify(data, null, '  ');
				var fakeFile = new File({ contents: new Buffer("abc", 'utf-8') });
				var f = function () { return data; };

				var t = tf(f);
				var gt = t();

				gt.write(fakeFile);
				gt.once('data', function (file) {
					assert(file.isBuffer(), 'did not pass a buffer file object');
					var result = file.contents.toString('utf-8');
					assert.equal(result, expected, 'did not convert the Object result properly');
					done();
				});
			});

			it('should convert an Array result from f into a JSON string', function (done) {
				var data = [1, 2, "a", "b"];
				var expected = JSON.stringify(data, null, '  ');
				var fakeFile = new File({ contents: new Buffer("abc", 'utf-8') });
				var f = function () { return data; };

				var t = tf(f);
				var gt = t();

				gt.write(fakeFile);
				gt.once('data', function (file) {
					assert(file.isBuffer(), 'did not pass a buffer file object');
					var result = file.contents.toString('utf-8');
					assert.equal(result, expected, 'did not convert the Array result properly');
					done();
				});
			});

		});

	});

});
