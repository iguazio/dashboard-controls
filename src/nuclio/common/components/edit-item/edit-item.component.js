/* eslint max-statements: ["error", 93] */
(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclEditItem', {
            bindings: {
                item: '<',
                classList: '<',
                classPlaceholder: '@?',
                type: '@',
                onSelectClassCallback: '&?',
                onSubmitCallback: '&',
                validationRules: '<?',
                maxLengths: '<?',
                defaultFields: '<?',
                readOnly: '<?'
            },
            templateUrl: 'nuclio/common/components/edit-item/edit-item.tpl.html',
            controller: NclEditItemController
        });

    function NclEditItemController($document, $element, $i18next, $rootScope, $scope, $timeout, i18next, lodash,
                                   ConfigService, ConverterService, EventHelperService, FormValidationService,
                                   PreventDropdownCutOffService) {
        var ctrl = this;
        var lng = i18next.language;

        var itemInitial = {};

        ctrl.editItemForm = {};
        ctrl.selectedClass = {};

        ctrl.igzScrollConfig = {
            maxElementsCount: 10,
            childrenSelector: '.table-body'
        };
        ctrl.scrollConfig = {
            axis: 'y',
            advanced: {
                updateOnContentResize: true
            }
        };
        ctrl.isAdvancedVisible = false;
        ctrl.isAdvancedCollapsed = true;

        ctrl.isShowFieldError = FormValidationService.isShowFieldError;
        ctrl.isShowFieldInvalidState = FormValidationService.isShowFieldInvalidState;
        ctrl.isNil = lodash.isNil;

        ctrl.$onInit = onInit;
        ctrl.$postLink = postLink;
        ctrl.$onDestroy = onDestroy;

        ctrl.addNewAnnotation = addNewAnnotation;
        ctrl.addNewBroker = addNewBroker;
        ctrl.addNewEventHeader = addNewEventHeader;
        ctrl.addNewIngress = addNewIngress;
        ctrl.addNewSubscription = addNewSubscription;
        ctrl.addNewTopic = addNewTopic;
        ctrl.getItemName = getItemName;
        ctrl.getSelectedClassMoreInfo = getSelectedClassMoreInfo;
        ctrl.handleAnnotationAction = handleAnnotationAction;
        ctrl.handleBrokerAction = handleBrokerAction;
        ctrl.handleEventHeaderAction = handleEventHeaderAction;
        ctrl.handleIngressAction = handleIngressAction;
        ctrl.handleSubscriptionAction = handleSubscriptionAction;
        ctrl.handleTopicAction = handleTopicAction;
        ctrl.inputValueCallback = inputValueCallback;
        ctrl.isCronTrigger = isCronTrigger;
        ctrl.isFieldVisible = isFieldVisible;
        ctrl.isHttpTrigger = isHttpTrigger;
        ctrl.isKafkaTrigger = isKafkaTrigger;
        ctrl.isMqttTrigger = isMqttTrigger;
        ctrl.isSelectedClassMoreInfoVisible = isSelectedClassMoreInfoVisible;
        ctrl.isTriggerType = isTriggerType;
        ctrl.isVolumeType = isVolumeType;
        ctrl.numberInputCallback = numberInputCallback;
        ctrl.onChangeKeyValueData = onChangeKeyValueData;
        ctrl.onClearButtonClick = onClearButtonClick;
        ctrl.onSelectClass = onSelectClass;
        ctrl.onSelectDropdownValue = onSelectDropdownValue;
        ctrl.onSubmitForm = onSubmitForm;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        // eslint-disable-next-line
        function onInit() {
            ctrl.validationRules = angular.copy(ctrl.validationRules);

            lodash.defaults(ctrl, {
                classPlaceholder: $i18next.t('functions:PLACEHOLDER.SELECT_CLASS', { lng: lng })
            });

            if (!lodash.isEmpty(ctrl.item.kind)) {
                ctrl.selectedClass = lodash.find(ctrl.classList, ['id', ctrl.item.kind]);
                ctrl.item.ui.selectedClass = ctrl.selectedClass;

                $timeout(validateValues);
            }

            if (ctrl.isVolumeType()) {
                var selectedTypeName = !lodash.isNil(ctrl.item.volume.hostPath)              ? 'hostPath'              :
                                       !lodash.isNil(ctrl.item.volume.flexVolume)            ? 'v3io'                  :
                                       !lodash.isNil(ctrl.item.volume.secret)                ? 'secret'                :
                                       !lodash.isNil(ctrl.item.volume.configMap)             ? 'configMap'             :
                                       !lodash.isNil(ctrl.item.volume.persistentVolumeClaim) ? 'persistentVolumeClaim' :
                                                                                               null;

                if (!lodash.isNil(selectedTypeName)) {
                    ctrl.selectedClass = lodash.find(ctrl.classList, ['id', selectedTypeName]);
                }
            }

            if (ctrl.isTriggerType() && ctrl.isHttpTrigger()) {
                ctrl.ingresses = lodash.chain(ctrl.item.attributes.ingresses)
                    .defaultTo({})
                    .map(function (ingress) {
                        return {
                            name: ingress.host,
                            value: ingress.paths.join(','),
                            additionalValue: ingress.secretName,
                            ui: {
                                editModeActive: false,
                                isFormValid: true,
                                name: 'ingress'
                            }
                        };
                    })
                    .value();
                ctrl.ingressesInitial = lodash.cloneDeep(ctrl.ingresses);

                ctrl.annotations = lodash.chain(ctrl.item.annotations)
                    .defaultTo([])
                    .map(function (value, key) {
                        return {
                            name: key,
                            value: value,
                            ui: {
                                editModeActive: false,
                                isFormValid: true,
                                name: 'trigger.annotation'
                            }
                        };
                    })
                    .value();
                ctrl.annotationsInitial = lodash.cloneDeep(ctrl.annotations);
            }

            updateNameValidationRules();

            if (ctrl.isTriggerType() && ctrl.isKafkaTrigger()) {
                lodash.defaultsDeep(ctrl.item.attributes, {
                    sasl: {
                        user: '',
                        password: ''
                    }
                });
                ctrl.item.attributes.sasl.enable = !lodash.isEmpty(ctrl.item.attributes.sasl.user) &&
                    !lodash.isEmpty(ctrl.item.attributes.sasl.password);

                ctrl.topics = lodash.chain(ctrl.item.attributes.topics)
                    .defaultTo([])
                    .map(function (value, index) {
                        return {
                            name: index,
                            value: value,
                            ui: {
                                editModeActive: false,
                                isFormValid: true,
                                name: 'topic'
                            }
                        };
                    })
                    .value();
                ctrl.topicsInitial = lodash.cloneDeep(ctrl.topics);

                ctrl.brokers = lodash.chain(ctrl.item.attributes.brokers)
                    .defaultTo([])
                    .map(function (value, index) {
                        return {
                            name: index,
                            value: value,
                            ui: {
                                editModeActive: false,
                                isFormValid: true,
                                name: 'broker'
                            }
                        };
                    })
                    .value();
                ctrl.brokersInitial = lodash.cloneDeep(ctrl.brokers);
            }

            if (ctrl.isTriggerType() && ctrl.isMqttTrigger()) {
                ctrl.subscriptions = lodash.chain(ctrl.item.attributes.subscriptions)
                    .defaultTo([])
                    .map(function (value) {
                        return {
                            name: value.topic,
                            value: value.qos,
                            ui: {
                                editModeActive: false,
                                isFormValid: true,
                                name: 'subscription'
                            }
                        };
                    })
                    .value();
                ctrl.subscriptionsInitial = lodash.cloneDeep(ctrl.subscriptions);
            }

            if (ctrl.isTriggerType() && ctrl.isCronTrigger()) {
                lodash.defaultsDeep(ctrl.item.attributes, {
                    event: {
                        body: '',
                        headers: {}
                    }
                });

                ctrl.eventHeaders = lodash.chain(ctrl.item)
                    .get('attributes.event.headers')
                    .defaultTo({})
                    .map(function (value, key) {
                        return {
                            name: key,
                            value: value,
                            ui: {
                                editModeActive: false,
                                isFormValid: true,
                                name: 'event.headers'
                            }
                        };
                    })
                    .value();
                ctrl.eventHeadersInitial = lodash.cloneDeep(ctrl.eventHeaders);
            }

            var fields = lodash.get(ctrl.selectedClass, 'fields');
            lodash.forEach(fields, function (field) {
                var path = lodash.defaultTo(field.path, field.name);
                if (field.type === 'arrayInt') {
                    lodash.update(ctrl.item, path, ConverterService.fromNumberArray);
                }
            });

            if (!lodash.isEmpty(ctrl.item.id)) {
                lodash.set(ctrl.item, 'ui.changed', false);
            }

            itemInitial = lodash.cloneDeep(lodash.omit(ctrl.item, 'ui'));

            setAdvancedVisibility();

            $scope.$on('deploy-function-version', onFunctionDeploy);
        }

        function updateNameValidationRules() {
            if (ctrl.isTriggerType() && !lodash.isEmpty(ctrl.selectedClass) && !ctrl.isHttpTrigger()) {
                if (!lodash.find(ctrl.validationRules.itemName, ['name', 'mustNotBe'])) {
                    ctrl.validationRules.itemName.push({
                        name: 'mustNotBe',
                        label: $i18next.t('common:MUST_NOT_BE', {lng: lng}) + ': default-http',
                        pattern: function (value) {
                            return value !== 'default-http';
                        }
                    });
                }
            } else {
                lodash.remove(ctrl.validationRules.itemName, ['name', 'mustNotBe']);
            }
        }

        /**
         * Post linking method
         */
        function postLink() {
            $document.on('click', submitOnClick);

            // Bind DOM-related preventDropdownCutOff method to component's controller
            PreventDropdownCutOffService.preventDropdownCutOff($element, '.three-dot-menu');
        }

        /**
         * Destructor
         */
        function onDestroy() {
            lodash.set(ctrl.item, 'ui.changed', false);

            $rootScope.$broadcast('edit-item-has-been-changed', {});

            $document.off('click', submitOnClick);
        }

        //
        // Public methods
        //

        /**
         * Adds new ingress
         * @param {Event} event
         */
        function addNewIngress(event) {
            if (ctrl.readOnly) {
                return;
            }

            $timeout(function () {
                if (ctrl.ingresses.length < 1 || lodash.chain(ctrl.ingresses).last().get('ui.isFormValid', true).value()) {
                    ctrl.ingresses.push({
                        name: lodash.get(ctrl.defaultFields, 'ingressHost', ''),
                        value: '/',
                        additionalValue: '',
                        ui: {
                            editModeActive: true,
                            isFormValid: false,
                            name: 'ingress'
                        }
                    });
                    event.stopPropagation();
                }
            }, 50);
        }

        /**
         * Adds new annotation
         * @param {Event} event
         */
        function addNewAnnotation(event) {
            if (ctrl.readOnly) {
                return;
            }

            $timeout(function () {
                if (ctrl.annotations.length < 1 || lodash.last(ctrl.annotations).ui.isFormValid) {
                    ctrl.annotations.push({
                        name: '',
                        value: '',
                        ui: {
                            editModeActive: true,
                            isFormValid: false,
                            name: 'trigger.annotation'
                        }
                    });
                    event.stopPropagation();
                }
            }, 50);
        }

        /**
         * Adds new subscription
         * @param {Event} event
         */
        function addNewSubscription(event) {
            if (ctrl.readOnly) {
                return;
            }

            $timeout(function () {
                if (ctrl.subscriptions.length < 1 || lodash.last(ctrl.subscriptions).ui.isFormValid) {
                    ctrl.subscriptions.push({
                        name: '',
                        value: '',
                        ui: {
                            editModeActive: true,
                            isFormValid: false,
                            name: 'subscription'
                        }
                    });
                    event.stopPropagation();
                }
            }, 50);
        }

        /**
         * Adds new topic
         * @param {Event} event
         */
        function addNewTopic(event) {
            if (ctrl.readOnly) {
                return;
            }

            $timeout(function () {
                if (ctrl.topics.length < 1 || lodash.last(ctrl.topics).ui.isFormValid) {
                    ctrl.topics.push({
                        name: '',
                        value: '',
                        ui: {
                            editModeActive: true,
                            isFormValid: false,
                            name: 'topic'
                        }
                    });
                    event.stopPropagation();
                }
            }, 50);
        }

        /**
         * Adds new broker
         * @param {Event} event
         */
        function addNewBroker(event) {
            if (ctrl.readOnly) {
                return;
            }

            $timeout(function () {
                if (ctrl.brokers.length < 1 || lodash.last(ctrl.brokers).ui.isFormValid) {
                    ctrl.brokers.push({
                        name: '',
                        value: '',
                        ui: {
                            editModeActive: true,
                            isFormValid: false,
                            name: 'broker'
                        }
                    });
                    event.stopPropagation();
                }
            }, 50);
        }

        /**
         * Adds new event header
         * @param {Event} event - native event object
         */
        function addNewEventHeader(event) {
            if (ctrl.readOnly) {
                return;
            }

            $timeout(function () {
                if (ctrl.eventHeaders.length < 1 || lodash.last(ctrl.eventHeaders).ui.isFormValid) {
                    ctrl.eventHeaders.push({
                        name: '',
                        value: '',
                        ui: {
                            editModeActive: true,
                            isFormValid: false,
                            name: 'event.headers'
                        }
                    });
                    event.stopPropagation();
                }
            }, 50);
        }

        /**
         * Returns value for Name input.
         * Value could has different path depends on item type.
         * @returns {string}
         */
        function getItemName() {
            return ctrl.type === 'volume' ? ctrl.item.volume.name : ctrl.item.name;
        }

        /**
         * Gets corresponding tooltip description
         * @returns {string}
         */
        function getSelectedClassMoreInfo() {
            return lodash.get(ctrl.selectedClass, 'moreInfoDescription');
        }

        /**
         * Handler on specific action type of trigger's ingress
         * @param {string} actionType
         * @param {number} index - index of variable in array
         */
        function handleIngressAction(actionType, index) {
            if (actionType === 'delete') {
                ctrl.ingresses.splice(index, 1);
                lodash.unset(ctrl.item, 'attributes.ingresses.' + index);

                checkValidation('ingresses');
            }

            updateChangesState();
        }

        /**
         * Handler on specific action type of trigger's event header
         * @param {string} actionType
         * @param {number} index - index of variable in array
         */
        function handleEventHeaderAction(actionType, index) {
            if (actionType === 'delete') {
                ctrl.eventHeaders.splice(index, 1);
                lodash.unset(ctrl.item, 'attributes.event.headers.' + index);

                checkValidation('eventHeaders');
            }

            updateChangesState();
        }

        /**
         * Handler on specific action type of trigger's annotation
         * @param {string} actionType
         * @param {number} index - index of variable in array
         */
        function handleAnnotationAction(actionType, index) {
            if (actionType === 'delete') {
                var deletedItems = ctrl.annotations.splice(index, 1);
                lodash.unset(ctrl.item, 'annotations.' + lodash.head(deletedItems).name);

                checkValidation('annotations');
            }

            updateChangesState();
        }

        /**
         * Handler on specific action type of trigger's subscription
         * @param {string} actionType
         * @param {number} index - index of variable in array
         */
        function handleSubscriptionAction(actionType, index) {
            if (actionType === 'delete') {
                lodash.pullAt(ctrl.subscriptions, index);
                lodash.pullAt(ctrl.item.attributes.subscriptions, index);

                checkValidation('subscriptions');
            }

            updateChangesState();
        }

        /**
         * Handler on specific action type of trigger's topic
         * @param {string} actionType
         * @param {number} index - index of variable in array
         */
        function handleTopicAction(actionType, index) {
            if (actionType === 'delete') {
                lodash.pullAt(ctrl.topics, index);
                lodash.pullAt(ctrl.item.attributes.topics, index);

                checkValidation('topics');
            }

            updateChangesState();
        }

        /**
         * Handler on specific action type of trigger's broker
         * @param {string} actionType
         * @param {number} index - index of variable in array
         */
        function handleBrokerAction(actionType, index) {
            if (actionType === 'delete') {
                lodash.pullAt(ctrl.brokers, index);
                lodash.pullAt(ctrl.item.attributes.brokers, index);

                checkValidation('brokers');
            }

            updateChangesState();
        }

        /**
         * Update data callback
         * @param {string} newData
         * @param {string} field
         */
        function inputValueCallback(newData, field) {
            if (ctrl.isVolumeType() && field === 'name') {
                lodash.set(ctrl.item, 'volumeMount.name', newData);
                lodash.set(ctrl.item, 'volume.name', newData);
            } else {
                lodash.set(ctrl.item, field, newData);
            }

            validateValues();
            updateChangesState();
        }

        /**
         * Determines whether or not a field should be displayed.
         * @returns {Function} filter expression
         */
        function isFieldVisible(showAdvanced) {
            /**
             * Filter expression
             * @param {Object} field - The field to test.
             * @param {string} field.type - The type of the field.
             * @param {boolean} field.visible - The visibility of the field.
             * @returns {boolean} `true` in case the field should be displayed, or `false` otherwise.
             */
            return function (field) {
                return lodash.defaultTo(field.visible, true) &&
                    lodash.includes(['input', 'dropdown', 'number-input', 'arrayInt'], field.type) &&
                    (showAdvanced ? field.isAdvanced : !field.isAdvanced);
            };
        }

        /**
         * Checks for `http` triggers
         * @returns {boolean}
         */
        function isHttpTrigger() {
            return ctrl.selectedClass.id === 'http';
        }

        /**
         * Checks for `kafka` triggers
         * @returns {boolean}
         */
        function isKafkaTrigger() {
            return ctrl.selectedClass.id === 'kafka-cluster';
        }

        /**
         * Checks for `cron` triggers
         * @returns {boolean}
         */
        function isCronTrigger() {
            return ctrl.selectedClass.id === 'cron';
        }

        /**
         * Checks if tooltip is visible.
         * @returns {boolean}
         */
        function isSelectedClassMoreInfoVisible() {
            return lodash.has(ctrl.selectedClass, 'moreInfoDescription');
        }

        /**
         * Returns `true` if item is a trigger.
         * @returns {boolean} `true` if item is a trigger, or `false` otherwise.
         */
        function isTriggerType() {
            return ctrl.type === 'trigger';
        }

        /**
         * Checks is input have to be visible for specific item type
         * @returns {boolean}
         */
        function isVolumeType() {
            return ctrl.type === 'volume';
        }

        /**
         * Checks for `mqtt` triggers
         * @returns {boolean}
         */
        function isMqttTrigger() {
            return ctrl.selectedClass.id === 'mqtt';
        }

        /**
         * Changes data of specific variable
         * @param {Object} variable
         * @param {number} index
         */
        function onChangeKeyValueData(variable, index) {
            if (variable.ui.name === 'trigger.annotation') {
                ctrl.annotations[index] = variable;

                checkValidation('annotations');
            } else if (variable.ui.name === 'ingress') {
                ctrl.ingresses[index] = variable;

                checkValidation('ingresses');
            } else if (variable.ui.name === 'event.headers') {
                ctrl.eventHeaders[index] = variable;

                checkValidation('eventHeaders');
            } else if (variable.ui.name === 'subscription') {
                ctrl.subscriptions[index] = variable;

                checkValidation('subscriptions');
            } else if (variable.ui.name === 'topic') {
                ctrl.topics[index] = variable;

                checkValidation('topics');
            } else if (variable.ui.name === 'broker') {
                ctrl.brokers[index] = variable;

                checkValidation('brokers');
            }

            updateChangesState();
        }

        /**
         * Set empty string to `schedule` field of `cron` trigger
         */
        function onClearButtonClick() {
            lodash.set(ctrl.item, 'attributes.schedule', '');

            $timeout(function () {
                updateChangesState();
                validateValues();
            });
        }

        /**
         * Update item class callback
         * @param {Object} item - item class/kind
         */
        // eslint-disable-next-line
        function onSelectClass(item) {
            ctrl.selectedClass = item;

            if (ctrl.isVolumeType()) {
                lodash.defaultsDeep(ctrl.item, {
                    volume: {
                        name: ''
                    },
                    volumeMount: {
                        name: '',
                        mountPath: ''
                    }
                });

                if (item.id === 'hostPath') {
                    lodash.defaultsDeep(ctrl.item, {
                        volume: {
                            hostPath: {
                                path: ''
                            }
                        },
                        volumeMount: {
                            readOnly: false
                        }
                    });

                    cleanOtherVolumeClasses('hostPath');
                } else if (item.id === 'v3io') { // see https://github.com/v3io/flex-fuse
                    lodash.defaultsDeep(ctrl.item, {
                        volume: {
                            flexVolume: {
                                driver: 'v3io/fuse',
                                options: {
                                    accessKey: '',
                                    container: '',
                                    subPath: ''
                                }
                            }
                        }
                    });

                    cleanOtherVolumeClasses('flexVolume');
                } else if (item.id === 'secret') {
                    lodash.defaultsDeep(ctrl.item.volume, {
                        secret: {
                            secretName: ''
                        }
                    });

                    cleanOtherVolumeClasses('secret');
                } else if (item.id === 'configMap') {
                    lodash.defaultsDeep(ctrl.item.volume, {
                        configMap: {
                            name: ''
                        }
                    });

                    cleanOtherVolumeClasses('configMap');
                } else if (item.id === 'persistentVolumeClaim') {
                    lodash.defaultsDeep(ctrl.item.volume, {
                        persistentVolumeClaim: {
                            claimName: ''
                        }
                    });

                    cleanOtherVolumeClasses('persistentVolumeClaim');
                }

                return;
            }

            ctrl.item = lodash.omit(ctrl.item, [
                'maxWorkers',
                'url',
                'secret',
                'annotations',
                'workerAvailabilityTimeoutMilliseconds',
                'username',
                'password',
                'workerAllocatorName'
            ]);

            ctrl.item.kind = item.id;
            ctrl.item.attributes = {};
            ctrl.item.ui.selectedClass = ctrl.selectedClass;

            lodash.forEach(item.fields, function (field) {
                lodash.set(ctrl.item, lodash.defaultTo(field.path, field.name), field.defaultValue);

                if (field.name === 'ingresses') {
                    ctrl.ingresses = [];
                } else if (field.name === 'eventHeaders') {
                    ctrl.eventHeaders = [];
                } else if (field.name === 'subscriptions') {
                    ctrl.subscriptions = [];
                } else if (field.name === 'kafka-topics') {
                    ctrl.topics = [{
                        name: '',
                        value: '',
                        ui: {
                            editModeActive: true,
                            isFormValid: false,
                            name: 'topic'
                        }
                    }];
                } else if (field.name === 'kafka-brokers') {
                    ctrl.brokers = [{
                        name: '',
                        value: '',
                        ui: {
                            editModeActive: true,
                            isFormValid: false,
                            name: 'broker'
                        }
                    }];
                } else if (field.name === 'annotations') {
                    ctrl.annotations = [];
                }
            });

            var nameDirty = ctrl.editItemForm.itemName.$dirty;
            var nameInvalid = ctrl.editItemForm.itemName.$invalid;

            // set form pristine to not validate new form fields after class changed
            ctrl.editItemForm.$setPristine();

            // if itemName was invalid before - set it dirty to show invalid message after class changed
            if (nameDirty && nameInvalid) {
                ctrl.editItemForm.itemName.$setDirty();
            }

            if (lodash.isFunction(ctrl.onSelectClassCallback)) {
                ctrl.onSelectClassCallback();
            }

            setAdvancedVisibility();
            updateChangesState();
            updateNameValidationRules();
        }

        /**
         * Sets new selected value from dropdown
         * @param {Object} item - The selected item from dropdown menu.
         * @param {string} field - The path of the model.
         */
        function onSelectDropdownValue(item, field) {
            lodash.set(ctrl.item, field, item.id);

            if (!item.typed && field === 'attributes.containerName') {
                ctrl.item.url = lodash.get(ConfigService,
                                           'nuclio.defaultFunctionConfig.attributes.spec.triggers.v3ioStream.url',
                                           '');
            }

            validateValues();
            updateChangesState();
        }

        /**
         * Changes value from number input
         * @param {number} item
         * @param {string} field
         */
        function numberInputCallback(item, field) {
            lodash.set(ctrl.item, field, item);

            validateValues();
            updateChangesState();
        }

        /**
         * On submit form handler
         * Hides the item create/edit mode
         * @param {MouseEvent|KeyboardEvent} event
         */
        function onSubmitForm(event) {
            ctrl.item.ui.expandable = !ctrl.editItemForm.$invalid;

            if (lodash.isUndefined(event.keyCode) || event.keyCode === EventHelperService.ENTER) {
                if (event.target !== $element[0] && $element.find(event.target).length === 0 &&
                    (ctrl.isVolumeType() || areElementsValidOnSubmit(event))) {
                    if (ctrl.editItemForm.$invalid) {
                        ctrl.item.ui.isFormValid = false;

                        if (ctrl.isAdvancedVisible) {
                            var isAdvancedInvalid = lodash.chain(ctrl.editItemForm.$error)
                                .values()
                                .flatten()
                                .some(function (error) {
                                    var field = lodash.find(ctrl.selectedClass.fields, ['name', error.$name.replace('item_', '')]);

                                    return lodash.get(field, 'isAdvanced', false);
                                })
                                .value();

                            if (isAdvancedInvalid) {
                                ctrl.isAdvancedCollapsed = false;
                            }
                        }

                        $rootScope.$broadcast('change-state-deploy-button', {
                            component: ctrl.item.ui.name,
                            isDisabled: true
                        });

                        ctrl.editItemForm.itemName.$setDirty();

                        // set form as submitted
                        ctrl.editItemForm.$setSubmitted();
                    } else {
                        $timeout(function () {
                            ctrl.item.ui.isFormValid = true;

                            if (!lodash.includes(lodash.get(event.target, 'parentElement.classList'), 'row-collapse')) {
                                ctrl.item.ui.editModeActive = false;
                            }

                            submitForm();
                        });
                    }
                }
            }
        }

        //
        // Private methods
        //

        /**
         * Checks if click wasn't on one of the elements from the list
         * @param {MouseEvent|KeyboardEvent} event - DOM event
         * @returns {boolean} Returns `true` if click wasn't on one of elements from the list
         */
        function areElementsValidOnSubmit(event) {
            var elementsForValidation = [
                'ncl-edit-item',
                '.actions-menu',
                '.single-action',
                '.ngdialog',
                '.mCSB_draggerContainer',
                '.create-trigger-button'
            ];

            return lodash.every(elementsForValidation, function (element) {
                return element === '.mCustomScrollBox' && event.target.closest('.row-collapse') ||
                    !event.target.closest(element);
            });
        }

        /**
         * Checks validation of function's variables
         * @param {string} variableName
         */
        function checkValidation(variableName) {
            lodash.forEach(ctrl[variableName], function (variable) {
                if (!variable.ui.isFormValid) {
                    $rootScope.$broadcast('change-state-deploy-button', {
                        component: variable.ui.name,
                        isDisabled: true
                    });
                }
            });
        }

        /**
         * Removes volume classes except `selectedClass`
         * @param {string} selectedClass
         */
        function cleanOtherVolumeClasses(selectedClass) {
            var removeVolume = lodash.unset.bind(null, ctrl.item.volume);

            lodash.chain(['hostPath', 'flexVolume', 'secret', 'configMap', 'persistentVolumeClaim'])
                .without(selectedClass)
                .forEach(removeVolume)
                .value();
        }

        /**
         * Broadcast's callback to deploy function
         * @param {Object} event - native `$rootScope.$broadcast` event object
         * @param {{event: MouseEvent|KeyboardEvent}} data - broadcast data with DOM event
         */
        function onFunctionDeploy(event, data) {
            ctrl.onSubmitForm(data.event);
        }

        /**
         * Sets visibility of the `Advanced` section
         */
        function setAdvancedVisibility() {
            ctrl.isAdvancedVisible = lodash.some(ctrl.selectedClass.fields, 'isAdvanced')
        }

        /**
         * Submits form
         */
        function submitForm() {
            lodash.forEach(ctrl.selectedClass.fields, function (field) {
                var path = lodash.defaultTo(field.path, field.name);
                var fieldValue = lodash.get(ctrl.item, path);
                if (field.pattern === 'number') {
                    var emptyValue = lodash.isNil(fieldValue) || fieldValue === '';
                    var numberValue = field.allowEmpty && emptyValue ? '' : Number(fieldValue);

                    lodash.set(ctrl.item, path, numberValue);
                }

                if (field.pattern === 'arrayStr') {
                    lodash.update(ctrl.item, path, ConverterService.toStringArray);
                }

                if (field.type === 'arrayInt' && !lodash.isArray(fieldValue)) {
                    lodash.update(ctrl.item, path, ConverterService.toNumberArray);
                }

                if (field.name === 'ingresses') {
                    var newIngresses = {};

                    lodash.forEach(ctrl.ingresses, function (ingress, index) {
                        newIngresses[index.toString()] = {
                            paths: ingress.value.split(',')
                        };

                        if (!lodash.isEmpty(ingress.name)) {
                            newIngresses[index.toString()].host = ingress.name;
                        }

                        if (!lodash.isEmpty(ingress.additionalValue)) {
                            newIngresses[index.toString()].secretName = ingress.additionalValue;
                        }
                    });

                    lodash.set(ctrl.item, path, newIngresses);
                }

                if (field.name === 'eventHeaders') {
                    var newEventHeader = {};

                    lodash.forEach(ctrl.eventHeaders, function (headers) {
                        newEventHeader[headers.name] = headers.value;
                    });

                    lodash.set(ctrl.item, 'attributes.event.headers', newEventHeader);
                }
            });

            if (ctrl.isHttpTrigger()) {
                updateAnnotations();
            }

            if (ctrl.isMqttTrigger()) {
                updateSubscriptions();
            }

            if (ctrl.isKafkaTrigger()) {
                updateTopics();
                updateBrokers();
            }

            $rootScope.$broadcast('change-state-deploy-button', {
                component: ctrl.item.ui.name,
                isDisabled: false
            });

            ctrl.onSubmitCallback({ item: ctrl.item });
        }

        /**
         * Submits the form on clicking on the document outside of this element.
         * @param {MouseEvent} event - The `click` event.
         */
        function submitOnClick(event) {
            if (!lodash.isNil(ctrl.editItemForm)) {
                onSubmitForm(event);
            }
        }

        /**
         * Updates annotations fields
         */
        function updateAnnotations() {
            var newAnnotations = {};

            lodash.forEach(ctrl.annotations, function (label) {
                newAnnotations[label.name] = label.value;
            });

            lodash.set(ctrl.item, 'annotations', newAnnotations);
        }

        /**
         * Updates `ctrl.item.ui.changed` property when user updates trigger
         */
        function updateChangesState() {
            var keyValueIsChanged = !lodash.isEqual(ctrl.annotations, ctrl.annotationsInitial)     ||
                                    !lodash.isEqual(ctrl.ingresses, ctrl.ingressesInitial)         ||
                                    !lodash.isEqual(ctrl.eventHeaders, ctrl.eventHeadersInitial)   ||
                                    !lodash.isEqual(ctrl.subscriptions, ctrl.subscriptionsInitial) ||
                                    !lodash.isEqual(ctrl.topics, ctrl.topicsInitial)               ||
                                    !lodash.isEqual(ctrl.brokers, ctrl.brokersInitial);
            var currentChangesState = lodash.get(ctrl.item, 'ui.changed', false);

            ctrl.item.ui.changed = !lodash.chain(ctrl.item)
                .omit(['$$hashKey', 'ui'])
                .isEqual(itemInitial)
                .value() || keyValueIsChanged;


            if (currentChangesState !== ctrl.item.ui.changed) {
                $rootScope.$broadcast('edit-item-has-been-changed', {});
            }
        }

        /**
         * Updates subscriptions fields
         */
        function updateSubscriptions() {
            var newSubscriptions = lodash.map(ctrl.subscriptions, function (subscription) {
                return {
                    topic: subscription.name,
                    qos: Number(subscription.value)
                };
            });

            lodash.set(ctrl.item, 'attributes.subscriptions', newSubscriptions);
        }

        /**
         * Updates topics fields
         */
        function updateTopics() {
            var newTopics = lodash.map(ctrl.topics, 'value');

            lodash.set(ctrl.item, 'attributes.topics', newTopics);
        }

        /**
         * Updates Brokers fields
         */
        function updateBrokers() {
            var newBrokers = lodash.map(ctrl.brokers, 'value');

            lodash.set(ctrl.item, 'attributes.brokers', newBrokers);
        }

        /**
         * Validate interval and schedule fields
         */
        /* eslint complexity: ["error", 11] */
        function validateValues() {
            if (ctrl.item.kind === 'cron') {
                var scheduleField = lodash.find(ctrl.selectedClass.fields, {name: 'schedule'});
                var intervalInputIsFilled = !lodash.isEmpty(ctrl.editItemForm.item_interval.$viewValue);
                var scheduleInputIsFilled = !lodash.isEmpty(ctrl.editItemForm.item_schedule.$viewValue);
                var bothFilled = intervalInputIsFilled && scheduleInputIsFilled;

                scheduleField.allowEmpty = intervalInputIsFilled;
                lodash.assign(scheduleField, {
                    moreInfoIconType: bothFilled ? 'warn' : 'info',
                    moreInfoOpen: bothFilled
                });
                ctrl.editItemForm.item_interval.$validate();
                if (intervalInputIsFilled) {
                    ctrl.editItemForm.item_interval.$setDirty();
                }
            } else if (ctrl.item.kind === 'rabbit-mq') {
                var queueName = lodash.find(ctrl.selectedClass.fields, {name: 'queueName'});
                var topics = lodash.find(ctrl.selectedClass.fields, {name: 'topics'});
                var queueNameIsFilled = !lodash.isEmpty(ctrl.editItemForm.item_queueName.$viewValue);
                var topicsIsFilled = !lodash.isEmpty(ctrl.editItemForm.item_topics.$viewValue);

                // Queue Name and Topics cannot be both empty at the same time
                // at least one of them should be filled
                // if one of them is filled, the other is allowed to be empty
                queueName.allowEmpty = topicsIsFilled;
                topics.allowEmpty = queueNameIsFilled;

                // update validity: if empty is not allowed and value is currently empty - mark invalid, otherwise valid
                ctrl.editItemForm.item_queueName.$setValidity('text', queueName.allowEmpty || queueNameIsFilled);
                ctrl.editItemForm.item_topics.$setValidity('text', topics.allowEmpty || topicsIsFilled);
            } else if (ctrl.item.kind === 'kafka-cluster') {
                ctrl.item.attributes.sasl.enable = !lodash.isEmpty(ctrl.item.attributes.sasl.user) &&
                    !lodash.isEmpty(ctrl.item.attributes.sasl.password);
            }
        }
    }
}());
