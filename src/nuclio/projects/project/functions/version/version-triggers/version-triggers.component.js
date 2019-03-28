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

    function NclVersionTriggersController($rootScope, $timeout, lodash, DialogsService, VersionHelperService) {
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

                if (value.kind === 'cron') {
                    var scheduleValueArray = lodash.chain(triggersItem)
                        .get('attributes.schedule', '')
                        .split(' ')
                        .value();

                    if (scheduleValueArray.length === 6) {
                        triggersItem.attributes.schedule = lodash.chain(scheduleValueArray)
                            .takeRight(5)
                            .join(' ')
                            .value();
                    }
                }

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
            $timeout(function () {
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
            }, 100);
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
            if (actionType === 'delete') {
                deleteHandler(selectedItem);
            } else if (actionType === 'edit') {
                editHandler(selectedItem);
            } else if (actionType === 'update') {
                updateHandler(selectedItem);
            } else {
                DialogsService.alert('This functionality is not implemented yet.');
            }

            $rootScope.$broadcast('change-state-deploy-button', {component: 'trigger', isDisabled: false});
            lodash.forEach(ctrl.triggers, function (trigger) {
                if (!trigger.ui.isFormValid) {
                    $rootScope.$broadcast('change-state-deploy-button', {component: trigger.ui.name, isDisabled: true});
                }
            });

            VersionHelperService.updateIsVersionChanged(ctrl.version);
        }

        //
        // Private methods
        //

        /**
         * Deletes selected item
         * @param {Array} selectedItem - an object of selected trigger
         */
        function deleteHandler(selectedItem) {
            lodash.remove(ctrl.triggers, ['id', selectedItem.id]);
            lodash.unset(ctrl.version, 'spec.triggers.' + selectedItem.id);
        }

        /**
         * Toggles item to edit mode
         * @param {Array} selectedItem - an object of selected trigger
         */
        function editHandler(selectedItem) {
            var aTrigger = lodash.find(ctrl.triggers, ['id', selectedItem.id]);
            aTrigger.ui.editModeActive = true;
        }

        /**
         * Updates data in selected item
         * @param {Array} selectedItem - an object of selected trigger
         */
        // eslint-disable-next-line
        function updateHandler(selectedItem) {
            var currentTrigger = lodash.find(ctrl.triggers, ['id', selectedItem.id]);

            if (!lodash.isEmpty(selectedItem.id)) {
                lodash.unset(ctrl.version, 'spec.triggers.' + selectedItem.id);
            }

            var triggerItem = {
                kind: selectedItem.kind,
                attributes: selectedItem.attributes
            };

            if (angular.isDefined(selectedItem.workerAllocatorName)) {
                triggerItem.workerAllocatorName = selectedItem.workerAllocatorName;
            }

            if (angular.isDefined(selectedItem.url)) {
                triggerItem.url = selectedItem.url;
            }

            if (angular.isDefined(selectedItem.maxWorkers)) {
                triggerItem.maxWorkers = Number(selectedItem.maxWorkers);
            }

            if (angular.isDefined(selectedItem.workerAvailabilityTimeoutMilliseconds)) {
                triggerItem.workerAvailabilityTimeoutMilliseconds = Number(selectedItem.workerAvailabilityTimeoutMilliseconds);
            }

            if (angular.isDefined(selectedItem.username)) {
                triggerItem.username = selectedItem.username;
            }

            if (angular.isDefined(selectedItem.password)) {
                triggerItem.password = selectedItem.password;
            }

            if (angular.isDefined(selectedItem.attributes.event)) {
                if (lodash.isEmpty(triggerItem.attributes.event.body)) {
                    delete triggerItem.attributes.event.body;
                }

                if (!lodash.isEmpty(selectedItem.attributes.event.body)) {
                    triggerItem.attributes.event.body = selectedItem.attributes.event.body;
                }

                if (lodash.isEmpty(triggerItem.attributes.event.headers)) {
                    delete triggerItem.attributes.event.headers;
                }

                if (!lodash.isEmpty(selectedItem.attributes.event.headers)) {
                    triggerItem.attributes.event.headers = angular.copy(selectedItem.attributes.event.headers);
                }
            }

            if (angular.isDefined(triggerItem.attributes)) {
                triggerItem.attributes = lodash.omitBy(triggerItem.attributes, function (attribute) {
                    return !lodash.isNumber(attribute) && lodash.isEmpty(attribute);
                });

                if (angular.isDefined(triggerItem.attributes.schedule)) {
                    triggerItem.attributes.schedule = '0 ' + triggerItem.attributes.schedule;
                }

                if (lodash.isEmpty(triggerItem.attributes)) {
                    triggerItem = lodash.omit(triggerItem, 'attributes');
                }
            }

            if (angular.isDefined(selectedItem.annotations)) {
                triggerItem.annotations = selectedItem.annotations;
            }

            lodash.set(ctrl.version, 'spec.triggers.' + selectedItem.name, triggerItem);

            selectedItem.id = selectedItem.name;

            if (!lodash.isEqual(currentTrigger, selectedItem)) {
                angular.copy(selectedItem, currentTrigger);
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
