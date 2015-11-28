var textTransformation = require('gulp-text-simple');

var processString = function (text) {
	return text.toUpperCase();
};

var myTransformation = textTransformation(processString);

var filePath = 'docs/index.txt';
var result = myTransformation.readFileSync(filePath);

console.log(result);
