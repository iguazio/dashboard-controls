(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclProject', {
            bindings: {},
            templateUrl: 'nuclio/projects/project/ncl-project.tpl.html',
            controller: NclProjectController
        });

    function NclProjectController($state, $timeout, ConfigService, HeaderService) {
        var ctrl = this;
    }
}());
