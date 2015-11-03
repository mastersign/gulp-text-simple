/* globals Buffer */

var through = require('through2');

var processBuffer = function(buffer, f, srcEncoding, trgEncoding) {
    var src = buffer.toString(srcEncoding);
    var result = f(src);
    return new Buffer(result, trgEncoding);
};

/**
 * Creates a Gulp transformation function, by passing a function,
 * which transforms one string into another.
 * @param {function} f - A transformation function from string to string
 * @param {string} srcEncoding - (optional) The source encoding
 * @param {string} trgEncoding - (optional) The target encoding
 */
var gulpTransformation = function(f, srcEncoding, trgEncoding) {
    return through.obj(function(file, enc, cb) {
        var srcEnc = enc || srcEncoding || 'utf-8';
        var trgEnc = trgEncoding || srcEnc;
        if (file.isNull()) {
            this.push(file);
            cb();
            return;
        }
        if (file.isBuffer()) {
            file.contents = processBuffer(file.contents, f, srcEnc, trgEnc);
            this.push(file);
            cb();
            return;
        }
        if (file.isStream()) {
            throw 'Streams are not supported.';
        }
    });
};

module.exports = gulpTransformation;
