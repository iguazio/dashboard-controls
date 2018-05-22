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

    function NclVersionConfigurationController($stateParams, lodash, ConfigService, VersionHelperService) {
        var ctrl = this;

        ctrl.scrollConfig = {
            axis: 'y',
            advanced: {
                autoScrollOnFocus: false,
                updateOnContentResize: true
            }
        };

        ctrl.isDemoMode = ConfigService.isDemoMode;

        ctrl.onConfigurationChangeCallback = onConfigurationChangeCallback;

        //
        // Public methods
        //

        /**
         * Checks if version's configuration was changed
         */
        function onConfigurationChangeCallback() {
            VersionHelperService.checkVersionChange(ctrl.version);
        }
    }
}());
