const gulp = require('gulp');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const sync = require('browser-sync').create();
const reload = sync.reload;
const build = require('./build');

//=> Default paths
const paths = {
    baseDir: './theme/dist',
    baseDist: build.config.path.dist,
    baseSrc: build.config.path.src
};

//=> Default paths
const pathConfig = {
    dist: {
        html: paths.baseDist,
        css: paths.baseDist + '/assets/css',
        js: paths.baseDist + '/assets/js'
    },
    src: {
        html: paths.baseSrc + '/**/*.html',
        scss: paths.baseSrc + '/assets/scss/**/*.scss',
        js: paths.baseSrc + '/assets/js/**/*.js'
    }
};

//=> Browser sync task
gulp.task('browserSync', function () {
    sync.init({
        server: {
            baseDir: paths.baseDir
        }
    });
});

gulp.task('scss', function () {
    return gulp.src(pathConfig.src.scss)
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer({browsers: ['last 2 versions'], cascade: false}))
        .pipe(gulp.dest(pathConfig.dist.css))
        .pipe(sync.stream());
});

gulp.task('copy-html', function () {
    return gulp.src(pathConfig.src.html).pipe(gulp.dest(pathConfig.dist.html))
});

gulp.task('copy-js', function () {
    return gulp.src(pathConfig.src.js).pipe(gulp.dest(pathConfig.dist.js))
});

//=> Watch tasks
gulp.task('watch', ['browserSync'], function () {
    gulp.watch(pathConfig.src.scss, ['scss']);
    gulp.watch(pathConfig.src.html, ['copy-html']).on('change', reload);
    gulp.watch(pathConfig.src.js, ['copy-js']).on('change', reload);
});

gulp.task('watch:html', function () {
    gulp.watch(pathConfig.src.html, ['copy-html']).on('change', reload);
});

gulp.task('watch:scss', function () {
    gulp.watch(pathConfig.src.scss, ['scss']);
});

gulp.task('watch:js', function () {
    gulp.watch(pathConfig.src.js, ['copy-js']).on('change', reload);
});