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

    function NclNavigationTabsController($rootScope, $state, $timeout, lodash) {
        var ctrl = this;
        var isTestPaneToggled = true;

        ctrl.isTestPaneClosed = false;
        ctrl.isFunctionBuilding = isFunctionBuilding;
        ctrl.isToggleButtonVisible = isToggleButtonVisible;
        ctrl.toggleTestPane = toggleTestPane;

        //
        // Public methods
        //

        /**
         * Checks if it's 'building' state.
         * @param {string} status - current status
         * @returns {boolean}
         */
        function isFunctionBuilding(status) {
            return !lodash.includes(['ready', 'error', 'unhealthy', 'not yet deployed'], status);
        }

        /**
         * Checks if 'toggle test pane' button should be visible.
         * It should, only when 'code' tab is reached.
         * @returns {boolean}
         */
        function isToggleButtonVisible() {
            var isButtonVisible = lodash.get($state.$current, 'self.url', null) === '/code';

            if (!isButtonVisible) {
                ctrl.isTestPaneClosed = false;

                $rootScope.$broadcast('navigation-tabs_toggle-test-pane', {closeTestPane: ctrl.isTestPaneClosed});
            }

            return isButtonVisible;
        }

        /**
         * Sends broadcast to toggle test pane.
         */
        function toggleTestPane() {
            if (isTestPaneToggled) {
                ctrl.isTestPaneClosed = !ctrl.isTestPaneClosed;
                isTestPaneToggled = false;

                $rootScope.$broadcast('navigation-tabs_toggle-test-pane', {closeTestPane: ctrl.isTestPaneClosed});

                // wait until toggling animation will be completed
                $timeout(function () {
                    isTestPaneToggled = true;
                }, 600)
            }
        }
    }
}());
