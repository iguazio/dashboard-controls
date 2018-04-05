(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclVersionExecutionResult', {
            bindings: {
                testResult: '<',
                toggleMethod: '&'
            },
            templateUrl: 'nuclio/projects/project/functions/version/version-execution-result/version-execution-result.tpl.html'
        });
}());
