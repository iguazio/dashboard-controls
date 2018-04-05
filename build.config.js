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
     * Config for output files
     */
    output_files: {
        app: {
            js: 'iguazio.dashboard-controls.js',
            less: 'iguazio.dashboard-controls.less'
        }
    }
};
