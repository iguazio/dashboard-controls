(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclVersionConfigurationLogging', {
            bindings: {
                version: '<',
                onChangeCallback: '<'
            },
            templateUrl: 'nuclio/projects/project/functions/version/version-configuration/tabs/version-configuration-logging/version-configuration-logging.tpl.html',
            controller: NclVersionConfigurationLoggingController
        });

    function NclVersionConfigurationLoggingController(lodash) {
        var ctrl = this;

        ctrl.inputValueCallback = inputValueCallback;

        //
        // Public methods
        //

        /**
         * Update data callback
         * @param {string} newData
         * @param {string} field
         */
        function inputValueCallback(newData, field) {
            lodash.set(ctrl.version, field, newData);

            ctrl.onChangeCallback();
        }
    }
}());
