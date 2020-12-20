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

    function NclVersionTriggersController($i18next, $rootScope, $scope, $timeout, $window, i18next, lodash,
                                          ConfigService, DialogsService, FunctionsService, ValidationService,
                                          VersionHelperService) {
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
                key: ValidationService.getValidationRules('k8s.dns1123Subdomain'),
                value: ValidationService.getValidationRules('function.ingressHostPath')
            },
            itemName: ValidationService.getValidationRules('function.triggerName', [{
                name: 'uniqueness',
                label: $i18next.t('functions:UNIQUENESS', { lng: lng }),
                pattern: function (value) {
                    return lodash.filter(ctrl.triggers, ['name', value]).length <= 1;
                }
            }]),
            cronInterval: ValidationService.getValidationRules('function.interval', [{
                name: 'scheduleIsEmpty',
                label: $i18next.t('functions:TRIGGER_CRON_INTERVAL_NO_SCHEDULE', { lng: lng }),
                pattern: function (value, inputName, formObject) {
                    return lodash.isEmpty(lodash.get(formObject, 'item_schedule.$modelValue'));
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

        ctrl.addDefaultHttpTrigger = addDefaultHttpTrigger;
        ctrl.checkClassUniqueness = checkClassUniqueness;
        ctrl.createTrigger = createTrigger;
        ctrl.editTriggerCallback = editTriggerCallback;
        ctrl.handleAction = handleAction;
        ctrl.isCreateNewTriggerEnabled = isCreateNewTriggerEnabled;
        ctrl.isHttpTriggerMsgShown = isHttpTriggerMsgShown;

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
                updateTriggerList();
            }
        }

        /**
         * Destructor method
         */
        function onDestroy() {
            $rootScope.$broadcast('change-state-deploy-button', { component: 'trigger', isDisabled: false });
        }

        //
        // Public methods
        //

        /**
         * Adds default HTTP trigger to the trigger list
         * @param {Event} event
         */
        function addDefaultHttpTrigger(event) {
            var defaultTriggers = lodash.get(ConfigService, 'nuclio.defaultFunctionConfig.attributes.spec.triggers');
            var defaultHttpTrigger = angular.copy(lodash.find(defaultTriggers, ['kind', 'http']));

            event.stopPropagation();

            if (!lodash.isEmpty(defaultHttpTrigger)) {
                var triggers = lodash.get(ctrl.version, 'spec.triggers', {});
                var triggerItem = createTriggerItem(defaultHttpTrigger);
                triggerItem.name = 'http'; // make sure the name is not 'default-http'
                triggerItem.ui.editModeActive = true;
                triggers[defaultHttpTrigger.name] = defaultHttpTrigger;

                lodash.set(ctrl.version, 'spec.triggers', triggers);
                ctrl.triggers.push(triggerItem);

                updateTriggerInfoMsg(triggerItem);
                checkClassUniqueness();

                $rootScope.$broadcast('change-state-deploy-button', { component: 'trigger', isDisabled: true });

                $timeout(function () {
                    $window.dispatchEvent(new Event('resize'));
                });
            }
        }

        /**
         * Checks if classes should be disabled
         */
        function checkClassUniqueness() {
            lodash.forEach(uniqueClasses, function (classId) {
                var classData = lodash.find(ctrl.classList, ['id', classId]);
                var classIsUsed = lodash.some(ctrl.triggers, ['ui.selectedClass.id', classId]);

                lodash.merge(classData, {
                    tooltip: classData.tooltipOriginal +
                        (classIsUsed ? ' - ' + $i18next.t('functions:CANNOT_CREATE_TRIGGER', { lng: lng }) : ''),
                    disabled: classIsUsed
                });
            });
        }

        /**
         * Toggle create trigger mode
         * @returns {Promise}
         */
        function createTrigger(event) {
            $timeout(function () {
                if (ctrl.isCreateNewTriggerEnabled()) {
                    ctrl.triggers.push(createTriggerItem());
                    $rootScope.$broadcast('change-state-deploy-button', { component: 'trigger', isDisabled: true });
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
                DialogsService.alert($i18next.t('functions:ERROR_MSG.FUNCTIONALITY_IS_NOT_IMPLEMENTED', { lng: lng }));
            }

            $rootScope.$broadcast('change-state-deploy-button', { component: 'trigger', isDisabled: false });
            lodash.forEach(ctrl.triggers, function (trigger) {
                if (!trigger.ui.isFormValid) {
                    $rootScope.$broadcast(
                        'change-state-deploy-button',
                        { component: trigger.ui.name, isDisabled: true }
                    );
                }
            });

            VersionHelperService.updateIsVersionChanged(ctrl.version);
        }

        /**
         * Tests whether "Create new trigger" button is enabled.
         * @returns {boolean} `true` in case "Create new trigger" button is enabled, or `false` otherwise.
         */
        function isCreateNewTriggerEnabled() {
            return !lodash.some(ctrl.triggers, {
                id: '',
                ui: {
                    editModeActive: true
                }
            });
        }

        /**
         * Tests whether the `HTTP trigger message` is shown
         * @returns {boolean} `true` in case "HTTP trigger message" is shown, or `false` otherwise.
         */
        function isHttpTriggerMsgShown() {
            return !lodash.some(ctrl.version.spec.triggers, ['kind', 'http']);
        }

        //
        // Private methods
        //

        /**
         * Creates the new trigger item
         * @param {Object} [trigger] - trigger object
         * @returns {Object} - trigger item
         */
        function createTriggerItem(trigger) {
            var noTriggerProvided = lodash.isNil(trigger);
            var triggerItem = lodash.assign({}, noTriggerProvided ? {} : trigger, {
                id: noTriggerProvided ? '' : trigger.name,
                name: noTriggerProvided ? '' : trigger.name,
                kind: noTriggerProvided ? '' : trigger.kind,
                ui: {
                    changed: noTriggerProvided,
                    editModeActive: noTriggerProvided,
                    isFormValid: !noTriggerProvided,
                    name: 'trigger',
                    selectedClass: noTriggerProvided ? '' : lodash.find(ctrl.classList, ['id', trigger.kind])
                }
            });

            if (noTriggerProvided) {
                lodash.merge(triggerItem, {
                    attributes: {}
                });
            }

            return triggerItem;
        }

        /**
         * Deletes selected item
         * @param {Array} selectedItem - an object of selected trigger
         */
        function deleteHandler(selectedItem) {
            lodash.remove(ctrl.triggers, ['id', selectedItem.id]);
            lodash.unset(ctrl.version, 'spec.triggers.' + selectedItem.id);

            checkClassUniqueness();

            $timeout(function () {
                $rootScope.$broadcast('igzWatchWindowResize::resize');
            });
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

            updateTriggerInfoMsg(currentTrigger);
            checkClassUniqueness();
        }

        /**
         * Sets trigger's data for `more-info` tooltip
         * @param {Object} trigger - the trigger object for updating `more-info` data
         */
        function updateTriggerInfoMsg(trigger) {
            if (trigger.kind === 'http') {
                lodash.set(trigger, 'ui.moreInfoMsg', {
                    name: {
                        type: trigger.name === 'default-http' ? 'warn' : 'info',
                        description: $i18next.t('functions:HTTP_TRIGGER_NAME_DESCRIPTION', { lng: lng })
                    }
                });
            } else {
                lodash.unset(trigger, 'ui.moreInfoMsg');
            }
        }

        /**
         * Updates trigger list for displaying on the page
         */
        function updateTriggerList() {
            ctrl.triggers = lodash.map(ctrl.version.spec.triggers, function (trigger) {
                var triggersItem = lodash.assign(lodash.cloneDeep(trigger), createTriggerItem(trigger));

                lodash.defaults(triggersItem, {
                    attributes: {}
                });

                if (trigger.kind === 'cron') {
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

                updateTriggerInfoMsg(triggersItem);

                return triggersItem;
            });
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
