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
            'src/*.js',
            'src/components/**/*.js',
            '!src/components/**/*.spec.js',
            'src/services/**/*.js',
            '!src/services/**/*.spec.js',
            'src/directives/**/*.js',
            '!src/directives/**/*.spec.js'
        ],
        less_files: [
            'src/**/*.less',
            'src/components/**/*.less'
        ],
        templates: [
            'src/components/**/*.tpl.html'
        ],
        templates_module_name: 'iguazio.dashboard-controls.templates'
    },

    /**
     * Config for output files
     */
    output_files: {
        app: {
            js: 'iguazio.dashboard-controls.js',
            less: 'iguazio.dashboard-controls.less'
        }
    }
};
