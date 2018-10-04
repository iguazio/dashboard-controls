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

    function NclNavigationTabsController($rootScope, lodash) {
        var ctrl = this;

        ctrl.isTestPaneClosed = false;
        ctrl.isFunctionBuilding = isFunctionBuilding;
        ctrl.toggleTestPane = toggleTestPane;

        //
        // Public methods
        //

        /**
         * Checks if it's 'building' state.
         * @param {string} status - current status
         */
        function isFunctionBuilding(status) {
            return !lodash.includes(['ready', 'error', 'not yet deployed'], status);
        }

        /**
         * Sends broadcast to toggle test pane.
         */
        function toggleTestPane() {
            ctrl.isTestPaneClosed = !ctrl.isTestPaneClosed;

            $rootScope.$broadcast('navigation-tabs_toggle-test-pane', {closeTestPane: ctrl.isTestPaneClosed});
        }
    }
}());
