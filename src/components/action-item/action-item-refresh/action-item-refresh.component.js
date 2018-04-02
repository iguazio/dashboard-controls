(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('igzActionItemRefresh', {
            bindings: {
                refresh: '&'
            },
            templateUrl: 'action-item/action-item-refresh/action-item-refresh.tpl.html'
        });
}());
