(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclCollapsingRow', {
            bindings: {
                actionHandlerCallback: '&',
                item: '<',
                itemIndex: '<?',
                type: '@',
                listClass: '@?'
            },
            templateUrl: 'nuclio/common/components/collapsing-row/collapsing-row.tpl.html',
            controller: NclCollapsingRowController,
            transclude: true
        });

    function NclCollapsingRowController($timeout, $i18next, i18next, lodash, DialogsService, FunctionsService) {
        var ctrl = this;
        var lng = i18next.language;

        ctrl.actions = [];
        ctrl.isEditModeActive = false;

        ctrl.$onInit = onInit;

        ctrl.isNil = lodash.isNil;
        ctrl.isNumber = lodash.isNumber;

        ctrl.getAttributeValue = getAttributeValue;
        ctrl.isVolumeType = isVolumeType;
        ctrl.onCollapse = onCollapse;
        ctrl.onClickAction = onClickAction;
        ctrl.onFireAction = onFireAction;
        ctrl.showDotMenu = showDotMenu;
        ctrl.toggleItem = toggleItem;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            lodash.defaultsDeep(ctrl.item, {
                ui: {
                    editModeActive: false,
                    expandable: true
                }
            });

            ctrl.classList = FunctionsService.getClassesList(ctrl.type);

            if (!lodash.isEmpty(ctrl.item.kind)) {
                ctrl.selectedClass = lodash.find(ctrl.classList, ['id', ctrl.item.kind]);
                ctrl.item.ui.selectedClass = ctrl.selectedClass;
            }

            ctrl.actions = initActions();
        }

        //
        // Public methods
        //

        /**
         * Returns attribute value
         * @param {string} key - attribute key
         * @param {string|Object} value - attribute value
         * @returns {string|Object}
         */
        function getAttributeValue(key, value) {
            return key === 'schedule' ? '0 ' + value : value;
        }

        /**
         * Checks if input have to be visible for specific item type
         * @param {string} name - input name
         * @returns {boolean}
         */
        function isVolumeType(name) {
            return ctrl.type === 'volume';
        }

        /**
         * Changes item's expanded state
         */
        function onCollapse(event) {
            if (!ctrl.item.ui.editModeActive) {
                ctrl.actionHandlerCallback({actionType: 'edit', selectedItem: ctrl.item});
                event.stopPropagation();
            } else {
                $timeout(function () {
                    if (ctrl.item.ui.expandable) {
                        ctrl.item.ui.editModeActive = false;
                    }
                });
            }
        }

        /**
         * Handler on action click
         * @param {Object} action - action that was clicked (e.g. `delete`)
         */
        function onClickAction(action) {
            if (lodash.isNonEmpty(action.confirm)) {
                showConfirmDialog(action);
            } else {
                onFireAction(action.id);
            }
        }

        /**
         * According to given action name calls proper action handler
         * @param {string} actionType - a type of action
         */
        function onFireAction(actionType) {
            ctrl.actionHandlerCallback({actionType: actionType, selectedItem: ctrl.item, index: ctrl.itemIndex});
        }

        /**
         * Checks if show dot menu
         */
        function showDotMenu() {
            return ctrl.actions.length > 1;
        }

        /**
         * Enables/disables item
         */
        function toggleItem() {
            ctrl.item.enable = !ctrl.item.enable;
        }

        //
        // Private methods
        //

        /**
         * Shows confirm dialog
         * @param {Object} action - e.g. `delele`
         */
        function showConfirmDialog(action) {
            var message = lodash.isNil(action.confirm.description) ? action.confirm.message : {
                message: action.confirm.message,
                description: action.confirm.description
            };

            DialogsService.confirm(message, action.confirm.yesLabel, action.confirm.noLabel, action.confirm.type)
                .then(function () {
                    onFireAction(action.id);
                });
        }

        /**
         * Initializes actions
         * @returns {Object[]} - list of actions
         */
        function initActions() {
            return [
                {
                    label: $i18next.t('common:DELETE', {lng: lng}),
                    id: 'delete',
                    icon: 'igz-icon-trash',
                    active: true,
                    confirm: {
                        message: $i18next.t('functions:DELETE_ITEM', {lng: lng}),
                        description: $i18next.t('functions:DELETE_DESCRIPTION', {lng: lng}),
                        yesLabel: $i18next.t('common:YES_DELETE', {lng: lng}),
                        noLabel: $i18next.t('common:CANCEL', {lng: lng}),
                        type: 'nuclio_alert'
                    }
                }
            ];
        }
    }
}());
