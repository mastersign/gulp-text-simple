/* globals require, Buffer */

var path = require('path');
var fs = require('fs');
var _ = require('lodash');
var through = require('through2');
var stream = require('stream');
var util = require('util');
var Transform = stream.Transform || require('readable-stream').Transform;

var safeTransformResult = function (result) {
    if (result === undefined || result === null) {
        result = '';
    } else if (typeof(result) !== 'string') {
        result = JSON.stringify(result, null, '  ');
    }
    return result;
};

var processBuffer = function (buffer, f, opts, srcEncoding, trgEncoding) {
    var src = buffer.toString(srcEncoding);
    var result = f(src, opts);
    return new Buffer(safeTransformResult(result), trgEncoding);
};

var TransformStream = function (f, opts, streamOptions) {
    this.textTransformFunction = f;
    this.textTransformOptions = opts;
    this.content = [];
    Transform.call(this, streamOptions);
};
util.inherits(TransformStream, Transform);

TransformStream.prototype._transform = function (chunk, enc, cb) {
    var text = chunk.toString();
    this.content.push(text);
    cb();
};
TransformStream.prototype._flush = function (cb) {
    var text = this.content.join('');
    var result = undefined;
    try {
        result = this.textTransformFunction(text, this.textTransformOptions);
    } catch(e) {
        this.emit('error', e);
        cb();
        return;
    }
    this.push(safeTransformResult(result));
    cb();
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
 * If the text transformation function returns a falsy value,
 * the Gulp transformation yields an empty file.
 * If the text transformation function f does not return a string,
 * the Gulp transformation serializes the result with JSON.stringify().
 * 
 * @param {function} f - A transformation function from string to string
 * @param {string} srcEncoding - (optional) The source encoding
 * @param {string} trgEncoding - (optional) The target encoding
 */
var textTransformation = function(f, srcEncoding, trgEncoding) {
    
    /*
     * factory() -> Gulp transformation with f(fileContent)
     * factory("text") -> result of f("text")
     * factory(options) -> Gulp transformation with f(fileContent, options)
     * factory("text", options) -> result of f("text", options)
     * factory.readFileSync(path) -> result of f(fileContent)
     * factory.readFileSync(path, options) -> result of f (fileContent, options)
     */
    var factory = function () {
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

        opts = opts || { };

        var buildOptions = function (file) {
            if (typeof(opts) === 'object') {
                return file.path ? _.assign({ sourcePath: file.path }, opts) : opts;
            } else {
                return opts;
            }
        };

        return through.obj(function(file, enc, cb) {
            var srcEnc = enc || srcEncoding || 'utf-8';
            var trgEnc = trgEncoding || srcEnc;
            if (file.isNull()) {
                this.push(file);
                cb();
                return;
            }
            if (file.isBuffer()) {
                file.contents = processBuffer(file.contents,
                    f, buildOptions(file), srcEnc, trgEnc);
                this.push(file);
                cb();
                return;
            }
            if (file.isStream()) {
                var transformStream = new TransformStream(
                    f, buildOptions(file));
                transformStream.on('error', this.emit.bind(this, 'error'));
                file.contents = file.contents.pipe(transformStream);
                this.push(file);
                cb();
                return;
            }
        });
    };
    
    factory.readFileSync = function (filePath, options) {
        filePath = path.resolve(filePath);
        options = options || { };
        options = _.assign({ sourcePath: filePath }, options);
        var encoding = options.encoding || 'utf-8';
        var text = fs.readFileSync(filePath, encoding);
        return f(text, options);
    };
    
    return factory;
};

module.exports = textTransformation;
