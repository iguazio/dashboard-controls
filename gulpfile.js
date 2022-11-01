/*
Copyright 2018 Iguazio Systems Ltd.
Licensed under the Apache License, Version 2.0 (the "License") with
an addition restriction as set forth herein. You may not use this
file except in compliance with the License. You may obtain a copy of
the License at http://www.apache.org/licenses/LICENSE-2.0.
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. See the License for the specific language governing
permissions and limitations under the License.
In addition, you may not use the software for any purposes that are
illegal under applicable law, and the grant of the foregoing license
under the Apache 2.0 license is conditioned upon your compliance with
such restriction.
*/
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
var path = require('path');

/**
 * Set up configuration
 */
var state = {
    isForTesting: false
};

/**
 * Set build for testing
 */
function setTesting(next) {
    state.isForTesting = true;
    next();
}

//
// ******* Tasks *******
//

gulp.task('build', build);
gulp.task('test-unit', testUnit);

//
// ******* Functions *******
//

/**
 * Clean build directory
 */
function clean() {
    return gulp.src([config.build_dir, config.cache_file])
        .pipe(vinylPaths(del));
}

/**
 * Build app.css (include all project less files)
 */
function appLess() {
    var distFolder = config.assets_dir + '/less';

    var task = gulp
        .src(config.app_files.less_files)
        .pipe(concat(config.output_files.app.less))
        .pipe(gulp.dest(distFolder));

    return task;
}

/**
 * Build app.js (include all project js files and templates)
 */
function appJs() {
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
            collapseInlineTagWhitespace: true,
            conservativeCollapse: true
        }))
        .pipe(ngHtml2Js({
            moduleName: config.app_files.templates_module_name
        }));

    var task = merge2(js, templates)
        .pipe(concat(config.output_files.app.js))
        .pipe(gulp.dest(distFolder));

    return task;
}

/**
 * Copy all fonts to the build directory
 */
function fonts() {
    var distFolder = config.assets_dir + '/fonts';

    return gulp.src(config.source_dir + '/igz_controls/fonts/**/*')
        .pipe(gulp.dest(distFolder));
}

/**
 * Optimize all images and copy them to the build directory
 */
function images() {
    var distFolder = config.assets_dir + '/images';

    return gulp.src(config.source_dir + '/igz_controls/images/**/*')
        .pipe(imagemin({
            optimizationLevel: 3,
            progressive: true,
            interlaced: true
        }))
        .pipe(gulp.dest(distFolder));
}

/**
 * Lint source code
 */
 function lint() {
    return gulp.src(config.app_files.js)
        .pipe(eslint())
        .pipe(eslint.format('compact'))
        .pipe(eslint.failAfterError());
}

function i18n() {
    var distFolder = config.assets_dir + '/i18n';

    return gulp.src(config.app_files.i18n)
        .pipe(gulp.dest(distFolder));
}

function injectVersion(done) {
    exec('git describe --tags --abbrev=40', function (err, stdout) {
        buildVersion = stdout;
    });

    done();
}

/**
 * Run unit tests (Karma)
 * Task for development environment only
 */
function testUnitRun(done) {
    var karmaServer = require('karma').Server;
    var files = config.test_files.unit.vendor.map(function (vendorPath) {
        return __dirname + '/' + vendorPath;
    })
        .concat(__dirname + '/' + config.test_files.unit.modules)
        .concat([__dirname + '/' + config.assets_dir + '/js/' + config.output_files.app.js])
        .concat(__dirname + '/' + ((argv.spec !== undefined) ? 'src/**/' + argv.spec : config.test_files.unit.tests));

    new karmaServer({
        configFile: __dirname + '/' + config.test_files.unit.karma_config,
        files: files,
        action: 'run'
    }, done).start();
}

/**
 * Build vendor.less (include all vendor less files)
 */
function vendorLess() {
    var distFolder = config.assets_dir + '/less';

    return gulp.src(config.vendor_files.less)
        .pipe(concat(config.output_files.vendor.less))
        .pipe(gulp.dest(distFolder));
}

/**
 * Build vendor.js (include all vendor js files)
 */
function vendorJs() {
    var distFolder = config.assets_dir + '/js';

    return gulp.src(config.vendor_files.js)
        .pipe(concat(config.output_files.vendor.js))
        .pipe(gulp.dest(distFolder));
}

/**
 * Task for unit test running
 * Task for development environment only
 */
function testUnit(next) {
    gulp.series(setTesting, build, testUnitRun)(next);
}
//
// ******* Task chains *******
//

/**
 * Base build task
 */
function build(next) {
    gulp.series(lint, clean, injectVersion, vendorLess, vendorJs, gulp.parallel(appLess, appJs, fonts, images, i18n))(next);
}
