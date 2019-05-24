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
