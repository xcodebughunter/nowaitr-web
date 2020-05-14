const gulpUtil = require('gulp-util');

// const args = Object.assign({'prod': false}, gulpUtil.env);
const config = './config.json';
module.exports = require(config);