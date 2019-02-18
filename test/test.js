/* globals require, Buffer, describe, it, before, beforeEach */

var _ = require('lodash');
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var del = require('del');
var File = require('vinyl');
var Readable = require('stream').Readable;
var es = require('event-stream');
var async = require('async');
var tf = require('../src/index.js');

function pickProps(object, propertyNames) {
	return _.pickBy(object, function (value, key) {
		return _.includes(propertyNames, key);
	});
}

function pickByTemplate(object, template) {
	return pickProps(object, _.keys(template));
}

describe('gulp-simple-text', function () {

	describe('as transparent function', function () {

		it('should call the transformation function once', function () {
			var called = 0;
			var f = function () { called++; };
			var t = tf(f);
			assert.equal(called, 0, 'called f during construction');
			t("text");
			assert.equal(called, 1, 'did not call transformation function once but ' + called + ' times');
		});

		it('should pass the input text to the transformation function', function () {
			var expected = "text";
			var result = null;
			var f = function (text) { result = text; };
			var t = tf(f);
			t(expected);
			assert.strictEqual(expected, result, 'did not pass the input to f');
		});

		it('should pass default options to the transformation function', function () {
			var expected = { a: 1 };
			var result = null;
			var f = function (text, options) { result = options; };
			var t = tf(f, expected);
			t("something");
			assert.deepStrictEqual(
				pickByTemplate(result, expected), expected,
				'did not pass the default options to f');
		});

		it('should pass options to the transformation function', function () {
			var expected = { a: 1 };
			var result = null;
			var f = function (text, options) { result = options; };
			var t = tf(f);
			t("something", expected);
			assert.deepStrictEqual(
				pickByTemplate(result, expected), expected,
				'did not pass the options to f');
		});

		it('should merge options with default options', function () {
			var expected = { a: 1, b: 2 };
			var result = null;
			var f = function (text, options) { result = options; };
			var t = tf(f, { a: 1 });
			t("something", { b: 2 });
			assert.deepStrictEqual(
				pickByTemplate(result, expected), expected,
				'did not merge the options');
		});

		it('should pass individual options, when called multiple times', function () {
			var expected1 = { a: 1, b: 0 };
			var expected2 = { a: 2, b: 0 };
			var expected3 = { a: 3, b: 0 }
			var result = null;
			var f = function (text, options) { result = options; };
			var t = tf(f, { a: 3, b: 0 });
			t("something", { a: 1 });
			assert.deepStrictEqual(
				pickByTemplate(result, expected1), expected1,
				'did not merge the options for 1st call');
			t("something", { a: 2 });
			assert.deepStrictEqual(
				pickByTemplate(result, expected2), expected2,
				'did not merge the options correctly for 2nd call');
			t("something");
			assert.deepStrictEqual(
				pickByTemplate(result, expected3), expected3,
				'did not merge the options correctly for 3rd call');
		});

		it('should return result of the transformation function', function () {
			var expected = new Object();
			var f = function () { return expected; };
			var t = tf(f);
			var result = t("something");
			assert.strictEqual(expected, result, 'did not return the result of f');
		});

	});

	describe('as .readFileSync() function', function () {

		describe('with existing file', function () {

			it('should call the transformation function once', function () {
				var sourcePath = 'test/data/sample.txt';
				var called = 0;
				var f = function () { called++; };
				var t = tf(f);
				t.readFileSync(sourcePath);
				assert.equal(called, 1, 'called the transformation function ' + called + ' times');
			});

			it('should read the file and pass it to the transformation function', function () {
				var sourcePath = 'test/data/sample.txt';
				var expected = fs.readFileSync(sourcePath, 'utf-8');
				var result = null;
				var f = function (text) { result = text; };
				var t = tf(f);
				t.readFileSync(sourcePath);
				assert.equal(result, expected, 'did not pass the file content to f');
			});

			it('should pass the source path to the transformation function', function () {
				var sourcePath = 'test/data/sample.txt';
				var expected = path.resolve(sourcePath);
				var result = null;
				var f = function (text, options) { result = options; };
				var t = tf(f);
				t.readFileSync(sourcePath);
				assert.deepEqual(result.sourcePath, expected, 'did not pass the source path to f');
			});

			it('should pass default options to the transformation function', function () {
				var sourcePath = 'test/data/sample.txt';
				var expected = { a: 1 };
				var result = null;
				var f = function (text, options) { result = options; };
				var t = tf(f, expected);
				t.readFileSync(sourcePath);
				assert.deepStrictEqual(
					pickByTemplate(result, expected), expected,
					'did not pass default options to f');
			});

			it('should pass options to the transformation function', function () {
				var sourcePath = 'test/data/sample.txt';
				var expected = { a: 1 };
				var result = null;
				var f = function (text, options) { result = options; };
				var t = tf(f);
				t.readFileSync(sourcePath, expected);
				assert.deepStrictEqual(
					pickByTemplate(result, expected), expected,
					'did not pass the options to f');
			});

			it('should pass individual options, when called multiple times', function () {
				var sourcePath = 'test/data/sample.txt';
				var expected1 = { a: 1, b: 0 };
				var expected2 = { a: 2, b: 0 };
				var expected3 = { a: 3, b: 0 }
				var result = null;
				var f = function (text, options) { result = options; };
				var t = tf(f, { a: 3, b: 0 });
				t.readFileSync(sourcePath, { a: 1 });
				assert.deepStrictEqual(
					pickByTemplate(result, expected1), expected1,
					'did not merge the options for 1st call');
				t.readFileSync(sourcePath, { a: 2 });
				assert.deepStrictEqual(
					pickByTemplate(result, expected2), expected2,
					'did not merge the options correctly for 2nd call');
				t.readFileSync(sourcePath);
				assert.deepStrictEqual(
					pickByTemplate(result, expected3), expected3,
					'did not merge the options correctly for 3rd call');
			});

			it('should return the result of the transformation function', function () {
				var sourcePath = 'test/data/sample.txt';
				var expected = "abc";
				var f = function () { return expected; };
				var t = tf(f);
				var result = t.readFileSync(sourcePath);
				assert.strictEqual(result, expected, 'did not pass the result of f');
			});

			it('should respect the sourceEncoding default option', function () {
				var sourcePath = 'test/data/german-utf-16-le.txt';
				var expected = fs.readFileSync(sourcePath, 'utf16le');
				var result = null;
				var f = function (text) { result = text; }
				var t = tf(f, { sourceEncoding: 'utf16le' });
				t.readFileSync(sourcePath);
				assert.equal(result, expected, 'did not respect encoding');
			});

			it('should respect the sourceEncoding option', function () {
				var sourcePath = 'test/data/german-utf-16-le.txt';
				var expected = fs.readFileSync(sourcePath, 'utf16le');
				var result = null;
				var f = function (text) { result = text; }
				var t = tf(f);
				t.readFileSync(sourcePath, { sourceEncoding: 'utf16le' });
				assert.equal(result, expected, 'did not respect encoding');
			});

			it('should pass the error of the transformation function', function () {
				var sourcePath = 'test/data/sample.txt';
				var expected = new Error('error message');
				var f = function () { throw expected; };
				var t = tf(f);
				assert.throws(function () {
					t.readFileSync(sourcePath);
				}, function (err) {
					return err === expected;
				});
			});

		});

		describe('with non existing file', function () {

			it('should not call the transformation function', function () {
				var sourcePath = 'test/data/not existing.txt';
				var called = 0;
				var f = function () { called++; };
				var t = tf(f);
				try {
					t.readFileSync(sourcePath);
				} catch (e) { }
				assert.equal(called, 0, 'called the transformation function ' + called + ' times');
			});

			it('should raise an error', function () {
				var sourcePath = 'test/data/not existing.txt';
				var f = function () { };
				var t = tf(f);
				assert.throws(function () {
					t.readFileSync(sourcePath);
				}, function(err) {
					return (err instanceof Error) && (err.code === 'ENOENT');
				});
			});

		});

	});

	describe('as .readFile() function', function () {

		describe('with existing file', function () {

			it('should call the transformation function once', function (done) {
				var sourcePath = 'test/data/sample.txt';
				var called = 0;
				var f = function () { called++; };
				var t = tf(f);
				t.readFile(sourcePath, function (err, data) {
					assert.equal(called, 1, 'called the transformation function ' + called + ' times');
					done();
				});
			});

			it('should read the file and pass it to the transformation function', function (done) {
				var sourcePath = 'test/data/sample.txt';
				var expected = fs.readFileSync(sourcePath, 'utf-8');
				var result = null;
				var f = function (text) { result = text; };
				var t = tf(f);
				t.readFile(sourcePath, function (err, data) {
					assert.equal(result, expected, 'did not pass the file content to f');
					done();
				});
			});

			it('should pass the source path to the transformation function', function (done) {
				var sourcePath = 'test/data/sample.txt';
				var expected = path.resolve(sourcePath);
				var result = null;
				var f = function (text, options) { result = options; };
				var t = tf(f);
				t.readFile(sourcePath, function (err, data) {
					assert.deepEqual(result.sourcePath, expected, 'did not pass the source path to f');
					done();
				});
			});

			it('should pass default options to the transformation function', function (done) {
				var sourcePath = 'test/data/sample.txt';
				var expected = { a: 1 };
				var result = null;
				var f = function (text, options) { result = options; };
				var t = tf(f, expected);
				t.readFile(sourcePath, function (err, data) {
					assert.deepStrictEqual(
						pickByTemplate(result, expected), expected,
						'did not pass default options to f');
					done();
				});
			});

			it('should pass options to the transformation function', function (done) {
				var sourcePath = 'test/data/sample.txt';
				var expected = { a: 1 };
				var result = null;
				var f = function (text, options) { result = options; };
				var t = tf(f);
				t.readFile(sourcePath, expected, function (err, data) {
					assert.deepStrictEqual(
						pickByTemplate(result, expected), expected,
						'did not pass the options to f');
					done();
				});
			});

			it('should pass individual options, when called multiple times', function (done) {
				var sourcePath = 'test/data/sample.txt';
				var expected1 = { a: 1, b: 0 };
				var expected2 = { a: 2, b: 0 };
				var expected3 = { a: 3, b: 0 }
				var result = null;
				var f = function (text, options) { result = options; };
				var t = tf(f, { a: 3, b: 0 });

				async.series([
						function (cb) {
							t.readFile(sourcePath, { a: 1 }, function (err, data) {
								assert.deepStrictEqual(
									pickByTemplate(result, expected1), expected1,
									'did not pass the options for 1st call');
								cb();
							});
						},
						function (cb) {
							t.readFile(sourcePath, { a: 2 }, function (err, data) {
								assert.deepStrictEqual(
									pickByTemplate(result, expected2), expected2,
									'did not pass the options correctly for 2nd call');
								cb();
							});
						},
						function (cb) {
							t.readFile(sourcePath, function (err, data) {
								assert.deepStrictEqual(
									pickByTemplate(result, expected3), expected3,
									'did not pass the options correctly 3rd call');
								cb();
							});
						}
					],
					done);
			});

			it('should return the result of the transformation function', function (done) {
				var sourcePath = 'test/data/sample.txt';
				var expected = "abc";
				var f = function () { return expected; };
				var t = tf(f);
				t.readFile(sourcePath, function (err, data) {
					assert.strictEqual(data, expected, 'did not pass the result of f');
					done();
				});
			});

			it('should respect the sourceEncoding default option', function (done) {
				var sourcePath = 'test/data/german-utf-16-le.txt';
				var expected = fs.readFileSync(sourcePath, 'utf16le');
				var result = null;
				var f = function (text) { result = text; }
				var t = tf(f, { sourceEncoding: 'utf16le' });
				t.readFile(sourcePath, function (err, data) {
					assert.equal(result, expected, 'did not respect encoding');
					done();
				});
			});

			it('should respect the sourceEncoding option', function (done) {
				var sourcePath = 'test/data/german-utf-16-le.txt';
				var expected = fs.readFileSync(sourcePath, 'utf16le');
				var result = null;
				var f = function (text) { result = text; }
				var t = tf(f);
				t.readFile(sourcePath, { sourceEncoding: 'utf16le' }, function (err, data) {
					assert.equal(result, expected, 'did not respect encoding');
					done();
				});
			});

			it('should pass the error of the transformation function', function (done) {
				var sourcePath = 'test/data/sample.txt';
				var expected = new Error('error message');
				var f = function () { throw expected; };
				var t = tf(f);
				t.readFile(sourcePath, function (err, data) {
					assert.strictEqual(err, expected, 'did not pass the error from f');
					done();
				});
			});

		});

		describe('with non existing file', function () {

			it('should not call the transformation function', function (done) {
				var sourcePath = 'test/data/not existing.txt';
				var called = 0;
				var f = function () { called++; };
				var t = tf(f);
				t.readFile(sourcePath, function (err, data) {
					assert.equal(called, 0, 'called the transformation function ' + called + ' times');
					done();
				});
			});

			it('should pass the ENOENT error', function (done) {
				var sourcePath = 'test/data/not existing.txt';
				var f = function () { };
				var t = tf(f);
				t.readFile(sourcePath, function (err, data) {
					assert((err instanceof Error) && (err.code === 'ENOENT'),
						'did not passed the expected error');
					done();
				});
			});

		});

	});

	describe('as .transformFileSync() function', function () {

		before(function () {
			try {
				var stats = fs.statSync('tmp');
				if (stats.isFile()) {
					throw new Error('the name tmp is needed for a temporary directory, remove the file with this name');
				}
			} catch (e) { }
		});

		beforeEach(function () {
			try {
				var stats = fs.statSync('tmp');
				if (stats.isDirectory()) {
					del.sync(['tmp']);
				}
			} catch (e) { }
			fs.mkdirSync('tmp');
		});

		describe('with existing file', function () {

			it('should call the transformation function once', function () {
				var sourcePath = 'test/data/sample.txt';
				var targetPath = 'tmp/sample.txt';
				var called = 0;
				var f = function () { called++; };
				var t = tf(f);
				t.transformFileSync(sourcePath, targetPath);
				assert.equal(called, 1, 'called the transformation function ' + called + ' times');
			});

			it('should read the file and pass it to the transformation function', function () {
				var sourcePath = 'test/data/sample.txt';
				var targetPath = 'tmp/sample.txt';
				var expected = fs.readFileSync(sourcePath, 'utf-8');
				var result = null;
				var f = function (text) { result = text; };
				var t = tf(f);
				t.transformFileSync(sourcePath, targetPath);
				assert.equal(result, expected, 'did not pass the file content to f');
			});

			it('should pass the source path to the transformation function', function () {
				var sourcePath = 'test/data/sample.txt';
				var targetPath = 'tmp/sample.txt';
				var expected = path.resolve(sourcePath);
				var result = null;
				var f = function (text, options) { result = options; };
				var t = tf(f);
				t.transformFileSync(sourcePath, targetPath);
				assert.deepEqual(result.sourcePath, expected, 'did not pass the source path to f');
			});

			it('should pass default options to the transformation function', function () {
				var sourcePath = 'test/data/sample.txt';
				var targetPath = 'tmp/sample.txt';
				var expected = { a: 1 };
				var result = null;
				var f = function (text, options) { result = options; };
				var t = tf(f, expected);
				t.transformFileSync(sourcePath, targetPath);
				assert.deepStrictEqual(
					pickByTemplate(result, expected), expected,
					'did not pass the options to f');
			});

			it('should pass options to the transformation function', function () {
				var sourcePath = 'test/data/sample.txt';
				var targetPath = 'tmp/sample.txt';
				var expected = { a: 1 };
				var result = null;
				var f = function (text, options) { result = options; };
				var t = tf(f);
				t.transformFileSync(sourcePath, targetPath, expected);
				assert.deepStrictEqual(
					pickByTemplate(result, expected), expected,
					'did not pass the options to f');
			});

			it('should pass individual options, when called multiple times', function () {
				var sourcePath = 'test/data/sample.txt';
				var targetPath = 'tmp/sample.txt';
				var expected1 = { a: 1, b: 0 };
				var expected2 = { a: 2, b: 0 };
				var expected3 = { a: 3, b: 0 }
				var result = null;
				var f = function (text, options) { result = options; };
				var t = tf(f, { a: 3, b: 0 });
				t.transformFileSync(sourcePath, targetPath, { a: 1 });
				assert.deepStrictEqual(
					pickByTemplate(result, expected1), expected1,
					'did not merge the options for 1st call');
				t.transformFileSync(sourcePath, targetPath, { a: 2 });
				assert.deepStrictEqual(
					pickByTemplate(result, expected2), expected2,
					'did not merge the options correctly for 2nd call');
				t.transformFileSync(sourcePath, targetPath);
				assert.deepStrictEqual(
					pickByTemplate(result, expected3), expected3,
					'did not merge the options correctly for 3rd call');
			});

			it('should return the result of the transformation function', function () {
				var sourcePath = 'test/data/sample.txt';
				var targetPath = 'tmp/sample.txt';
				var expected = "abc";
				var f = function () { return expected; };
				var t = tf(f);
				t.transformFileSync(sourcePath, targetPath);
				var result = fs.readFileSync(targetPath, 'utf8');
				assert.equal(result, expected, 'did not pass the result of f');
			});

			it('should respect the sourceEncoding default option', function () {
				var sourcePath = 'test/data/german-utf-16-le.txt';
				var targetPath = 'tmp/sample.txt';
				var expected = fs.readFileSync(sourcePath, 'utf16le');
				var result = null;
				var f = function (text) { result = text; }
				var t = tf(f, { sourceEncoding: 'utf16le' });
				t.transformFileSync(sourcePath, targetPath);
				assert.equal(result, expected, 'did not respect encoding');
			});

			it('should respect the sourceEncoding option', function () {
				var sourcePath = 'test/data/german-utf-16-le.txt';
				var targetPath = 'tmp/sample.txt';
				var expected = fs.readFileSync(sourcePath, 'utf16le');
				var result = null;
				var f = function (text) { result = text; }
				var t = tf(f);
				t.transformFileSync(sourcePath, targetPath, { sourceEncoding: 'utf16le' });
				assert.equal(result, expected, 'did not respect encoding');
			});

			it('should respect the targetEncoding default option', function () {
				var sourcePath = 'test/data/german-utf-8.txt';
				var targetPath = 'tmp/sample.txt';
				var expected = fs.readFileSync(sourcePath, 'utf8');
				var f = function (text) { return expected; }
				var t = tf(f, { targetEncoding: 'utf16le' });
				t.transformFileSync(sourcePath, targetPath);
				var result = fs.readFileSync(targetPath, 'utf16le');
				assert.equal(result, expected, 'did not respect encoding');
			});

			it('should respect the targetEncoding option', function () {
				var sourcePath = 'test/data/german-utf-8.txt';
				var targetPath = 'tmp/sample.txt';
				var expected = fs.readFileSync(sourcePath, 'utf8');
				var f = function (text) { return expected; }
				var t = tf(f);
				t.transformFileSync(sourcePath, targetPath, { targetEncoding: 'utf16le' });
				var result = fs.readFileSync(targetPath, 'utf16le');
				assert.equal(result, expected, 'did not respect encoding');
			});

			it('should pass the error of the transformation function', function () {
				var sourcePath = 'test/data/sample.txt';
				var targetPath = 'tmp/sample.txt';
				var expected = new Error('error message');
				var f = function () { throw expected; };
				var t = tf(f);
				assert.throws(function () {
					t.transformFileSync(sourcePath, targetPath);
				}, function (err) {
					return err === expected;
				});
			});

		});

		describe('with non existing file', function () {

			it('should not call the transformation function', function () {
				var sourcePath = 'test/data/not existing.txt';
				var targetPath = 'tmp/sample.txt';
				var called = 0;
				var f = function () { called++; };
				var t = tf(f);
				try {
					t.transformFileSync(sourcePath, targetPath);
				} catch (e) { }
				assert.equal(called, 0, 'called the transformation function ' + called + ' times');
			});

			it('should not create the target function', function () {
				var sourcePath = 'test/data/not existing.txt';
				var targetPath = 'tmp/sample.txt';
				var f = function () { };
				var t = tf(f);
				try {
					t.transformFileSync(sourcePath, targetPath);
				} catch (e) { }
				assert.throws(function () {
						fs.accessSync(targetPath, fs.R_OK);
				});
			});

			it('should raise an error', function () {
				var sourcePath = 'test/data/not existing.txt';
				var targetPath = 'tmp/sample.txt';
				var f = function () { };
				var t = tf(f);
				assert.throws(function () {
					t.transformFileSync(sourcePath, targetPath);
				}, function(err) {
					return (err instanceof Error) && (err.code === 'ENOENT');
				});
			});

		});

	});

	describe('as .transformFile() function', function () {

		before(function () {
			try {
				var stats = fs.statSync('tmp');
				if (stats.isFile()) {
					throw new Error('the name tmp is needed for a temporary directory, remove the file with this name');
				}
			} catch (e) { }
		});

		beforeEach(function () {
			try {
				var stats = fs.statSync('tmp');
				if (stats.isDirectory()) {
					del.sync(['tmp']);
				}
			} catch (e) { }
			fs.mkdirSync('tmp');
		});

		describe('with existing file', function () {

			it('should call the transformation function once', function (done) {
				var sourcePath = 'test/data/sample.txt';
				var targetPath = 'tmp/sample.txt';
				var called = 0;
				var f = function () { called++; };
				var t = tf(f);
				t.transformFile(sourcePath, targetPath, function (err) {
					assert.equal(called, 1, 'called the transformation function ' + called + ' times');
					done();
				});
			});

			it('should read the file and pass it to the transformation function', function (done) {
				var sourcePath = 'test/data/sample.txt';
				var targetPath = 'tmp/sample.txt';
				var expected = fs.readFileSync(sourcePath, 'utf-8');
				var result = null;
				var f = function (text) { result = text; };
				var t = tf(f);
				t.transformFile(sourcePath, targetPath, function (err) {
					assert.equal(result, expected, 'did not pass the file content to f');
					done();
				});
			});

			it('should pass the source path to the transformation function', function (done) {
				var sourcePath = 'test/data/sample.txt';
				var targetPath = 'tmp/sample.txt';
				var expected = path.resolve(sourcePath);
				var result = null;
				var f = function (text, options) { result = options; };
				var t = tf(f);
				t.transformFile(sourcePath, targetPath, function (err) {
					assert.deepEqual(result.sourcePath, expected, 'did not pass the source path to f');
					done();
				});
			});

			it('should pass default options to the transformation function', function (done) {
				var sourcePath = 'test/data/sample.txt';
				var targetPath = 'tmp/sample.txt';
				var expected = { a: 1 };
				var result = null;
				var f = function (text, options) { result = options; };
				var t = tf(f, expected);
				t.transformFile(sourcePath, targetPath, function (err) {
					assert.deepStrictEqual(
						pickByTemplate(result, expected), expected,
						'did not pass the options to f');
					done();
				});
			});

			it('should pass options to the transformation function', function (done) {
				var sourcePath = 'test/data/sample.txt';
				var targetPath = 'tmp/sample.txt';
				var expected = { a: 1 };
				var result = null;
				var f = function (text, options) { result = options; };
				var t = tf(f);
				t.transformFile(sourcePath, targetPath, expected, function (err) {
					assert.deepStrictEqual(
						pickByTemplate(result, expected), expected,
						'did not pass the options to f');
					done();
				});
			});

			it('should pass individual options, when called multiple times', function (done) {
				var sourcePath = 'test/data/sample.txt';
				var targetPath = 'tmp/sample.txt';
				var expected1 = { a: 1, b: 0 };
				var expected2 = { a: 2, b: 0 };
				var expected3 = { a: 3, b: 0 }
				var result = null;
				var f = function (text, options) { result = options; };
				var t = tf(f, { a: 3, b: 0 });

				async.series([
						function (cb) {
							t.transformFile(sourcePath, targetPath, { a: 1 }, function (err, data) {
								assert.deepStrictEqual(
									pickByTemplate(result, expected1), expected1,
									'did not pass the options for 1st call');
								cb();
							});
						},
						function (cb) {
							t.transformFile(sourcePath, targetPath, { a: 2 }, function (err, data) {
								assert.deepStrictEqual(
									pickByTemplate(result, expected2), expected2,
									'did not pass the options correctly for 2nd call');
								cb();
							});
						},
						function (cb) {
							t.transformFile(sourcePath, targetPath, function (err, data) {
								assert.deepStrictEqual(
									pickByTemplate(result, expected3), expected3,
									'did not pass the options correctly 3rd call');
								cb();
							});
						}
					],
					done);
			});

			it('should write the result of the transformation function', function (done) {
				var sourcePath = 'test/data/sample.txt';
				var targetPath = 'tmp/sample.txt';
				var expected = "abc";
				var f = function () { return expected; };
				var t = tf(f);
				t.transformFile(sourcePath, targetPath, function (err) {
					var result = fs.readFileSync(targetPath, 'utf8');
					assert.equal(result, expected, 'did not pass the result of f');
					done();
				});
			});

			it('should respect the sourceEncoding default option', function (done) {
				var sourcePath = 'test/data/german-utf-16-le.txt';
				var targetPath = 'tmp/sample.txt';
				var expected = fs.readFileSync(sourcePath, 'utf16le');
				var result = null;
				var f = function (text) { result = text; }
				var t = tf(f, { sourceEncoding: 'utf16le' });
				t.transformFile(sourcePath, targetPath, function (err) {
					assert.equal(result, expected, 'did not respect encoding');
					done();
				});
			});

			it('should respect the sourceEncoding option', function (done) {
				var sourcePath = 'test/data/german-utf-16-le.txt';
				var targetPath = 'tmp/sample.txt';
				var expected = fs.readFileSync(sourcePath, 'utf16le');
				var result = null;
				var f = function (text) { result = text; }
				var t = tf(f);
				t.transformFile(sourcePath, targetPath, { sourceEncoding: 'utf16le' }, function (err) {
					assert.equal(result, expected, 'did not respect encoding');
					done();
				});
			});

			it('should respect the targetEncoding default option', function (done) {
				var sourcePath = 'test/data/german-utf-8.txt';
				var targetPath = 'tmp/sample.txt';
				var expected = fs.readFileSync(sourcePath, 'utf8');
				var f = function (text) { return expected; }
				var t = tf(f, { targetEncoding: 'utf16le' });
				t.transformFile(sourcePath, targetPath, function (err) {
					var result = fs.readFileSync(targetPath, 'utf16le');
					assert.equal(result, expected, 'did not respect encoding');
					done();
				});
			});

			it('should respect the targetEncoding option', function (done) {
				var sourcePath = 'test/data/german-utf-8.txt';
				var targetPath = 'tmp/sample.txt';
				var expected = fs.readFileSync(sourcePath, 'utf8');
				var f = function (text) { return expected; }
				var t = tf(f);
				t.transformFile(sourcePath, targetPath, { targetEncoding: 'utf16le' }, function (err) {
					var result = fs.readFileSync(targetPath, 'utf16le');
					assert.equal(result, expected, 'did not respect encoding');
					done();
				});
			});

			it('should pass the error of the transformation function', function (done) {
				var sourcePath = 'test/data/sample.txt';
				var targetPath = 'tmp/sample.txt';
				var expected = new Error('error message');
				var f = function () { throw expected; };
				var t = tf(f);
				t.transformFile(sourcePath, targetPath, function (err) {
					assert.strictEqual(err, expected, 'did not pass the error from f');
					done();
				});
			});

		});

		describe('with non existing file', function () {

			it('should not call the transformation function', function (done) {
				var sourcePath = 'test/data/not existing.txt';
				var targetPath = 'tmp/sample.txt';
				var called = 0;
				var f = function () { called++; };
				var t = tf(f);
				t.transformFile(sourcePath, targetPath, function (err) {
					assert.equal(called, 0, 'called the transformation function ' + called + ' times');
					done();
				});
			});

			it('should not create the target file', function (done) {
				var sourcePath = 'test/data/not existing.txt';
				var targetPath = 'tmp/sample.txt';
				var f = function () { };
				var t = tf(f);
				t.transformFile(sourcePath, targetPath, function (err) {
					assert.throws(function () {
						fs.accessSync(targetPath, fs.R_OK);
					});
					done();
				});
			});

			it('should pass the ENOENT error', function (done) {
				var sourcePath = 'test/data/not existing.txt';
				var targetPath = 'tmp/sample.txt';
				var f = function () { };
				var t = tf(f);
				t.transformFile(sourcePath, targetPath, function (err, data) {
					assert((err instanceof Error) && (err.code === 'ENOENT'),
						'did not passed the expected error');
					done();
				});
			});

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
					assert.strictEqual(file, fakeFile, 'file was not passed unchanged');
					done();
				});
			});

		});

		describe('in buffer mode', function () {

			it('should call the transformation function once', function (done) {
				var fakeFile = new File({ contents: new Buffer("abc", 'utf-8') });
				var called = 0;
				var f = function () { called++; return "xyz"; };

				var t = tf(f);
				var gt = t();

				gt.write(fakeFile);
				gt.once('data', function (file) {
					assert.equal(called, 1, 'did not call transformation function once but ' + called + ' times');
					done();
				});
			});

			it('should pass the input to the transformation function', function (done) {
				var expected = "input text";
				var result = null;
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

			it('should pass default options to the transformation function', function (done) {
				var expected = { a: 1 };
				var result = null;
				var fakeFile = new File({ contents: new Buffer("abc", 'utf-8') });
				var f = function (text, options) { result = options; return "xyz"; };

				var t = tf(f, expected);
				var gt = t();

				gt.write(fakeFile);
				gt.once('data', function (file) {
					assert.deepStrictEqual(
						pickByTemplate(result, expected), expected,
						'did not pass the options to f');
					done();
				});
			});

			it('should pass options to the transformation function', function (done) {
				var expected = { a: 1 };
				var result = null;
				var fakeFile = new File({ contents: new Buffer("abc", 'utf-8') });
				var f = function (text, options) { result = options; return "xyz"; };

				var t = tf(f);
				var gt = t(expected);

				gt.write(fakeFile);
				gt.once('data', function (file) {
					assert.deepStrictEqual(
						pickByTemplate(result, expected), expected,
						'did not pass the options to f');
					done();
				});
			});

			it('should pass individual options, when called multiple times', function (done) {
				var expected1 = { a: 1, b: 0 };
				var expected2 = { a: 2, b: 0 };
				var expected3 = { a: 3, b: 0 }
				var result = null;
				var fakeFile = new File({ contents: new Buffer("abc", 'utf-8') });
				var f = function (text, options) { result = options; return "xyz"; };

				var t = tf(f, { a: 3, b: 0 });

				async.series([
						function (cb) {
							var gt = t({ a: 1 });
							gt.write(fakeFile);
							gt.once('data', function (file) {
								assert.deepStrictEqual(
									pickByTemplate(result, expected1), expected1,
									'did not pass the options for 1st call');
								cb();
							});
						},
						function (cb) {
							var gt = t({ a: 2 });
							gt.write(fakeFile);
							gt.once('data', function (file) {
								assert.deepStrictEqual(
									pickByTemplate(result, expected2), expected2,
									'did not pass the options correctly for 2nd call');
								cb();
							});
						},
						function (cb) {
							var gt = t();
							gt.write(fakeFile);
							gt.once('data', function (file) {
								assert.deepStrictEqual(
									pickByTemplate(result, expected3), expected3,
									'did not pass the options correctly 3rd call');
								cb();
							});
						}
					],
					done);
			});

			it('should pass the sourcePath to the transformation function', function (done) {
				var filePath = path.normalize('abc/file.txt');
				var result = null;
				var fakeFile = new File({
					contents: new Buffer("abc", 'utf-8'),
					path: filePath
				});
				var f = function (text, options) { result = options; return "xyz"; };

				var t = tf(f);
				var gt = t();

				gt.write(fakeFile);
				gt.once('data', function (file) {
					assert.equal(result.sourcePath, filePath, 'did not pass the options to f');
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

			it('should respect the sourceEncoding default option', function (done) {
				var data = fs.readFileSync('test/data/german-utf-16-le.txt');
				var expected = fs.readFileSync('test/data/german-utf-16-le.txt', 'utf16le');
				var fakeFile = new File({ contents: data });
				var result = null;
				var f = function (text) { result = text; };

				var t = tf(f, { sourceEncoding: 'utf16le' });
				var gt = t();

				gt.write(fakeFile);
				gt.once('data', function (file) {
					assert.equal(result, expected, 'did not respect the source encoding');
					done();
				});
			});

			it('should respect the sourceEncoding option', function (done) {
				var data = fs.readFileSync('test/data/german-utf-16-le.txt');
				var expected = fs.readFileSync('test/data/german-utf-16-le.txt', 'utf16le');
				var fakeFile = new File({ contents: data });
				var result = null;
				var f = function (text) { result = text; };

				var t = tf(f);
				var gt = t({ sourceEncoding: 'utf16le' });

				gt.write(fakeFile);
				gt.once('data', function (file) {
					assert.equal(result, expected, 'did not respect the source encoding');
					done();
				});
			});

			it('should respect the targetEncoding default option', function (done) {
				var expected = fs.readFileSync('test/data/german-utf-8.txt', 'utf8');
				var fakeFile = new File({ contents: new Buffer('abc', 'utf8') });
				var f = function (text) { return expected; };

				var t = tf(f, { targetEncoding: 'utf16le' });
				var gt = t();

				gt.write(fakeFile);
				gt.once('data', function (file) {
					var result = file.contents.toString('utf16le');
					assert.equal(result, expected, 'did not respect the source encoding');
					done();
				});
			});

			it('should respect the targetEncoding option', function (done) {
				var expected = fs.readFileSync('test/data/german-utf-8.txt', 'utf8');
				var fakeFile = new File({ contents: new Buffer('abc', 'utf8') });
				var f = function (text) { return expected; };

				var t = tf(f);
				var gt = t({ targetEncoding: 'utf16le' });

				gt.write(fakeFile);
				gt.once('data', function (file) {
					var result = file.contents.toString('utf16le');
					assert.equal(result, expected, 'did not respect the source encoding');
					done();
				});
			});

		});

		describe('in stream mode', function () {

			var createTextStream = function (lines) {
				var s = new Readable();
				lines.forEach(function(line) {
					s.push(line);
				}, this);
				s.push(null);
				return s;
			};

			it('should pass a stream file object', function (done) {
				var fakeFile = new File({ contents: createTextStream(['a', 'b', 'c']) });
				var f = function () { return "xyz"; };

				var t = tf(f);
				var gt = t();

				gt.write(fakeFile);
				gt.once('data', function (file) {
					assert(file.isStream(), 'did not pass a stream object');
					file.contents.pipe(es.wait(function (err, data) {
						done();
					}));
				});
			});

			it('should call the transformation function once', function (done) {
				var fakeFile = new File({ contents: createTextStream(['a', 'b', 'c']) });
				var called = 0;
				var f = function () { called++; return "xyz"; };

				var t = tf(f);
				var gt = t();

				gt.write(fakeFile);
				gt.once('data', function (file) {
					assert(file.isStream(), 'did not pass a stream object');
					file.contents.pipe(es.wait(function (err, data) {
						assert.equal(called, 1,
							'did not call transformation function once but ' + called + ' times');
						done();
					}));
				});
			});

			it('should pass the input to the transformation function', function (done) {
				var expected = "input \ntext\n";
				var result = null;
				var fakeFile = new File({ contents: createTextStream(['input', ' ', "\n", "text\n"]) });
				var f = function (text) { result = text; return "xyz"; };

				var t = tf(f);
				var gt = t();

				gt.write(fakeFile);
				gt.once('data', function (file) {
					assert(file.isStream(), 'did not pass a stream object');
					file.contents.pipe(es.wait(function (err, data) {
						assert.equal(result, expected, 'did not pass the input text to f');
						done();
					}));
				});
			});

			it('should pass the sourcePath to the transformation function', function (done) {
				var filePath = path.normalize('abc/file.txt');
				var result = null;
				var fakeFile = new File({
					contents: createTextStream(['a', 'b', 'c']),
					path: filePath
				});
				var f = function (text, options) { result = options; return "xyz"; };

				var t = tf(f);
				var gt = t();

				gt.write(fakeFile);
				gt.once('data', function (file) {
					assert(file.isStream(), 'did not pass a stream object');
					file.contents.pipe(es.wait(function (err, data) {
						assert.equal(result.sourcePath, filePath, 'did not pass the sourcePath to f');
						done();
					}));
				});
			});

			it('should pass default options to the transformation function', function (done) {
				var expected = { a: 1 };
				var result = null;
				var fakeFile = new File({ contents: createTextStream(['a', 'b', 'c']) });
				var f = function (text, options) { result = options; return "xyz"; };

				var t = tf(f, expected);
				var gt = t();

				gt.write(fakeFile);
				gt.once('data', function (file) {
					assert(file.isStream(), 'did not pass a stream object');
					file.contents.pipe(es.wait(function (err, data) {
						assert.deepStrictEqual(
							pickByTemplate(result, expected), expected,
							'did not pass the options to f');
						done();
					}));
				});
			});

			it('should pass options to the transformation function', function (done) {
				var expected = { a: 1 };
				var result = null;
				var fakeFile = new File({ contents: createTextStream(['a', 'b', 'c']) });
				var f = function (text, options) { result = options; return "xyz"; };

				var t = tf(f);
				var gt = t(expected);

				gt.write(fakeFile);
				gt.once('data', function (file) {
					assert(file.isStream(), 'did not pass a stream object');
					file.contents.pipe(es.wait(function (err, data) {
						assert.deepStrictEqual(
							pickByTemplate(result, expected), expected,
							'did not pass the options to f');
						done();
					}));
				});
			});

			it('should pass individual options, when called multiple times', function (done) {
				var expected1 = { a: 1, b: 0 };
				var expected2 = { a: 2, b: 0 };
				var expected3 = { a: 3, b: 0 }
				var result = null;
				var fakeFile = new File({ contents: createTextStream(['a', 'b', 'c']) });
				var f = function (text, options) { result = options; return "xyz"; };

				var t = tf(f, { a: 3, b: 0 });

				async.series([
						function (cb) {
							var gt = t({ a: 1 });
							gt.write(fakeFile);
							gt.once('data', function (file) {
								assert(file.isStream(), 'did not pass a stream object');
								file.contents.pipe(es.wait(function (err, data) {
								assert.deepStrictEqual(
									pickByTemplate(result, expected1), expected1,
									'did not pass the options for 1st call');
									cb();
								}));
							});
						},
						function (cb) {
							var gt = t({ a: 2 });
							gt.write(fakeFile);
							gt.once('data', function (file) {
								assert(file.isStream(), 'did not pass a stream object');
								file.contents.pipe(es.wait(function (err, data) {
								assert.deepStrictEqual(
									pickByTemplate(result, expected2), expected2,
									'did not pass the options for 2nd call');
									cb();
								}));
							});
						},
						function (cb) {
							var gt = t();
							gt.write(fakeFile);
							gt.once('data', function (file) {
								assert(file.isStream(), 'did not pass a stream object');
								file.contents.pipe(es.wait(function (err, data) {
								assert.deepStrictEqual(
									pickByTemplate(result, expected3), expected3,
									'did not pass the options for 3rd call');
									cb();
								}));
							});
						}
					],
					done);
			});

			it('should pass a stream file with the result of f', function (done) {
				var expected = "xyz";
				var fakeFile = new File({ contents: createTextStream(['a', 'b', 'c']) });
				var f = function (text) { return expected; };

				var t = tf(f);
				var gt = t();

				gt.write(fakeFile);
				gt.once('data', function (file) {
					assert(file.isStream(), 'did not pass a stream object');
					file.contents.pipe(es.wait(function (err, data) {
						var result = data.toString();
						assert.equal(result, expected, 'did not pass the result of f through the stream');
						done();
					}));
				});
			});

			it('should convert a null result from f to an empty stream', function (done) {
				var data = null;
				var expected = '';
				var fakeFile = new File({ contents: createTextStream(['a', 'b', 'c']) });
				var f = function (text) { return data; };

				var t = tf(f);
				var gt = t();

				gt.write(fakeFile);
				gt.once('data', function (file) {
					assert(file.isStream(), 'did not pass a stream object');
					file.contents.pipe(es.wait(function (err, data) {
						var result = data.toString();
						assert.equal(result, expected, 'did not convert the null result properly');
						done();
					}));
				});
			});

			it('should convert an Object result from f to an empty stream', function (done) {
				var data = { a: 1, b: 2 };
				var expected = JSON.stringify(data, null, '  ');
				var fakeFile = new File({ contents: createTextStream(['a', 'b', 'c']) });
				var f = function (text) { return data; };

				var t = tf(f);
				var gt = t();

				gt.write(fakeFile);
				gt.once('data', function (file) {
					assert(file.isStream(), 'did not pass a stream object');
					file.contents.pipe(es.wait(function (err, data) {
						var result = data.toString();
						assert.equal(result, expected, 'did not convert the Object result properly');
						done();
					}));
				});
			});

			it('should convert an Array result from f to an empty stream', function (done) {
				var data = [1, 2, "a", "b"];
				var expected = JSON.stringify(data, null, '  ');
				var fakeFile = new File({ contents: createTextStream(['a', 'b', 'c']) });
				var f = function (text) { return data; };

				var t = tf(f);
				var gt = t();

				gt.write(fakeFile);
				gt.once('data', function (file) {
					assert(file.isStream(), 'did not pass a stream object');
					file.contents.pipe(es.wait(function (err, data) {
						var result = data.toString();
						assert.equal(result, expected, 'did not convert the Array result properly');
						done();
					}));
				});
			});

			it('should respect the sourceEncoding default option', function (done) {
				var expected = fs.readFileSync('test/data/german-utf-16-le.txt', 'utf16le');
				var s = fs.createReadStream('test/data/german-utf-16-le.txt');
				var fakeFile = new File({ contents: s });
				var result = null;
				var f = function (text) { result = text; return text; };

				var t = tf(f, { sourceEncoding: 'utf16le' });
				var gt = t();

				gt.write(fakeFile);
				gt.once('data', function (file) {
					assert(file.isStream(), 'did not pass a stream object');
					file.contents.pipe(es.wait(function (err, data) {
						assert.equal(result, expected, 'did not respect source encoding');
						done();
					}));
				});
			});

			it('should respect the sourceEncoding option', function (done) {
				var expected = fs.readFileSync('test/data/german-utf-16-le.txt', 'utf16le');
				var s = fs.createReadStream('test/data/german-utf-16-le.txt');
				var fakeFile = new File({ contents: s });
				var result = null;
				var f = function (text) { result = text; return text; };

				var t = tf(f);
				var gt = t({ sourceEncoding: 'utf16le' });

				gt.write(fakeFile);
				gt.once('data', function (file) {
					assert(file.isStream(), 'did not pass a stream object');
					file.contents.pipe(es.wait(function (err, data) {
						assert.equal(result, expected, 'did not respect source encoding');
						done();
					}));
				});
			});

			it('should respect the targetEncoding default option', function (done) {
				var expected = fs.readFileSync('test/data/german-utf-8.txt', 'utf8');
				var s = fs.createReadStream('test/data/german-utf-8.txt');
				var fakeFile = new File({ contents: s });

				var f = function (text) { return expected; };
				var t = tf(f, { targetEncoding: 'utf16le' });
				var gt = t();

				gt.write(fakeFile);
				gt.once('data', function (file) {
					assert(file.isStream(), 'did not pass a stream object');
					file.contents.pipe(es.wait(function (err, data) {
						var result = data.toString('utf16le');
						assert.equal(result, expected, 'did not respect target encoding');
						done();
					}));
				});
			});

			it('should respect the targetEncoding option', function (done) {
				var expected = fs.readFileSync('test/data/german-utf-8.txt', 'utf8');
				var s = fs.createReadStream('test/data/german-utf-8.txt');
				var fakeFile = new File({ contents: s });

				var f = function (text) { return expected; };
				var t = tf(f);
				var gt = t({ targetEncoding: 'utf16le' });

				gt.write(fakeFile);
				gt.once('data', function (file) {
					assert(file.isStream(), 'did not pass a stream object');
					file.contents.pipe(es.wait(function (err, data) {
						var result = data.toString('utf16le');
						assert.equal(result, expected, 'did not respect target encoding');
						done();
					}));
				});
			});

		});

	});

});
