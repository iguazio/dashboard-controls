(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('igzActionItemRefresh', {
            bindings: {
                refresh: '&'
            },
            templateUrl: 'igz_controls/components/action-item/action-item-refresh/action-item-refresh.tpl.html'
        });
}());
