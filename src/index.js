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

var processBuffer = function (buffer, f, opts) {
    var srcEnc = opts.sourceEncoding || 'utf8';
    var trgEnc = opts.targetEncoding || 'utf8';
    var src = buffer.toString(srcEnc);
    var result = f(src, opts);
    return Buffer.from(safeTransformResult(result), trgEnc);
};

var TransformStream = function (f, opts, streamOptions) {
    this.textTransformFunction = f;
    this.textTransformOptions = opts;
    this.content = [];
    Transform.call(this, streamOptions);
};
util.inherits(TransformStream, Transform);

TransformStream.prototype._transform = function (chunk, enc, cb) {
    this.content.push(chunk);
    cb();
};
TransformStream.prototype._flush = function (cb) {
    var srcEnc = this.textTransformOptions.sourceEncoding || 'utf8';
    var trgEnc = this.textTransformOptions.targetEncoding || 'utf8';
    var text = Buffer.concat(this.content).toString(srcEnc);
    var result = undefined;
    try {
        result = this.textTransformFunction(text, this.textTransformOptions);
    } catch(e) {
        this.emit('error', e);
        cb();
        return;
    }
    this.push(Buffer.from(safeTransformResult(result), trgEnc));
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
 * @param {map} defaultOptions - (optional) A predefined options map for factory. 
 */
var textTransformation = function(f, defaultOptions) {

    var defOpts = _.assign({ sourceEncoding: null }, defaultOptions || { });

    /*
     * factory() -> Gulp transformation with f(fileContent, options)
     * factory("text") -> result of f("text", options)
     * factory(options) -> Gulp transformation with f(fileContent, options)
     * factory("text", options) -> result of f("text", options)
     * factory.readFile(path, cb) -> result of f(fileContent, options)
     * factory.readFile(path, options, cb) -> result of f(fileContent, options)
     * factory.readFileSync(path) -> result of f(fileContent, options)
     * factory.readFileSync(path, options) -> result of f(fileContent, options)
     * factory.transformFile(sourcePath, targetPath, cb) -> result of f(fileContent, options)
     * factory.transformFile(sourcePath, targetPath, options, cb) -> result of f(fileContent, options)
     * factory.transformFileSync(sourcePath, targetPath) -> result of f(fileContent, options)
     * factory.transformFileSync(sourcePath, targetPath, options) -> result of f(fileContent, options)
     */
    
    var factory = function () {
        var callOpts = undefined;
        var mergedOpts = undefined;

        if (arguments.length === 0) {
            // transformation() -> Gulp transformation with f(fileContent)
        } else if (arguments.length === 1) {
            if (typeof(arguments[0]) === 'string') {
                // transformation("string") -> f("string")
                mergedOpts = _.clone(defOpts);
                return f(arguments[0], mergedOpts);
            } else {
                // transformation(options) -> Gulp transformation with f(fileContent, options) 
                callOpts = arguments[0];
            }
        } else if (arguments.length > 1) {
            // transformation("string", options) -> f("string", options)
            callOpts = arguments[1];
            mergedOpts = _.assign(_.clone(defOpts), callOpts);
            return f(arguments[0], mergedOpts);
        }

        mergedOpts = _.assign(_.clone(defOpts), callOpts || { });

        var buildOptions = function (file) {
            if (typeof(mergedOpts) === 'object') {
                return file.path ? _.assign({ sourcePath: file.path }, mergedOpts) : mergedOpts;
            } else {
                return mergedOpts;
            }
        };

        return through.obj(function(file, enc, cb) {
            var localOpts = buildOptions(file);
            var srcEnc = localOpts.sourceEncoding || enc;
            var trgEnc = localOpts.targetEncoding || srcEnc;
            if (file.isNull()) {
                this.push(file);
                cb();
                return;
            }
            if (file.isBuffer()) {
                file.contents = processBuffer(file.contents,
                    f, localOpts, srcEnc, trgEnc);
                this.push(file);
                cb();
                return;
            }
            if (file.isStream()) {
                var transformStream = new TransformStream(
                    f, localOpts, null);
                transformStream.on('error', this.emit.bind(this, 'error'));
                file.contents = file.contents.pipe(transformStream);
                this.push(file);
                cb();
                return;
            }
        });
    };
    
    var buildOpts = function (options, filePath) {
        var localOpts = { sourcePath: path.resolve(filePath) }; 
        return _.assign(localOpts, defOpts, options || { });
    };

    factory.readFileSync = function (filePath, options) {
        options = buildOpts(options, filePath);
        var encoding = options.sourceEncoding || 'utf8';
        var text = fs.readFileSync(options.sourcePath, encoding);
        return f(text, options);
    };

    factory.readFile = function (filePath) {
        var options = arguments.length > 2 ? arguments[1] : null;
        var cb = arguments.length > 2 ? arguments[2] : arguments[1];
        options = buildOpts(options, filePath);
        var encoding = options.sourceEncoding || 'utf8';
        fs.readFile(options.sourcePath, encoding, function (err, text) {
            if (err) {
                cb(err, null);
                return;
            }
            var result = undefined;
            var error = null;
            try {
                result = f(text, options);
            } catch (e) {
                error = e;
            }
            cb(error, result);
        });
    };
    
    factory.transformFileSync = function (sourceFilePath, targetFilePath, options) {
        options = buildOpts(options, sourceFilePath);
        var srcEnc = options.sourceEncoding || 'utf8';
        var trgEnc = options.targetEncoding || srcEnc;
        var text = fs.readFileSync(options.sourcePath, srcEnc);
        var result = f(text, options);
        fs.writeFileSync(targetFilePath, result, trgEnc);
    };
    
    factory.transformFile = function (sourceFilePath, targetFilePath) {
        var options = arguments.length > 3 ? arguments[2] : null;
        var cb = arguments.length > 3 ? arguments[3] : arguments[2];
        options = buildOpts(options, sourceFilePath);
        var srcEnc = options.sourceEncoding || 'utf8';
        var trgEnc = options.targetEncoding || srcEnc;
        fs.readFile(options.sourcePath, srcEnc, function (err, text) {
            if (err) {
                cb(err, null);
                return;
            }
            var result = undefined;
            try {
                result = f(text, options);
            } catch (e) {
                cb(e, undefined);
                return;
            }
            fs.writeFile(targetFilePath, result, trgEnc, cb);
        });
    };

    return factory;
};

module.exports = textTransformation;
