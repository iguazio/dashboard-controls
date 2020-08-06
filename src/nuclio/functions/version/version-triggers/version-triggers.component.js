(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclVersionTriggers', {
            bindings: {
                containers: '<?',
                version: '<'
            },
            templateUrl: 'nuclio/functions/version/version-triggers/version-triggers.tpl.html',
            controller: NclVersionTriggersController
        });

    function NclVersionTriggersController($i18next, $rootScope, $scope, $timeout, i18next, lodash, DialogsService,
                                          FunctionsService, ValidationService, VersionHelperService) {
        var ctrl = this;
        var lng = i18next.language;
        var uniqueClasses = ['http'];

        ctrl.scrollConfig = {
            axis: 'y',
            advanced: {
                autoScrollOnFocus: false,
                updateOnContentResize: true
            }
        };

        ctrl.isCreateModeActive = false;
        ctrl.validationRules = {
            arrayInt: ValidationService.getValidationRules('function.arrayInt'),
            host: {
                key: ValidationService.getValidationRules('k8s.dns1123Subdomain')
            },
            itemName: ValidationService.getValidationRules('function.triggerName'),
            cronInterval: ValidationService.getValidationRules('function.interval', [{
                name: 'scheduleIsEmpty',
                label: $i18next.t('functions:TRIGGER_CRON_INTERVAL_NO_SCHEDULE', { lng: lng }),
                pattern: function (value, inputName, formObject) {
                    return lodash.isEmpty(lodash.get(formObject, 'schedule.$modelValue'));
                }
            }]),
            interval: ValidationService.getValidationRules('function.interval'),
            number: ValidationService.getValidationRules('number'),
            subscriptionQoS: {
                value: ValidationService.getValidationRules('function.subscriptionQoS')
            },
            v3ioConsumerGroupName: ValidationService.getValidationRules('function.v3ioConsumerGroupName')
        };
        ctrl.triggers = [];

        ctrl.$onInit = onInit;
        ctrl.$onChanges = onChanges;
        ctrl.$onDestroy = onDestroy;

        ctrl.checkClassUniqueness = checkClassUniqueness;
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
            var additionalData = {};
            if (lodash.isArray(ctrl.containers) && !lodash.isEmpty(ctrl.containers)) {
                additionalData.containers = lodash.chain(ctrl.containers)
                    .cloneDeep()
                    .sortBy('name')
                    .value();
            }

            ctrl.classList = FunctionsService.getClassesList('trigger', additionalData);

            $scope.$on('edit-item-has-been-changed', updateTriggersChangesState);

            $timeout(function () {
                ctrl.defaultFields = {
                    ingressHost: ctrl.version.ui.ingressHost
                };

                checkClassUniqueness();

                $rootScope.$broadcast('igzWatchWindowResize::resize');
            }, 1000);
        }

        /**
         * On changes hook method.
         * @param {Object} changes
         */
        function onChanges(changes) {
            if (angular.isDefined(changes.version)) {
                ctrl.triggers = lodash.map(ctrl.version.spec.triggers, function (value, key) {
                    var triggersItem = angular.copy(value);
                    triggersItem.id = key;
                    triggersItem.name = key;

                    triggersItem.ui = {
                        changed: false,
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
         * Checks if classes should be disabled
         */
        function checkClassUniqueness() {
            lodash.forEach(uniqueClasses, function (classId) {
                var classData = lodash.find(ctrl.classList, ['id', classId]);
                var classIsUsed = lodash.some(ctrl.triggers, ['ui.selectedClass.id', classId]);

                lodash.merge(classData, {
                    tooltip: classIsUsed ?
                        classData.tooltipOriginal + ' - ' + $i18next.t('functions:CANNOT_CREATE_TRIGGER', {lng: lng}) :
                        classData.tooltipOriginal,
                    disabled: classIsUsed
                });
            })
        }

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
                            changed: true,
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
                DialogsService.alert($i18next.t('functions:ERROR_MSG.FUNCTIONALITY_IS_NOT_IMPLEMENTED', {lng: lng}));
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

            checkClassUniqueness();

            $rootScope.$broadcast('igzWatchWindowResize::resize');
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
                name: selectedItem.name,
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

            if (angular.isNumber(selectedItem.workerAvailabilityTimeoutMilliseconds)) {
                triggerItem.workerAvailabilityTimeoutMilliseconds = selectedItem.workerAvailabilityTimeoutMilliseconds;
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

            lodash.set(ctrl.version, ['spec', 'triggers', selectedItem.name], triggerItem);

            selectedItem.id = selectedItem.name;

            if (!lodash.isEqual(currentTrigger, selectedItem)) {
                angular.copy(selectedItem, currentTrigger);
            }

            checkClassUniqueness();
        }

        /**
         * Check if trigger is in edit mode
         * @returns {boolean}
         */
        function isTriggerInEditMode() {
            return lodash.some(ctrl.triggers, ['ui.editModeActive', true]);
        }

        /**
         * Checks triggers and updates `ctrl.version.ui.isTriggersChanged` if there is some changed and unsaved trigger.
         */
        function updateTriggersChangesState() {
            var isSomeTriggerChanged = lodash.some(ctrl.triggers, ['ui.changed', true]);
            var isSomeTriggerInEditMode = lodash.some(ctrl.triggers, ['ui.editModeActive', true]);

            lodash.set(ctrl.version, 'ui.isTriggersChanged', isSomeTriggerChanged && isSomeTriggerInEditMode);
        }
    }
}());
