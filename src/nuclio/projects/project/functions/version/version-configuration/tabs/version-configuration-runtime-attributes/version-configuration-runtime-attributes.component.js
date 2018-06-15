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

        ctrl.runtimeAttributes = {};

        //
        // Hook method
        //

        /**
         * Initialization method
         */
        function onInit() {
            lodash.set(ctrl.runtimeAttributes, 'repositories', lodash.get(ctrl.version, 'spec.build.runtimeAttributes.repositories', []));

            ctrl.runtimeAttributes.repositories = ctrl.runtimeAttributes.repositories.join('\n');
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
            if (field === 'repositories') {
                ctrl.runtimeAttributes.repositories = newData;
                lodash.set(ctrl.version, 'spec.build.runtimeAttributes.repositories', newData.replace(/\r/g, '\n').split(/\n+/));
            } else {
                lodash.set(ctrl.version, field, newData);
            }
            ctrl.onChangeCallback();
        }
    }
}());
