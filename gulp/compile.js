const gulp = require('gulp');
const gulpUtil = require('gulp-util');
const sequence = require('run-sequence');
const del = require('del');
const build = require('./build');
const func = require('./functions');

//=> Task to bundle js/css
gulp.task('build-bundle', function (cb) {
    func.objectWalkRecursive(build.build, function (val, key) {
        if (typeof val.src !== 'undefined') {
            if (typeof val.bundle !== 'undefined') {
                func.bundle(val);
            }
            if (typeof val.output !== 'undefined') {
                func.copysrc(val);
            }
        }
    });
    cb();
});

//=> Clear dist folder
const tasks = ['clean:dist'];
gulp.task('clean:dist', function () {
    return del.sync(build.config.path.dist);
});

//=> Build dist folder
gulp.task('build', tasks, function (cb) {
    return sequence(['build-bundle'], cb);
});

//=> Build dist folder with minefield files
gulp.task('build:prod', tasks, function (cb) {
    func.setCompile();
    return sequence(['build-bundle'], cb);
});