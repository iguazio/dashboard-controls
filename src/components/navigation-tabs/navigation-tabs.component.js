(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('igzNavigationTabs', {
            bindings: {
                tabItems: '<'
            },
            templateUrl: 'navigation-tabs/navigation-tabs.tpl.html'
        });
}());
