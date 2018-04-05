//
// ******* Configuration and loading third party components *******
//

/* eslint-disable */

/**
 * Load required components
 */

var babel = require('gulp-babel');
var config = require('./build.config');
var cache = require('gulp-file-transform-cache');
var gulp = require('gulp');
var concat = require('gulp-concat');
var runSequence = require('run-sequence');
var eslint = require('gulp-eslint');
var imagemin = require('gulp-imagemin');
var minifyHtml = require('gulp-htmlmin');
var ngHtml2Js = require('gulp-ng-html2js');
var merge2 = require('merge2');
var del = require('del');
var vinylPaths = require('vinyl-paths');
var exec = require('child_process').exec;
var buildVersion = null;

//
// ******* Tasks *******
//

/**
 * Clean build directory
 */
gulp.task('clean', function () {
    return gulp.src([config.build_dir, config.cache_file])
        .pipe(vinylPaths(del));
});

/**
 * Build app.css (include all project less files)
 */
gulp.task('app.less', function () {
    var distFolder = config.assets_dir + '/less';

    var task = gulp
        .src(config.app_files.less_files)
        .pipe(concat(config.output_files.app.less))
        .pipe(gulp.dest(distFolder));

    return task;
});

/**
 * Build app.js (include all project js files and templates)
 */
gulp.task('app.js', function () {
    var distFolder = config.assets_dir + '/js';

    var js = gulp.src(config.app_files.js)
        .pipe(cache({
            path: config.cache_file,
            transformStreams: [
                babel()
            ]
        }));

    var templates = gulp.src(config.app_files.templates)
        .pipe(minifyHtml({
            removeComments: true,
            collapseWhitespace: true,
            collapseInlineTagWhitespace: true
        }))
        .pipe(ngHtml2Js({
            moduleName: config.app_files.templates_module_name
        }));

    var task = merge2(js, templates)
        .pipe(concat(config.output_files.app.js))
        .pipe(gulp.dest(distFolder));

    return task;
});

/**
 * Copy all fonts to the build directory
 */
gulp.task('fonts', function () {
    var distFolder = config.assets_dir + '/fonts';

    return gulp.src(config.source_dir + '/igz_controls/fonts/**/*')
        .pipe(gulp.dest(distFolder));
});

/**
 * Optimize all images and copy them to the build directory
 */
gulp.task('images', function () {
    var distFolder = config.assets_dir + '/images';

    return gulp.src(config.source_dir + '/igz_controls/images/**/*')
        .pipe(imagemin({
            optimizationLevel: 3,
            progressive: true,
            interlaced: true
        }))
        .pipe(gulp.dest(distFolder));
});

/**
 * Lint source code
 */
gulp.task('lint', function () {
    return gulp.src(config.app_files.js)
        .pipe(eslint())
        .pipe(eslint.format('compact'))
        .pipe(eslint.failAfterError());
});

gulp.task('inject-version', function () {
    exec('git describe --tags --abbrev=40', function (err, stdout) {
        buildVersion = stdout;
    });
});

//
// ******* Task chains *******
//

/**
 * Base build task
 */
gulp.task('build', function (next) {
    runSequence('lint', 'clean', 'inject-version', ['app.less', 'app.js', 'fonts', 'images'], next);
});
