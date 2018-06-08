(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclNavigationTabs', {
            bindings: {
                tabItems: '<'
            },
            templateUrl: 'nuclio/common/components/navigation-tabs/navigation-tabs.tpl.html',
            controller: NclNavigationTabsController
        });

    function NclNavigationTabsController($timeout) {
        var ctrl = this;

        ctrl.$onInit = onInit;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            $timeout(function () {
                var statusTab = angular.element(document).find('.ncl-status-monitoring')[0];
                var statusTooltip = angular.element(statusTab).find('.ncl-status-tooltip')[0];

                statusTab = angular.element(statusTab);
                statusTooltip = angular.element(statusTooltip);

                statusTab.on('mouseenter', function () {
                    statusTooltip.css({'display': 'flex'});
                });

                statusTab.on('mouseleave', function () {
                    statusTooltip.css({'display': 'none'});
                });
            });
        }
    }
}());
