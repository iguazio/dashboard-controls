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

    function NclVersionConfigurationLoggingController(lodash, ConfigService) {
        var ctrl = this;

        ctrl.logLevelValues = [
            {
                id: 'error',
                name: 'Error'
            },
            {
                id: 'warn',
                name: 'Warning'
            },
            {
                id: 'info',
                name: 'Info'
            },
            {
                id: 'debug',
                name: 'Debug'
            }
        ];

        ctrl.$onInit = onInit;

        ctrl.isDemoMode = ConfigService.isDemoMode;

        ctrl.inputValueCallback = inputValueCallback;
        ctrl.setPriority = setPriority;

        //
        // Hook methods
        //

        function onInit() {
            lodash.defaultsDeep(ctrl.version, {
                spec: {
                    loggerSinks: [{ level: 'debug' }]
                }
            });
        }

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

        /**
         * Sets logger level
         * @param {Object} item
         */
        function setPriority(item) {
            lodash.set(ctrl.version, 'spec.loggerSinks[0].level', item.id);
            ctrl.onChangeCallback();
        }
    }
}());
