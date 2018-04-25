(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclVersionTrigger', {
            bindings: {
                version: '<'
            },
            templateUrl: 'nuclio/projects/project/functions/version/version-trigger/version-trigger.tpl.html',
            controller: NclVersionTriggerController
        });

    function NclVersionTriggerController($stateParams, lodash, DialogsService) {
        var ctrl = this;

        ctrl.isCreateModeActive = false;
        ctrl.triggers = [];

        ctrl.$onInit = onInit;
        ctrl.createTrigger = createTrigger;
        ctrl.editTriggerCallback = editTriggerCallback;
        ctrl.handleAction = handleAction;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            if (lodash.isNil(ctrl.version) && !lodash.isEmpty($stateParams.functionData)) {
                ctrl.version = $stateParams.functionData;
            }

            // get trigger list
            ctrl.triggers = lodash.map(ctrl.version.spec.triggers, function (value, key) {
                var triggersItem = angular.copy(value);
                triggersItem.id = key;
                triggersItem.name = key;

                return triggersItem;
            });
        }

        //
        // Public methods
        //

        /**
         * Toggle create trigger mode
         * @returns {Promise}
         */
        function createTrigger(event) {
            if (!isTriggerInEditMode()) {
                ctrl.triggers.push({
                    id: '',
                    name: '',
                    kind: '',
                    attributes: {},
                    ui: {
                        editModeActive: true,
                        expanded: true
                    }
                });
            }
            event.stopPropagation();
        }

        /**
         * Edit trigger callback function
         * @returns {Promise}
         */
        function editTriggerCallback(item) {
            ctrl.handleAction('update', item);

            item.ui.editModeActive = false;
            item.ui.expanded = false;
        }

        /**
         * According to given action name calls proper action handler
         * @param {string} actionType - ex. `delete`
         * @param {Array} selectedItem - an object of selected trigger
         * @returns {Promise}
         */
        function handleAction(actionType, selectedItem) {
            var item = lodash.find(ctrl.triggers, ['id', selectedItem.id]);
            if (actionType === 'delete') {
                lodash.remove(ctrl.triggers, ['id', selectedItem.id]);
                lodash.unset(ctrl.version, 'spec.triggers.' + selectedItem.id);
            } else if (actionType === 'edit') {
                if (!isTriggerInEditMode()) {
                    lodash.assign(item.ui, {
                        editModeActive: true,
                        expanded: true,
                        expandable: false
                    });
                }
            } else if (actionType === 'update') {
                if (!lodash.isEmpty(selectedItem.id)) {
                    lodash.unset(ctrl.version, 'spec.triggers.' + selectedItem.id);
                }

                item.id = selectedItem.name;

                var triggerItem = {
                    kind: selectedItem.kind,
                    attributes: selectedItem.attributes
                };

                if (angular.isDefined(selectedItem.url)) {
                    triggerItem.url = selectedItem.url;
                }

                if (angular.isDefined(selectedItem.maxWorkers)) {
                    triggerItem.maxWorkers = Number(selectedItem.maxWorkers);
                }

                lodash.set(ctrl.version, 'spec.triggers.' + selectedItem.name, triggerItem);

                // get trigger list
                ctrl.triggers = lodash.map(ctrl.version.spec.triggers, function (value, key) {
                    var triggersItem = angular.copy(value);
                    triggersItem.id = key;
                    triggersItem.name = key;

                    return triggersItem;
                });
            } else {
                DialogsService.alert('This functionality is not implemented yet.');
            }
        }

        /**
         * Check if trigger is in edit mode
         * @returns {boolean}
         */
        function isTriggerInEditMode() {
            var triggerInEditMode = false;
            ctrl.triggers.forEach(function (trigger) {
                if (trigger.ui.editModeActive) {
                    triggerInEditMode = true;
                }
            });
            return triggerInEditMode;
        }
    }
}());
