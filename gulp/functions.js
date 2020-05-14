'use strict';

const gulp = require('gulp');
const sass = require('gulp-sass');
const gulpUtil = require('gulp-util');
const rewrite = require('gulp-rewrite-css');
const concat = require('gulp-concat');
const gulpif = require('gulp-if');
const sourcemaps = require('gulp-sourcemaps');
const htmlmin = require('gulp-htmlmin');
const uglify = require('gulp-uglify-es').default;
const autoprefixer = require('gulp-autoprefixer');
const cleancss = require('gulp-clean-css');
const lazypipe = require('lazypipe');
const path = require('path');
const sync = require('browser-sync').create();
const build = require('./build');

module.exports = {
    //=> default variable config
    config: Object.assign({}, {
        compile: {
            htmlMinify: false,
            jsUglify: false,
            cssMinify: false,
            jsSourcemaps: false,
            cssSourcemaps: false,
        },
    }, build.config),

    scssPath: build.config.path.src + '/assets/scss',

    /**
     * Walk into object recursively
     * @param array
     * @param funcname
     * @param userdata
     * @returns {boolean}
     */
    objectWalkRecursive: function (array, funcname, userdata) {
        if (!array || typeof array !== 'object') {
            return false;
        }
        if (typeof funcname !== 'function') {
            return false;
        }
        for (var key in array) {
            //=> Apply "funcname" recursively only on object
            if (Object.prototype.toString.call(array[key]) === '[object Object]') {
                var funcArgs = [array[key], funcname];
                if (arguments.length > 2) {
                    funcArgs.push(userdata);
                }
                if (module.exports.objectWalkRecursive.apply(null, funcArgs) === false) {
                    return false;
                }
            }
            try {
                if (arguments.length > 2) {
                    funcname(array[key], key, userdata);
                } else {
                    funcname(array[key], key);
                }
            } catch (e) {
                return false;
            }
        }
        return true;
    },

    /**
     * Add JS compilation options to gulp pipe
     */
    jsBuild: function () {
        const config = this.config.compile;
        return lazypipe().pipe(function () {
            return gulpif(config.jsSourcemaps, sourcemaps.init({loadMaps: true, debug: config.debug}));
        }).pipe(function () {
            return gulpif(config.jsUglify, uglify());
        }).pipe(function () {
            return gulpif(config.jsSourcemaps, sourcemaps.write('./'));
        });
    },

    /**
     * Add CSS compilation options to gulp pipe
     */
    cssBuild: function () {
        const config = this.config.compile;
        const includePaths = module.exports.scssPath;
        return lazypipe().pipe(function () {
            return gulpif(config.cssSourcemaps, sourcemaps.init({loadMaps: true, debug: config.debug}));
        }).pipe(function () {
            return sass({
                errLogToConsole: true,
                includePaths: includePaths,
            }).on('error', sass.logError);
        }).pipe(function () {
            return gulpif(config.cssMinify, cleancss({debug: config.debug}));
        }).pipe(function () {
            return gulpif(true, autoprefixer({
                browsers: ['last 2 versions'],
                cascade: false
            }));
        }).pipe(function () {
            return gulpif(config.cssSourcemaps, sourcemaps.write('./'));
        });
    },

    /**
     * Convert string path to actual path
     * @param path
     * @returns {*}
     */
    dotPath: function (path) {
        const regex = new RegExp(/\{\$(.*?)\}/),
            dot = function (obj, i) {
                return obj[i];
            };
        const matched = path.match(regex);
        if (matched) {
            const realpath = matched[1].split('.').reduce(dot, build);
            return path = path.replace(matched[0], realpath);
        }
        return path;
    },

    /**
     * Convert multiple paths
     * @param paths
     */
    dotPaths: function (paths) {
        paths.forEach(function (path, i) {
            paths[i] = module.exports.dotPath(path);
        });
    },

    /**
     * Css path rewriter when bundle files moved
     * @param folder
     */
    cssRewriter: function (folder) {
        const imgRegex = new RegExp(/\.(gif|jpg|jpeg|tiff|png|ico)$/i);
        const fontRegex = new RegExp(/\.(otf|eot|svg|ttf|woff|woff2)$/i);
        const config = this.config;

        return lazypipe().pipe(function () {
            // rewrite css relative path
            return rewrite({
                destination: folder,
                debug: config.debug,
                adaptPath: function (ctx) {
                    const isCss = ctx.sourceFile.match(/\.[css]+$/i);
                    // process css only
                    if (isCss[0] === '.css') {
                        const pieces = ctx.sourceDir.split(/\\|\//);
                        const file = module.exports.baseFileName(ctx.targetFile);
                        let extension = '../fonts/';

                        let vendor = pieces[pieces.indexOf('node_modules') + 1];
                        if (pieces.indexOf('node_modules') === -1) {
                            vendor = pieces[pieces.indexOf('vendors') + 1];
                        }

                        if (imgRegex.test(file)) {
                            extension = '../img/';
                        }
                        return path.join(extension + vendor, file);
                    }
                },
            });
        });
    },

    /**
     * Get end filename from path
     * @param path
     * @returns {string}
     */
    baseFileName: function (path) {
        if (path !== undefined) {
            const maybeFile = path.split('/').pop();
            if (maybeFile.indexOf('.') !== -1) {
                return maybeFile;
            }
            return '';
        }
    },

    /**
     * Bundle
     * @param bundle
     */
    bundle: function (bundle) {
        const _this = this, assets = '/assets';
        const dist = build.config.path.dist;
        const src = build.config.path.src;
        let finalDist, finalSrc;

        if (typeof bundle.src !== 'undefined' && typeof bundle.bundle !== 'undefined') {

            //=> for images & fonts as per vendor
            if ('mandatory' in bundle.src && 'optional' in bundle.src) {

                let vendors = {};
                for (let key in bundle.src) {
                    if (!bundle.src.hasOwnProperty(key)) continue;
                    vendors = Object.assign(vendors, bundle.src[key]);
                }

                for (let vendor in vendors) {

                    if (!vendors.hasOwnProperty(vendor)) continue;

                    const vendorObj = vendors[vendor];

                    for (let type in vendorObj) {

                        if (!vendorObj.hasOwnProperty(type)) continue;

                        _this.dotPaths(vendorObj[type]);
                        switch (type) {
                            case 'fonts':
                                finalDist = dist + assets + '/fonts/' + vendor;
                                finalSrc = src + assets + '/fonts/' + vendor;
                                gulp.src(vendorObj[type]).pipe(gulp.dest(finalSrc)).pipe(gulp.dest(finalDist));
                                break;
                            case 'images':
                                finalDist = dist + assets + '/img/' + vendor;
                                finalSrc = src + assets + '/img/' + vendor;
                                gulp.src(vendorObj[type]).pipe(gulp.dest(finalSrc)).pipe(gulp.dest(finalDist));
                                break;
                        }
                    }
                }
            }

            //=> flattening array
            if (!('styles' in bundle.src) && !('scripts' in bundle.src)) {
                const src = {styles: [], scripts: []};
                _this.objectWalkRecursive(bundle.src, function (paths, type) {
                    switch (type) {
                        case 'styles':
                        case 'scripts':
                            src[type] = src[type].concat(paths);
                            break;
                        case 'images':
                            // images for mandatory and optional vendor already processed
                            if (!'mandatory' in bundle.src || !'optional' in bundle.src) {
                                src[type] = src[type].concat(paths);
                            }
                            break;
                    }
                });
                bundle.src = src;
            }

            for (let type in bundle.src) {
                if (!bundle.src.hasOwnProperty(type)) continue;
                //=> Skip if not array
                if (Object.prototype.toString.call(bundle.src[type]) !== '[object Array]') continue;
                //=> Skip if no bundle output is provided
                if (typeof bundle.bundle[type] === 'undefined') continue;

                _this.dotPaths(bundle.src[type]);
                const outputFile = _this.baseFileName(bundle.bundle[type]);

                switch (type) {
                    case 'styles':
                        finalDist = dist + assets + '/css';
                        finalSrc = src + assets + '/css';
                        gulp.src(bundle.src[type]).pipe(_this.cssRewriter(bundle.bundle[type])())
                            .pipe(concat(outputFile)).pipe(_this.cssBuild()())
                            .pipe(gulp.dest(finalSrc)).pipe(gulp.dest(finalDist));
                        break;

                    case 'scripts':
                        finalDist = dist + assets + '/js';
                        finalSrc = src + assets + '/js';
                        gulp.src(bundle.src[type]).pipe(concat(outputFile))
                            .pipe(_this.jsBuild()()).pipe(gulp.dest(finalSrc)).pipe(gulp.dest(finalDist));
                        break;

                    default:
                        break;
                }
            }
        }
    },

    /**
     * Copy source to output destination
     * @param bundle
     */
    copysrc: function (bundle) {
        const _this = this, assets = '/assets';
        const dist = build.config.path.dist;
        const src = build.config.path.src;
        const config = this.config.compile;
        let finalDist, finalSrc;

        if (typeof bundle.src !== 'undefined' && typeof bundle.bundle !== 'undefined') {
            for (var type in bundle.src) {
                if (!bundle.src.hasOwnProperty(type)) continue;

                const path = _this.dotPath(bundle.src[type]);
                const outputFile = _this.baseFileName(bundle.bundle[type]);

                switch (type) {
                    case 'styles':
                        finalDist = dist + assets + '/css';
                        finalSrc = src + assets + '/css';
                        gulp.src(path).pipe(concat(outputFile)).pipe(_this.cssBuild()()).pipe(gulp.dest(finalSrc))
                            .pipe(gulp.dest(finalDist)).pipe(sync.stream());
                        break;

                    case 'scripts':
                        finalDist = dist + assets + '/js';
                        finalSrc = src + assets + '/js';
                        gulp.src(path).pipe(_this.jsBuild()()).pipe(gulp.dest(finalDist));
                        break;

                    case 'images':
                        finalDist = dist + assets + '/img';
                        gulp.src(path).pipe(gulp.dest(finalDist));
                        break;

                    default:
                        gulp.src(path).pipe(gulpif(config.htmlMinify, htmlmin({collapseWhitespace: true, removeComments: true})))
                            .pipe(gulp.dest(dist));
                        break;
                }
            }
        }
    },

    /**
     * Set compile options
     */
    setCompile: function () {
        const compile = this.config.compile;
        compile.htmlMinify = true;
        compile.jsUglify = true;
        compile.cssMinify = true;
        compile.jsSourcemaps = true;
        compile.cssSourcemaps = true;
    }
};