/* globals require, Buffer */

var through = require('through2');

var processBuffer = function(buffer, f, opts, srcEncoding, trgEncoding) {
    var src = buffer.toString(srcEncoding);
    var result = f(src, opts);
    if (result === undefined || result === null) {
        result = '';
    } else if (typeof(result) !== 'string') {
        result = JSON.stringify(result, null, '  ');
    }
    return new Buffer(result, trgEncoding);
};

/**
 * Creates a factory function for a Gulp transformation,
 * by passing a text transformation function f.
 * The text transformation function f takes a string as first argument
 * and optionally a second argument for options.
 * 
 * If the returned factory function is called with no arguments or
 * optionally with one non-string argument, it returns a Gulp transformation,
 * which forwards the optional second argument to the text transformation
 * function f.
 *
 * If the returned factory function is called with a string and
 * optionally a second non-string argument it behaves like the
 * text transformation function f.
 * 
 * If the text transformation function f returns an array or an object,
 * the Gulp transformation serializes the result with JSON.stringify().
 * 
 * @param {function} f - A transformation function from string to string
 * @param {string} srcEncoding - (optional) The source encoding
 * @param {string} trgEncoding - (optional) The target encoding
 */
var gulpTransformation = function(f, srcEncoding, trgEncoding) {
    
    /*
     * function() -> Gulp transformation with f(fileContent)
     * function("text") -> result of f("text")
     * function(options) -> Gulp transformation with f(fileContent, options)
     * function("text", options) -> result of f("text", options) 
     */
    return function () {
        var opts = undefined;

        if (arguments.length === 0) {
            // transformation() -> Gulp transformation with f(fileContent)
        } else if (arguments.length === 1) {
            if (typeof(arguments[0]) === 'string') {
                // transformation("string") -> f("string")
                return f(arguments[0]);
            } else {
                // transformation(options) -> Gulp transformation with f(fileContent, options) 
                opts = arguments[0];
            }
        } else if (arguments.length > 1) {
            // transformation("string", options) -> f("string", options)
            return f(arguments[0], arguments[1]);
        }

        return through.obj(function(file, enc, cb) {
            var srcEnc = enc || srcEncoding || 'utf-8';
            var trgEnc = trgEncoding || srcEnc;
            if (file.isNull()) {
                this.push(file);
                cb();
                return;
            }
            if (file.isBuffer()) {
                file.contents = processBuffer(file.contents, f, opts, srcEnc, trgEnc);
                this.push(file);
                cb();
                return;
            }
            if (file.isStream()) {
                throw 'Streams are not supported.';
            }
        });
    };
};

module.exports = gulpTransformation;
