(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclVersionConfigurationResources', {
            bindings: {
                version: '<'
            },
            templateUrl: 'nuclio/projects/project/functions/version/version-configuration/tabs/version-configuration-resources/version-configuration-resources.tpl.html',
            controller: NclVersionConfigurationResourcesController
        });

    function NclVersionConfigurationResourcesController(lodash, ConfigService) {
        var ctrl = this;

        ctrl.isDemoMode = ConfigService.isDemoMode();

        ctrl.$onInit = onInit;

        ctrl.numberInputCallback = numberInputCallback;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.memorySliderConfig = {
                name: 'Memory',
                value: 0,
                valueLabel: '',
                pow: 0,
                unitLabel: 'MB',
                labelHelpIcon: false,
                options: {
                    floor: 1,
                    id: 'memory',
                    ceil: 1025,
                    showSelectionBar: false,
                    onChange: null,
                    onEnd: null
                }
            };
            ctrl.cpuSliderConfig = {
                name: 'CPU',
                value: 0,
                valueLabel: '',
                pow: 0,
                unitLabel: '',
                labelHelpIcon: false,
                options: {
                    floor: 1,
                    id: 'cpu',
                    ceil: 10,
                    showSelectionBar: false,
                    onChange: null,
                    onEnd: null
                }
            };
            ctrl.defaultMeasureUnits = [
                {
                    pow: 1,
                    name: 'KB'
                },
                {
                    pow: 2,
                    name: 'MB'
                },
                {
                    pow: 3,
                    name: 'GB'
                }
            ];
            ctrl.minReplicas = lodash.get(ctrl.version, 'spec.minReplicas');
            ctrl.maxReplicas = lodash.get(ctrl.version, 'spec.maxReplicas');
        }

        //
        // Public methods
        //

        /**
         * Update data callback
         * @param {string} newData
         * @param {string} field
         */
        function numberInputCallback(newData, field) {
            ctrl[field] = newData;
            if (ctrl.resourcesForm.$valid) {
                lodash.set(ctrl.version.spec, field, newData);
            }
        }
    }
}());
