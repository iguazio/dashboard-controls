(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclFunction', {
            bindings: {},
            templateUrl: 'nuclio/projects/project/functions/function/ncl-function.tpl.html',
            controller: NclFunctionController
        });

    function NclFunctionController($state, $timeout, ConfigService, HeaderService) {
        var ctrl = this;
    }
}());
