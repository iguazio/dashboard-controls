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
var argv = require('yargs').argv;
var minifyHtml = require('gulp-htmlmin');
var ngHtml2Js = require('gulp-ng-html2js');
var merge2 = require('merge2');
var imagemin = require('gulp-imagemin');
var del = require('del');
var vinylPaths = require('vinyl-paths');
var exec = require('child_process').exec;
var buildVersion = null;

/**
 * Set up configuration
 */
var state = {
    isForTesting: false
};

/**
 * Set build for testing
 */
gulp.task('set-testing', function () {
    state.isForTesting = true;
});

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
    var sourceFiles = config.app_files.js;

    if (state.isForTesting) {
        sourceFiles = config.test_files.unit.js_for_tests;
    }

    var js = gulp.src(sourceFiles)
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

/**
 * Run unit tests (Karma)
 * Task for development environment only
 */
gulp.task('test-unit-run', function (done) {
    var karmaServer = require('karma').Server;
    var files = [__dirname + '/' + config.assets_dir + '/js/' + config.output_files.vendor.js]
        .concat(__dirname + '/' + config.test_files.unit.modules)
        .concat([__dirname + '/' + config.assets_dir + '/js/' + config.output_files.app.js])
        .concat(__dirname + '/' + ((argv.spec !== undefined) ? 'src/**/' + argv.spec : config.test_files.unit.tests));

    new karmaServer({
        configFile: __dirname + '/' + config.test_files.unit.karma_config,
        files: files,
        action: 'run'
    }, done).start();
});

/**
 * Build vendor.js (include all vendor js files)
 */
gulp.task('vendor.js', function () {
    var distFolder = config.assets_dir + '/js';

    return gulp.src(config.vendor_files.js)
        .pipe(concat(config.output_files.vendor.js))
        .pipe(gulp.dest(distFolder));
});

/**
 * Task for unit test running
 * Task for development environment only
 */
gulp.task('test-unit', function (next) {
    runSequence('set-testing', 'build', 'test-unit-run', next);
});

//
// ******* Task chains *******
//

/**
 * Base build task
 */
gulp.task('build', function (next) {
    runSequence('lint', 'clean', 'inject-version', 'vendor.js', ['app.less', 'app.js', 'fonts', 'images'], next);
});
