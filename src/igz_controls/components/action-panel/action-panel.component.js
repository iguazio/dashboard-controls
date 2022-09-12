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
        .component('igzActionPanel', {
            bindings: {
                actions: '<',
                onItemsCheckedCount: '&?'
            },
            templateUrl: 'igz_controls/components/action-panel/action-panel.tpl.html',
            controller: IgzActionPanel,
            transclude: true
        });

    function IgzActionPanel($scope, $rootScope, $i18next, i18next, lodash) {
        var ctrl = this;
        var lng = i18next.language;

        var checkedItemsCount = 0;
        var mainActionsCount = 5;

        ctrl.mainActions = [];
        ctrl.remainActions = [];

        ctrl.$onInit = onInit;
        ctrl.$onChanges = onChanges;

        ctrl.isActionPanelShown = isActionPanelShown;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            $scope.$on('action-checkbox-all_checked-items-count-change', onUpdateCheckedItemsCount);
            $scope.$on('action-checkbox-all_check-all', onUpdateCheckedItemsCount);

            refreshActions();
        }

        /**
         * On changes hook method
         */
        function onChanges() {
            refreshActions();
        }

        //
        // Private methods
        //

        /**
         * Default action handler
         * @param {Object} action
         * @param {string} action.id - an action ID (e.g. delete, clone etc.)
         */
        function defaultAction(action) {
            $rootScope.$broadcast('action-panel_fire-action', {
                action: action.id
            });
        }

        /**
         * Checks whether the action panel can be shown
         * @returns {boolean}
         */
        function isActionPanelShown() {
            return checkedItemsCount > 0;
        }

        /**
         * Called when 'Check all' checkbox is clicked or checked some item.
         * @param {Event} event - $broadcast-ed event
         * @param {Object} data - $broadcast-ed data
         * @param {Object} data.checkedCount - count of checked items
         */
        function onUpdateCheckedItemsCount(event, data) {
            checkedItemsCount = data.checkedCount;

            if (angular.isFunction(ctrl.onItemsCheckedCount)) {
                ctrl.onItemsCheckedCount({checkedCount: checkedItemsCount});
            }

            var visibleActions = lodash.filter(ctrl.actions, ['visible', true]);

            ctrl.mainActions = lodash.slice(visibleActions, 0, mainActionsCount);
            ctrl.remainingActions = lodash.slice(visibleActions, mainActionsCount, visibleActions.length);
        }

        /**
         * Refreshes actions list
         */
        function refreshActions() {
            ctrl.actions = lodash.filter(ctrl.actions, function (action) {
                return !lodash.has(action, 'visible') || action.visible;
            });

            angular.forEach(ctrl.actions, function (action) {
                if (!angular.isFunction(action.handler)) {
                    action.handler = defaultAction;

                    if (action.id === 'delete' && angular.isUndefined(action.confirm)) {
                        action.confirm = {
                            message: $i18next.t('common:DELETE_SELECTED_ITEMS_CONFIRM', {lng: lng}),
                            yesLabel: $i18next.t('common:YES_DELETE', {lng: lng}),
                            noLabel: $i18next.t('common:CANCEL', {lng: lng}),
                            type: 'critical_alert'
                        };
                    }
                }
            });
            ctrl.mainActions = lodash.slice(ctrl.actions, 0, mainActionsCount);
            ctrl.remainingActions = lodash.slice(ctrl.actions, mainActionsCount, ctrl.actions.length);
        }
    }
}());
