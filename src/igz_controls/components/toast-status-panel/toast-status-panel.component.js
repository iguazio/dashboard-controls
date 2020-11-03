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
            controller: IgzToastStatusPanelController
        });

    function IgzToastStatusPanelController($element, $rootScope, $timeout, lodash) {
        var ctrl = this;
        var statusIcons = {
            'succeeded': 'igz-icon-tick-round',
            'in-progress': 'igz-icon-properties',
            'failed': 'igz-icon-block'
        };

        ctrl.isToastPanelShown = false;

        ctrl.$onChanges = onChanges;

        ctrl.closeToastPanel = closeToastPanel;
        ctrl.getState = getState;
        ctrl.getStateMessage = getStateMessage;

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
