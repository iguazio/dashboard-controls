(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclVersionTriggers', {
            bindings: {
                version: '<'
            },
            templateUrl: 'nuclio/projects/project/functions/version/version-triggers/version-triggers.tpl.html',
            controller: NclVersionTriggersController
        });

    function NclVersionTriggersController($rootScope, lodash, DialogsService, VersionHelperService) {
        var ctrl = this;

        ctrl.isCreateModeActive = false;
        ctrl.triggers = [];

        ctrl.$onInit = onInit;
        ctrl.$onDestroy = onDestroy;
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

            // get trigger list
            ctrl.triggers = lodash.map(ctrl.version.spec.triggers, function (value, key) {
                var triggersItem = angular.copy(value);
                triggersItem.id = key;
                triggersItem.name = key;

                triggersItem.ui = {
                    editModeActive: false,
                    isFormValid: true,
                    name: 'trigger'
                };

                triggersItem.attributes = lodash.defaultTo(triggersItem.attributes, {});

                return triggersItem;
            });
        }

        /**
         * Destructor method
         */
        function onDestroy() {
            $rootScope.$broadcast('change-state-deploy-button', {component: 'trigger', isDisabled: false});
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
                        isFormValid: false,
                        name: 'trigger'
                    }
                });
                $rootScope.$broadcast('change-state-deploy-button', {component: 'trigger', isDisabled: true});
                event.stopPropagation();
            }
        }

        /**
         * Edit trigger callback function
         * @returns {Promise}
         */
        function editTriggerCallback(item) {
            ctrl.handleAction('update', item);
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
                item.ui.editModeActive = true;
            } else if (actionType === 'update') {
                if (!lodash.isEmpty(selectedItem.id)) {
                    lodash.unset(ctrl.version, 'spec.triggers.' + selectedItem.id);
                }

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

                if (angular.isDefined(triggerItem.attributes)) {
                    triggerItem.attributes = lodash.omitBy(triggerItem.attributes, function (attribute) {
                        return !lodash.isNumber(attribute) && lodash.isEmpty(attribute);
                    });

                    if (lodash.isEmpty(triggerItem.attributes)) {
                        triggerItem = lodash.omit(triggerItem, 'attributes');
                    }
                }

                lodash.set(ctrl.version, 'spec.triggers.' + selectedItem.name, triggerItem);

                selectedItem.id = selectedItem.name;

                if (!lodash.isEqual(item, selectedItem)) {
                    angular.copy(selectedItem, item);
                }
            } else {
                DialogsService.alert('This functionality is not implemented yet.');
            }

            $rootScope.$broadcast('change-state-deploy-button', {component: 'trigger', isDisabled: false});
            lodash.forEach(ctrl.triggers, function (trigger) {
                if (!trigger.ui.isFormValid) {
                    $rootScope.$broadcast('change-state-deploy-button', {component: trigger.ui.name, isDisabled: true});
                }
            });

            VersionHelperService.checkVersionChange(ctrl.version);
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
