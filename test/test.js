/* globals require, Buffer, describe, it */

var assert = require('assert');
var fs = require('fs');
var path = require('path');
var File = require('vinyl');
var es = require('event-stream');
var tf = require('../src/index.js');

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
				var result = undefined;
				var f = function (text) { result = text; };
				var t = tf(f);
				t.readFileSync(sourcePath);
				assert.equal(result, expected, 'did not pass the file content to f');
			});

			it('should pass the source path to the transformation function', function () {
				var sourcePath = 'test/data/sample.txt';
				var expected = path.resolve(sourcePath);
				var result = undefined;
				var f = function (text, options) { result = options; };
				var t = tf(f);
				t.readFileSync(sourcePath);
				assert.deepEqual(result.sourcePath, expected, 'did not pass the source path to f');
			});

			it('should pass options to the transformation function', function () {
				var sourcePath = 'test/data/sample.txt';
				var input = { a: 1 };
				var result = undefined;
				var f = function (text, options) { result = options; };
				var t = tf(f);
				t.readFileSync(sourcePath, input);
				assert.deepEqual(result.a, input.a, 'did not pass the options to f');
			});

			it('should return the result of the transformation function', function () {
				var sourcePath = 'test/data/sample.txt';
				var expected = "abc";
				var f = function () { return expected; };
				var t = tf(f);
				var result = t.readFileSync(sourcePath);
				assert(result === expected, 'did not pass the result of f');
			});
			
			it('should respect the sourceEncoding default option', function () {
				var sourcePath = 'test/data/german-utf-16-le.txt';
				var expected = fs.readFileSync(sourcePath, 'utf16le');
				var result = undefined;
				var f = function (text) { result = text; }
				var t = tf(f, { sourceEncoding: 'utf16le' });
				t.readFileSync(sourcePath);
				assert.equal(result, expected, 'did not respect encoding');
			});

			it('should respect the sourceEncoding option', function () {
				var sourcePath = 'test/data/german-utf-16-le.txt';
				var expected = fs.readFileSync(sourcePath, 'utf16le');
				var result = undefined;
				var f = function (text) { result = text; }
				var t = tf(f);
				t.readFileSync(sourcePath, { sourceEncoding: 'utf16le' });
				assert.equal(result, expected, 'did not respect encoding');
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
				var input = { a: 1 };
				var result = undefined;
				var fakeFile = new File({ contents: new Buffer("abc", 'utf-8') });
				var f = function (text, options) { result = options; return "xyz"; };

				var t = tf(f);
				var gt = t(input);

				gt.write(fakeFile);
				gt.once('data', function (file) {
					assert.equal(result.a, input.a, 'did not pass the options to f');
					done();
				});
			});

			it('should pass the sourcePath to the transformation function', function (done) {
				var filePath = 'abc/file.txt';
				var result = undefined;
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
				var result = undefined;
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
				var result = undefined;
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

			it('should pass a stream file object', function (done) {
				var fakeFile = new File({ contents: es.readArray(['a', 'b', 'c']) });
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
				var fakeFile = new File({ contents: es.readArray(['a', 'b', 'c']) });
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
				var result = undefined;
				var fakeFile = new File({ contents: es.readArray(['input', ' ', "\n", "text\n"]) });
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
				var filePath = 'abc/file.txt';
				var result = undefined;
				var fakeFile = new File({ 
					contents: es.readArray(['a', 'b', 'c']),
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

			it('should pass the options to the transformation function', function (done) {
				var input = { a: 1 };
				var result = undefined;
				var fakeFile = new File({ contents: es.readArray(['a', 'b', 'c']) });
				var f = function (text, options) { result = options; return "xyz"; };

				var t = tf(f);
				var gt = t(input);

				gt.write(fakeFile);
				gt.once('data', function (file) {
					assert(file.isStream(), 'did not pass a stream object');
					file.contents.pipe(es.wait(function (err, data) {
						assert.equal(result.a, input.a, 'did not pass the options to f');
						done();
					}));
				});
			});

			it('should pass a stream file with the result of f', function (done) {
				var expected = "xyz";
				var fakeFile = new File({ contents: es.readArray(['a', 'b', 'c']) });
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
				var fakeFile = new File({ contents: es.readArray(['a', 'b', 'c']) });
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
				var fakeFile = new File({ contents: es.readArray(['a', 'b', 'c']) });
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
				var fakeFile = new File({ contents: es.readArray(['a', 'b', 'c']) });
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
				var result = undefined;
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
				var result = undefined;
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
