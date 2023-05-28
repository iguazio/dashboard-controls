/**
 * This file/module contains all configuration for the build process.
 */
module.exports = {
    /**
     * Source folders
     */
    source_dir: 'src',

    /**
     * Destination folders
     */
    build_dir: 'dist',
    assets_dir: 'dist',

    /**
     * Cache file
     */
    cache_file: '.babelCache',

    /**
     * App files and configs
     */
    app_files: {
        js: [
            'src/iguazio.dashboard-controls.module.js',
            'src/igz_controls/**/*.js',
            '!src/igz_controls/**/*.spec.js',
            'src/nuclio/**/*.js',
            '!src/nuclio/**/*.spec.js'
        ],
        less_files: [
            'src/**/*.less'
        ],
        i18n: 'src/i18n/**/*',
        templates: [
            'src/**/*.tpl.html'
        ],
        templates_module_name: 'iguazio.dashboard-controls.templates'
    },

    /**
     * Third-party libs (files order is important)
     */
    vendor_files: {
        js: [
            'src/third-party/malihu-custom-scrollbar-plugin/jquery.mCustomScrollbar.concat.min.js',
            'src/third-party/ng-scrollbars/scrollbars.min.js',
            'src/third-party/angular-ui-layout/ui-layout.js'
        ],
        less: [
            'src/third-party/malihu-custom-scrollbar-plugin/jquery.mCustomScrollbar.less',
            'src/third-party/angular-ui-layout/ui-layout.less'
        ]
    },

    /**
     * Configs used for testing
     */
    test_files: {
        unit: {
            js_for_tests: [
                'src/iguazio.dashboard-controls.module.js',
                'src/iguazio.dashboard-controls.config.js',
                'src/iguazio.dashboard-controls.route.js',
                'src/iguazio.dashboard-controls.run.js',
                'src/igz_controls/**/*.js',
                '!src/igz_controls/**/*.spec.js',
                'src/nuclio/**/*.js',
                '!src/nuclio/**/*.spec.js'
            ],
            vendor: [
                'node_modules/jquery/dist/jquery.js',
                'node_modules/angular/angular.js',
                'node_modules/angular-ui-bootstrap/dist/ui-bootstrap-tpls.js',
                'node_modules/@uirouter/angularjs/release/angular-ui-router.min.js',
                'node_modules/jquery-ui/ui/widget.js',
                'node_modules/jquery-ui/ui/widgets/mouse.js',
                'node_modules/jquery-ui/ui/widgets/sortable.js',
                'node_modules/angular-sanitize/angular-sanitize.js',
                'node_modules/moment/moment.js',
                'node_modules/js-base64/base64.js',
                'node_modules/ng-file-upload/dist/ng-file-upload.js',
                'node_modules/ng-file-upload/dist/FileAPI.js',
                'node_modules/i18next/i18next.js',
                'node_modules/ng-i18next/dist/ng-i18next.js',
                'node_modules/bootstrap/js/dropdown.js',
                'node_modules/ng-dialog/js/ngDialog.js',
                'node_modules/lodash/lodash.js',
                'node_modules/restangular/src/restangular.js',
                'node_modules/monaco-editor/min/vs/loader.js',
                'node_modules/angular-download/angular-download.js'
            ],
            modules: [
                'node_modules/angular-mocks/angular-mocks.js'
            ],
            tests: [
                'src/**/*.spec.js'
            ],
            karma_config: 'tests/unit/karma.config.js'
        }
    },

    /**
     * Config for output files
     */
    output_files: {
        app: {
            js: 'iguazio.dashboard-controls.js',
            less: 'iguazio.dashboard-controls.less'
        },
        vendor: {
            js: 'vendor.js',
            less: 'vendor.less'
        }
    }
};
