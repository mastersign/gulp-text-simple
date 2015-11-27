GulpText _simple_
=================

> simple creation of Gulp task functions for transforming text files

A lot of Gulp tasks are dealing with text files.
And often you want to just create a simple task for transforming the text content of a file in your project.
E.g. replace some placeholders with a regular expression.
But if you want to write a custom Gulp task for it, you have to deal with buffers, encoding, and case distinction for different vinyl objects.

Features
--------

* support for buffer file objects
* support for stream file objects
* supports passing additional options to the transformation function
* the transformation factory behaves like the transformation function,
  if the first argument is a string
* automatic JSON conversion of non-string results from the transformation function 

Application
-----------

With GulpText _simple_ you can just implement a function taking a string an returning a string. And it will create a Gulp transformation factory for you, which you can just use with `.pipe()`.

~~~ js
var gulp = require('gulp');
var textTransformation = require('gulp-text-simple');

var transformString = function (s) {
    // do whatever you want with the text content of a file
    return s.toLowerCase();
};

// create the Gulp transformation factory with GulpText simple
var transformation = textTransformation(transformString);

gulp.task('default', function() {
    return gulp.src('src/*.txt')
        .pipe(transformation()) // create the transformation and pass it to Gulp
        .pipe(gulp.dest('out/'));
});
~~~

If you need to pass options, you can use a second argument for that.

~~~ js
var gulp = require('gulp');
var textTransformation = require('gulp-text-simple');

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
var transformation = textTransformation(transformString);

gulp.task('default', function() {
    return gulp.src('src/*.txt')
        .pipe(transformation({ mode: 'upper' })) // create the transformation and pass it to Gulp
        .pipe(gulp.dest('out/'));
});
~~~

You can use the factory function like the original transformation function.
If the first argument passed to the factory is a string, it behaves like the
transformation function.

~~~ js
var textTransformation = require('gulp-text-simple');

var transformString = function (s, options) {
    // do whatever you want with the text content of a file
    return s.toLowerCase();
};

var transformation = textTransformation(transformString);

transformation("ABC"); // -> "abc"
~~~

License
-------

MIT
