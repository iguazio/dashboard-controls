/*
Copyright 2018 Iguazio Systems Ltd.
Licensed under the Apache License, Version 2.0 (the "License") with
an addition restriction as set forth herein. You may not use this
file except in compliance with the License. You may obtain a copy of
the License at http://www.apache.org/licenses/LICENSE-2.0.
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. See the License for the specific language governing
permissions and limitations under the License.
In addition, you may not use the software for any purposes that are
illegal under applicable law, and the grant of the foregoing license
under the Apache 2.0 license is conditioned upon your compliance with
such restriction.
*/
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
        ctrl.isToggleButtonVisible = isToggleButtonVisible;
        ctrl.toggleTestPane = toggleTestPane;

        //
        // Public methods
        //

        /**
         * Checks if 'toggle test pane' button should be visible.
         * It should, only when 'code' tab is reached.
         * @returns {boolean}
         */
        function isToggleButtonVisible() {
            var isButtonVisible = lodash.get($state.$current, 'self.url') === '/code';

            if (!isButtonVisible) {
                ctrl.isTestPaneClosed = false;

                $rootScope.$broadcast('navigation-tabs_toggle-test-pane', { closeTestPane: ctrl.isTestPaneClosed });
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

                $rootScope.$broadcast('navigation-tabs_toggle-test-pane', { closeTestPane: ctrl.isTestPaneClosed });

                // wait until toggling animation will be completed
                $timeout(function () {
                    isTestPaneToggled = true;
                }, 600)
            }
        }
    }
}());
