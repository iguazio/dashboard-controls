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
            'vendor/jquery/dist/jquery.js',
            'vendor/angular/angular.js',
            'vendor/angular-bootstrap/ui-bootstrap-tpls.js',
            'vendor/angular-ui-router/release/angular-ui-router.js',
            'vendor/jquery-ui/ui/core.js',
            'vendor/jquery-ui/ui/widget.js',
            'vendor/jquery-ui/ui/mouse.js',
            'vendor/jquery-ui/ui/sortable.js',
            'vendor/moment/moment.js',
            'vendor/ng-file-upload/ng-file-upload.js',
            'vendor/ng-file-upload/FileAPI.js',
            'vendor/bootstrap/js/dropdown.js',
            'vendor/ng-dialog/js/ngDialog.js',
            'vendor/lodash/lodash.js',
            'node_modules/monaco-editor/min/vs/loader.js',
            'node_modules/angular-download/angular-download.js'
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
                'src/igz_controls/**/*.js',
                '!src/igz_controls/**/*.spec.js',
                'src/nuclio/**/*.js',
                '!src/nuclio/**/*.spec.js'
            ],
            modules: [
                'vendor/angular-mocks/angular-mocks.js'
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
            js: 'vendor.js'
        }
    }
};
