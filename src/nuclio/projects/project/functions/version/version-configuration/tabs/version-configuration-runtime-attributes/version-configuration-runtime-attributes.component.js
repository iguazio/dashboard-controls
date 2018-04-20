(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclVersionConfigurationRuntimeAttributes', {
            bindings: {
                version: '<'
            },
            templateUrl: 'nuclio/projects/project/functions/version/version-configuration/tabs/version-configuration-runtime-attributes/version-configuration-runtime-attributes.tpl.html',
            controller: NclVersionConfigurationRuntimeAttributesController
        });

    function NclVersionConfigurationRuntimeAttributesController() {
        var ctrl = this;

        // TODO
    }
}());
