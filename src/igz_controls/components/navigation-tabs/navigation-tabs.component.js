(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('igzNavigationTabs', {
            bindings: {
                tabItems: '<'
            },
            templateUrl: 'igz_controls/components/navigation-tabs/navigation-tabs.tpl.html'
        });
}());
