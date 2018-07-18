(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclFunction', {
            bindings: {},
            templateUrl: 'nuclio/projects/project/functions/function/ncl-function.tpl.html',
            controller: NclFunctionController
        });

    function NclFunctionController() {
        var ctrl = this;
    }
}());
