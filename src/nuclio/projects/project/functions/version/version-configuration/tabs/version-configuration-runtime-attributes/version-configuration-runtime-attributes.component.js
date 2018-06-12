(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclVersionConfigurationRuntimeAttributes', {
            bindings: {
                version: '<',
                onChangeCallback: '<'
            },
            templateUrl: 'nuclio/projects/project/functions/version/version-configuration/tabs/version-configuration-runtime-attributes/version-configuration-runtime-attributes.tpl.html',
            controller: NclVersionConfigurationRuntimeAttributesController
        });

    function NclVersionConfigurationRuntimeAttributesController(lodash) {
        var ctrl = this;

        ctrl.$onInit = onInit;
        ctrl.inputValueCallback = inputValueCallback;

        //
        // Hook method
        //

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.runtimeAttributes = lodash.get(ctrl.version, 'spec.build.runtimeAttributes', []);

            ctrl.runtimeAttributes = ctrl.runtimeAttributes.join('\n');
        }

        //
        // Public method
        //

        /**
         * Update spec.runtimeAttributes value
         * @param {string} newData
         * @param {string} field
         */
        function inputValueCallback(newData, field) {
            if (field === 'attributes') {
                ctrl.runtimeAttributes = newData;
                ctrl.version.spec.build.runtimeAttributes = newData.replace(/\r/g, '\n').split(/\n+/);
            } else {
                lodash.set(ctrl.version, field, newData);
            }
            ctrl.onChangeCallback();
        }
    }
}());
