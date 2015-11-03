GulpText _simple_
=================

> simple creation of Gulp task functions for transforming text files

A lot of Gulp tasks are dealing with text files.
And often you want to just create a simple task for transforming the text content of a file in your project.
E.g. replace some placeholders with a regular expression.
But if you want to write a custom Gulp task for it, you have to deal with buffers, encoding, and case distinction for different vinyl objects.

Application
-----------

With GulpText _simple_ you can just implement a function taking a string an returning a string. And it will create a Gulp transformation for you, which you can just pass to `.pipe()`.

~~~ js
var gulp = require('gulp');
var textTask = require('gulp-text-simple');

var transformString = function (s) {
    // do whatever you want with the text content of a file
    return s.toLowerCase();
};

var transformation = textTask(transformString);

gulp.task('default', function() {
    return gulp.src('src/*.txt')
        .pipe(transformation)
        .pipe(gulp.dest('out/'));
});
~~~

License
-------

MIT