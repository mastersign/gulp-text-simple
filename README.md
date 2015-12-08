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
* supports passing additional [options](#options) to the transformation function
* passing the [source path](#source-path) of the vinyl file as an option into the transformation function
* control the input and output [encoding](#encoding)
* the transformation factory behaves [like the transformation function](#use-as-a-function),
  if the first argument is a string
* read and transform the content of a text file [synchronously](#read-and-transform-synchronously)
  and [asynchronously](#read-and-transform-asynchronously)
* transform a text file [synchronously](#read-transform-and-write-synchronously)
  and [asynchronously](#read-transform-and-write-asynchronously)
* automatic JSON conversion of non-string results from the transformation function

Introduction
------------

All examples are based on the following preamble.

``` js
var gulp = require('gulp');
var textTransformation = require('gulp-text-simple');
```

With GulpText _simple_ you can just implement a function, taking a string and returning a string.
It will create a [Gulp] transformation factory for you, which you can use with `.pipe()`.

``` js
var transformString = function (s) {
    // do whatever you want with the text content of a file
    return s.toLowerCase();
};

// create the factory with GulpText simple
var myTransformation = textTransformation(transformString);

gulp.task('default', function () {
    return gulp.src('src/*.txt')
        .pipe(myTransformation()) // create the Gulp transformation and insert it into the Gulp stream
        .pipe(gulp.dest('out/'));
});
```

Options
-------

If you need to pass options, you can give them as a map to the factory.

``` js
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

gulp.task('default', function () {
    return gulp.src('src/*.txt')
        .pipe(myTransformation({ mode: 'upper' })) // create the transformation with options
        .pipe(gulp.dest('out/'));
});
```

### Default Options

If you want to pepare default options for a transformation,
you can pass them to GulpText _simple_ as second argument.

``` js
var transformString = function (s, options) {
    assert.equal(options.myOption, 'abc');
    return s;
};

// create the Gulp transformation factory with default options
var myTransformation = textTransformation(transformString, { myOption: 'abc' });

gulp.task('default', function () {
    return gulp.src('src/*.txt')
        .pipe(myTransformation()) // create the transformation without options
        .pipe(gulp.dest('out/'));
});
```

### Encoding

You can control the encoding of reading and writing files and buffers
with the options `sourceEncoding` and `targetEncoding`.

``` js
var myTransformation = textTransformation(function (s) { 
    return s.toLowerCase(); 
});

gulp.task('default', function () {
    return gulp.src('src/*.txt')
        .pipe(myTransformation({ // create the transformation with explicit encoding
            sourceEncoding: 'utf16le',
            targetEncoding: 'utf8'
        }))
        .pipe(gulp.dest('out/'));
});
``` 

The default encoding for input is UTF-8.
The default encoding for output is the encoding of the input.
Allowed are all encodings, supported by [Buffer].

### Source Path

The source path of a file is allways passed as option `sourcePath` to the transformation function.
If the custom options allready have an attribute `sourcePath` it is _not_ overridden.

``` js
var os = require('os');

var transformString = function (text, options) {
    // putting the source path as a prefix at the top of the text
    var prefix = options.prefix; // custom options are preserved
    var pathOfFile = options.sourcePath; // the sourcePath is merged into the custom options
    return prefix + pathOfFile + os.EOL + text;
};

// create the Gulp transformation factory
var myTransformation = textTransformation(transformString);

gulp.task('default', function () {
    return gulp.src('src/*.txt')
        .pipe(myTransformation({ prefix: '# ' })) // create the transformation and pass it to Gulp
        .pipe(gulp.dest('out/'));
});
```

API
---

Calling GulpText _simple_ creates a factory which can be used in a number of different ways:

* call `t("text"[, options])` like the original transformation function
* call `t([options])`, to create a Gulp transformation
* call `t.readFile(filePath[, options], callback)` to read and transform a file asynchronously
* call `t.readFileSync(filePath[, options])` to read and transform a file synchronously
* call `t.transformFile(sourcePath, targetPath[, options], callback)` to read, transform, and write a file asynchronously
* call `t.transformFileSync(sourcePath, targetPath[, options])` to read, transform, and write a file synchronously

### Usa as a Function

You can call the factory like the original transformation function.
If the first argument passed to the factory is a string,
it behaves like the transformation function.

``` js
var transformString = function (s, options) {
    // do whatever you want with the text content of a file
    return s.toLowerCase();
};

// create the factory with GulpText simple
var transformation = textTransformation(transformString);

// call the factory as if it where the original transformation function
var result = transformation("ABC");
console.log(result); // -> abc
```

### Use with Gulp

You can use the factory to create a [Gulp] transformation.

``` js
var transformString = function (s) {
    // do whatever you want with the text content of a file
    return s.toLowerCase();
};

// create the factory with GulpText simple
var myTransformation = textTransformation(transformString);

gulp.task('default', function () {
    return gulp.src('src/*.txt')
        .pipe(myTransformation()) // create the Gulp transformation and insert it into the Gulp stream
        .pipe(gulp.dest('out/'));
});
```

### Read and transform asynchronously

You can call `.readFile(filePath[, options], callback)` on the factory,
to read and transform the content of a file asynchronously.

``` js
var myTransformation = textTransformation(function (s) {
    return s.toLowerCase();
});

myTransformation.readFile('my/text_file.txt', function (err, result) {
    if (err) {
        console.log(err);
    } else {
        console.log(result);
    }
});
```

### Read and transform synchronously

You can call `.readFileSync(filePath[, options])` on the factory,
to read and transform the content of a file synchronously.

``` js
var myTransformation = textTransformation(function (s) {
    return s.toLowerCase();
});

var result = myTransformation.readFileSync('my/text_file.txt');
console.log(result);
```

### Read, transform, and write asynchronously

You can call `.transformFile(sourcePath, targetPath[, options], callback)` on the factory,
to read, transform, and write the content of a file asynchronously.

``` js
var myTransformation = textTransformation(function (s) {
    return s.toLowerCase();
});

myTransformation.transformFile('my/text_file.txt', 'my/result.txt', function (err) {
    if (err) {
        console.log(err);
    }
});
```

### Read, transform, and write synchronously

You can call `.transformFileSync(sourcePath, targetPath[, options])` on the factory,
to read, transform, and write the content of a file synchronously.

``` js
var myTransformation = textTransformation(function (s) {
    return s.toLowerCase();
});

myTransformation.transformFileSync('my/text_file.txt', 'my/result.txt');
```

License
-------

GulpText _simple_ is published under MIT license.

[npm-url]: https://www.npmjs.com/package/gulp-text-simple
[npm-img]: https://img.shields.io/npm/v/gulp-text-simple.svg
[travis-img]: https://img.shields.io/travis/mastersign/gulp-text-simple/master.svg
[travis-url]: https://travis-ci.org/mastersign/gulp-text-simple
[Gulp]: http://gulpjs.com
[Buffer]: https://nodejs.org/api/buffer.html
