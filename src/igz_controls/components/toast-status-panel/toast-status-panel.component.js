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
        .component('igzToastStatusPanel', {
            bindings: {
                onClose: '&?',
                panelMessages: '<',
                panelState: '<',
                permanent: '<?'
            },
            templateUrl: 'igz_controls/components/toast-status-panel/toast-status-panel.tpl.html',
            controller: IgzToastStatusPanelController,
            transclude: true
        });

    function IgzToastStatusPanelController($element, $rootScope, $timeout, $transclude, lodash) {
        var ctrl = this;
        var statusIcons = {
            'succeeded': 'igz-icon-tick-round',
            'in-progress': 'igz-icon-properties',
            'failed': 'igz-icon-block'
        };

        ctrl.isToastPanelShown = false;
        ctrl.isTranscludePassed = false;

        ctrl.$onChanges = onChanges;

        ctrl.closeToastPanel = closeToastPanel;
        ctrl.getState = getState;
        ctrl.getStateMessage = getStateMessage;

        // checks if transclude template was passed
        $transclude(function (transclude) {
            ctrl.isTranscludePassed = transclude.length > 0 && !(

              // a single text node with whitespace only, meaning there is nothing important between the opening
              // tag `<igz-toast-status-panel>` and the closing tag `</igz-toast-status-panel>`
                transclude.length === 1 && transclude[0].nodeType === 3 && transclude.text().trim() === ''
            );
        });

        //
        // Hook methods
        //

        /**
         * On changes method
         * @param {Object} changes
         */
        function onChanges(changes) {
            if (lodash.has(changes, 'panelState')) {
                ctrl.isToastPanelShown = !lodash.isNil(changes.panelState.currentValue);
                $element.find('.panel-status-icon')
                    .removeClass(lodash.get(statusIcons, changes.panelState.previousValue))
                    .addClass(lodash.get(statusIcons, changes.panelState.currentValue));
                $element.find('.toast-status-panel')
                    .removeClass(changes.panelState.previousValue)
                    .addClass(changes.panelState.currentValue);
                $element.find('.panel-status')
                    .removeClass(changes.panelState.previousValue)
                    .addClass(changes.panelState.currentValue);
            }
        }

        //
        // Public methods
        //

        /**
         * Shows/hides toast panel
         */
        function closeToastPanel() {
            ctrl.isToastPanelShown = false;
            ctrl.panelState = null;

            if (lodash.isFunction(ctrl.onClose)) {
                ctrl.onClose();
            }

            $timeout(function () {
                $rootScope.$broadcast('igzWatchWindowResize::resize');
            });
        }

        /**
         * Gets current state
         * @returns {?string} (e.g. "in-progress", "succeeded", "failed")
         */
        function getState() {
            return ctrl.panelState;
        }

        /**
         * Gets status message of given state
         * @param {string} state (e.g. "in-progress", "succeeded", "failed")
         * @returns {string}
         */
        function getStateMessage(state) {
            return lodash.get(ctrl, ['panelMessages', state]);
        }
    }
}());
