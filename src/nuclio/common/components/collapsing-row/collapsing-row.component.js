(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclCollapsingRow', {
            bindings: {
                actionHandlerCallback: '&',
                item: '<'
            },
            templateUrl: 'nuclio/common/components/collapsing-row/collapsing-row.tpl.html',
            controller: NclCollapsingRowController,
            transclude: true
        });

    function NclCollapsingRowController(lodash) {
        var ctrl = this;

        ctrl.actions = [];
        ctrl.isEditModeActive = false;

        ctrl.$onInit = onInit;

        ctrl.isNil = lodash.isNil;

        ctrl.onFireAction = onFireAction;
        ctrl.toggleItem = toggleItem;
        ctrl.onCollapse = onCollapse;

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

            ctrl.actions = initActions();
        }

        //
        // Public methods
        //

        /**
         * According to given action name calls proper action handler
         * @param {string} actionType - a type of action
         */
        function onFireAction(actionType) {
            ctrl.actionHandlerCallback({actionType: actionType, selectedItem: ctrl.item});
        }

        /**
         * Enables/disables item
         */
        function toggleItem() {
            ctrl.item.enable = !ctrl.item.enable;
        }

        /**
         * Changes item's expanded state
         */
        function onCollapse(event) {
            if (!ctrl.item.ui.editModeActive) {
                ctrl.actionHandlerCallback({actionType: 'edit', selectedItem: ctrl.item})
                event.stopPropagation();
            }
        }

        //
        // Private methods
        //

        /**
         * Initializes actions
         * @returns {Object[]} - list of actions
         */
        function initActions() {
            return [
                {
                    label: 'Delete',
                    id: 'delete',
                    icon: 'igz-icon-trash',
                    active: true,
                    confirm: {
                        message: 'Delete item?',
                        description: 'Deleted item cannot be restored.',
                        yesLabel: 'Yes, Delete',
                        noLabel: 'Cancel',
                        type: 'nuclio_alert'
                    }
                }
            ];
        }
    }
}());
