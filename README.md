GulpText _simple_
=================

[![npm package][npm-img]][npm-url]
[![build status][travis-img]][travis-url]

> simple creation of [Gulp] transformations for text files

A lot of [Gulp] tasks are dealing with text files.
And often you want to just create a simple task for transforming the text content of a file in your project.
E.g. replace some placeholders with a regular expression.
But if you want to write a custom [Gulp] task for it, you have to deal with buffers, encoding, streams, different vinyl objects, ....

GulpText _simple_ makes it really simple to create first class [Gulp] transformations with a simple API,
and an extra benefit of helper functions for dealing with files directly.

Features
--------

* support for buffer file objects
* support for stream file objects
* supports passing additional options to the transformation function
* passing the source path of the vinyl file as an option into the transformation function
* the transformation factory behaves like the transformation function, if the first argument is a string
* transforming the content of a text file directly
* automatic JSON conversion of non-string results from the transformation function

Application
-----------

All examples are based on the following preamble.

~~~ js
var gulp = require('gulp');
var textTransformation = require('gulp-text-simple');
~~~

With GulpText _simple_ you can just implement a function, taking a string and returning a string.
It will create a [Gulp] transformation factory for you, which you can use with `.pipe()`.

~~~ js
var transformString = function (s) {
    // do whatever you want with the text content of a file
    return s.toLowerCase();
};

// create the Gulp transformation factory with GulpText simple
var myTransformation = textTransformation(transformString);

gulp.task('default', function() {
    return gulp.src('src/*.txt')
        .pipe(myTransformation()) // create the transformation and pass it to the Gulp stream
        .pipe(gulp.dest('out/'));
});
~~~

If you need to pass options, you can give a map to the factory.

~~~ js
var transformString = function (s, options) {
    // do whatever you want with the text content of a file
    if (options.mode === 'lower') {
        return s.toLowerCase();
    } else if (options.mode === 'upper') {
        return s.toUpperCase();
    } else {
        return s;
    }
};

// create the Gulp transformation factory with GulpText simple
var myTransformation = textTransformation(transformString);

gulp.task('default', function() {
    return gulp.src('src/*.txt')
        .pipe(myTransformation({ mode: 'upper' })) // create the transformation and pass it to Gulp
        .pipe(gulp.dest('out/'));
});
~~~

The source path of a file is passed as option `sourcePath` in the second argument.
If the custom options allready have an attribute `sourcePath` it is _not_ overridden.

~~~ js
var os = require('os');

var transformString = function (text, options) {
    // putting the source path as a prefix at the top of the text
    var prefix = options.prefix; // custom options are preserved
    var pathOfFile = options.sourcePath; // the sourcePath is merged into the custom options
    return prefix + pathOfFile + os.EOL + text;
};

// create the Gulp transformation factory
var myTransformation = textTransformation(transformString);

gulp.task('default', function() {
    return gulp.src('src/*.txt')
        .pipe(myTransformation({ prefix: '# ' })) // create the transformation and pass it to Gulp
        .pipe(gulp.dest('out/'));
});
~~~

You can use the factory like the original transformation function.
If the first argument passed to the factory is a string, it behaves like the
transformation function.

~~~ js
var transformString = function (s, options) {
    // do whatever you want with the text content of a file
    return s.toLowerCase();
};

var transformation = textTransformation(transformString);

transformation("ABC"); // -> "abc"
~~~

You can call `.readFileSync(filePath, [options])` on the factory, to read and transform the content of a file directly.

~~~ js
var myTransformation = textTransformation(function (s) { 
    return s.toLowerCase(); 
});

myTransformation.readFileSync('my/text_file.txt');
~~~

License
-------

GulpText _simple_ is published under MIT license.

[npm-url]: https://www.npmjs.com/package/gulp-text-simple
[npm-img]: https://img.shields.io/npm/v/gulp-text-simple.svg
[travis-img]: https://img.shields.io/travis/mastersign/gulp-text-simple/master.svg
[travis-url]: https://travis-ci.org/mastersign/gulp-text-simple
[Gulp]: http://gulp.js
