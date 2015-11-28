var gulp = require('gulp');
var textTransformation = require('gulp-text-simple');

var processString = function (text) {
	return text.toUpperCase();
};

var myTransformation = textTransformation(processString);

gulp.task('default', function () {
	return gulp.src('docs/*.txt')
		.pipe(myTransformation())
		.pipe(gulp.dest('out/'));
});
