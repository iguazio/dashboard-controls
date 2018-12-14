(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclVersionConfiguration', {
            bindings: {
                version: '<'
            },
            templateUrl: 'nuclio/projects/project/functions/version/version-configuration/version-configuration.tpl.html',
            controller: NclVersionConfigurationController
        });

    function NclVersionConfigurationController(ConfigService, VersionHelperService) {
        var ctrl = this;

        ctrl.scrollConfig = {
            axis: 'y',
            advanced: {
                autoScrollOnFocus: false,
                updateOnContentResize: true
            }
        };

        ctrl.isDemoMode = ConfigService.isDemoMode;

        ctrl.isInvisibleForCurrentRuntime = isInvisibleForCurrentRuntime;
        ctrl.isShowForCurrentRuntime = isShowForCurrentRuntime;
        ctrl.onConfigurationChangeCallback = onConfigurationChangeCallback;

        //
        // Public methods
        //

        /**
         * Checks if `Runtime Attributes` block is invisible for current
         * @param {string} runtime
         * @returns {boolean}
         */
        function isInvisibleForCurrentRuntime(runtime) {
            return runtime !== 'shell' && runtime !== 'java';
        }

        /**
         * Checks if row with `Logging` and `Runtime Attributes` is visible for current runtime
         * @param {string} runtime
         * @returns {boolean}
         */
        function isShowForCurrentRuntime(runtime) {
            return runtime === 'java' || (runtime === 'shell' && ctrl.isDemoMode());
        }

        /**
         * Checks if version's configuration was changed
         */
        function onConfigurationChangeCallback() {
            VersionHelperService.checkVersionChange(ctrl.version);
        }
    }
}());
