/* eslint max-statements: ["error", 100] */
(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclEditItem', {
            bindings: {
                item: '<',
                type: '@',
                onSubmitCallback: '&',
                defaultFields: '<?'
            },
            templateUrl: 'nuclio/common/components/edit-item/edit-item.tpl.html',
            controller: NclEditItemController
        });

    function NclEditItemController($document, $element, $rootScope, $scope, $timeout, lodash, ConverterService,
                                   FunctionsService, FormValidationService, PreventDropdownCutOffService) {
        var ctrl = this;

        ctrl.classList = [];
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

        ctrl.$onInit = onInit;
        ctrl.$postLink = postLink;
        ctrl.$onDestroy = onDestroy;

        ctrl.numberValidationPattern = /^\d+$/;
        ctrl.arrayIntValidationPattern = /^(\d+[-,]?)*\d$/;
        ctrl.arrayStrValidationPattern = /^.{1,128}$/;
        ctrl.intervalValidationPattern = /^\d+(ms|[smh])$/;
        ctrl.stringValidationPattern = /^.{1,128}$/;
        ctrl.subscriptionQoSValidationPattern = /^[0-2]$/;
        ctrl.placeholder = '';

        ctrl.isShowFieldError = FormValidationService.isShowFieldError;
        ctrl.isShowFieldInvalidState = FormValidationService.isShowFieldInvalidState;
        ctrl.isNil = lodash.isNil;

        ctrl.addNewIngress = addNewIngress;
        ctrl.addNewAnnotation = addNewAnnotation;
        ctrl.addNewSubscription = addNewSubscription;
        ctrl.addNewTopic = addNewTopic;
        ctrl.addNewBroker = addNewBroker;
        ctrl.addNewEventHeader = addNewEventHeader;
        ctrl.convertFromCamelCase = convertFromCamelCase;
        ctrl.getAttrValue = getAttrValue;
        ctrl.getValidationPattern = getValidationPattern;
        ctrl.getInputValue = getInputValue;
        ctrl.handleIngressAction = handleIngressAction;
        ctrl.handleAnnotationAction = handleAnnotationAction;
        ctrl.handleSubscriptionAction = handleSubscriptionAction;
        ctrl.handleTopicAction = handleTopicAction;
        ctrl.handleBrokerAction = handleBrokerAction;
        ctrl.handleEventHeaderAction = handleEventHeaderAction;
        ctrl.inputValueCallback = inputValueCallback;
        ctrl.isClassSelected = isClassSelected;
        ctrl.isHttpTrigger = isHttpTrigger;
        ctrl.isKafkaTrigger = isKafkaTrigger;
        ctrl.isMQTTTrigger = isMQTTTrigger;
        ctrl.isCronTrigger = isCronTrigger;
        ctrl.isTriggerType = isTriggerType;
        ctrl.isVolumeType = isVolumeType;
        ctrl.onChangeData = onChangeData;
        ctrl.onClearButtonClick = onClearButtonClick;
        ctrl.onSubmitForm = onSubmitForm;
        ctrl.onSelectClass = onSelectClass;
        ctrl.onSelectDropdownValue = onSelectDropdownValue;
        ctrl.numberInputCallback = numberInputCallback;
        ctrl.getPlaceholderText = getPlaceholderText;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        // eslint-disable-next-line
        function onInit() {
            ctrl.placeholder = getPlaceholder();

            ctrl.classList = FunctionsService.getClassesList(ctrl.type);
            if (!lodash.isEmpty(ctrl.item.kind)) {
                ctrl.selectedClass = lodash.find(ctrl.classList, ['id', ctrl.item.kind]);
                ctrl.item.ui.className = ctrl.selectedClass.name;

                $timeout(validateValues);
            }

            if (ctrl.isTriggerType()) {
                lodash.defaults(ctrl.item, {
                    workerAllocatorName: ''
                });
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
                if (lodash.isNil(ctrl.item.workerAvailabilityTimeoutMilliseconds)) {
                    ctrl.item.workerAvailabilityTimeoutMilliseconds = 0;
                }

                ctrl.ingresses = lodash.chain(ctrl.item.attributes.ingresses)
                    .defaultTo([])
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
            }

            if (ctrl.isTriggerType() && ctrl.isKafkaTrigger()) {
                lodash.defaultsDeep(ctrl.item.attributes, {
                    initialOffset: 'latest',
                    sasl: {
                        enable: false,
                        user: '',
                        password: ''
                    }
                });

                ctrl.topics = lodash.chain(ctrl.item.attributes.topics)
                    .defaultTo([])
                    .map(function (value, key) {
                        return {
                            name: key,
                            value: value,
                            ui: {
                                editModeActive: false,
                                isFormValid: true,
                                name: 'topic'
                            }
                        };
                    })
                    .value();

                ctrl.brokers = lodash.chain(ctrl.item.attributes.brokers)
                    .defaultTo([])
                    .map(function (value, key) {
                        return {
                            name: key,
                            value: value,
                            ui: {
                                editModeActive: false,
                                isFormValid: true,
                                name: 'broker'
                            }
                        };
                    })
                    .value();
            }

            if (ctrl.isTriggerType() && isV3ioTrigger()) {
                lodash.defaults(ctrl.item, {
                    username: '',
                    password: ''
                });
            }

            if (ctrl.isTriggerType() && ctrl.isMQTTTrigger()) {
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
            }

            if (ctrl.isTriggerType() && ctrl.isCronTrigger()) {
                lodash.defaultsDeep(ctrl.item.attributes, {
                    event: {
                        body: '',
                        headers: {}
                    }
                });

                ctrl.eventHeaders = lodash.chain(lodash.get(ctrl.item, 'attributes.event.headers'))
                    .defaultTo([])
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
            }

            $scope.$on('deploy-function-version', ctrl.onSubmitForm);
        }

        /**
         * Post linking method
         */
        function postLink() {
            $document.on('click', function (event) {
                if (!lodash.isNil(ctrl.editItemForm)) {
                    onSubmitForm(event);
                }
            });

            // Bind DOM-related preventDropdownCutOff method to component's controller
            PreventDropdownCutOffService.preventDropdownCutOff($element, '.three-dot-menu');
        }

        /**
         * Destructor
         */
        function onDestroy() {
            $document.off('click', onSubmitForm);
        }

        //
        // Public methods
        //

        /**
         * Converts attribute names in class list from camel case
         * @param {string} str - string which must be converted
         */
        function convertFromCamelCase(str) {
            return str.replace(/([a-z])([A-Z])/g, '$1 $2');
        }

        /**
         * Adds new ingress
         */
        function addNewIngress(event) {
            $timeout(function () {
                if (ctrl.ingresses.length < 1 || lodash.chain(ctrl.ingresses).last().get('ui.isFormValid', true).value()) {
                    ctrl.ingresses.push({
                        name: lodash.get(ctrl.defaultFields, 'ingressHost', ''),
                        value: '',
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
         */
        function addNewAnnotation(event) {
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
         */
        function addNewSubscription(event) {
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
         */
        function addNewTopic(event) {
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
         */
        function addNewBroker(event) {
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
         * @param {Object} event - native event object
         */
        function addNewEventHeader(event) {
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
         * Checks validation of function`s variables
         */
        function checkValidation(variableName) {
            lodash.forEach(ctrl[variableName], function (variable) {
                if (!variable.ui.isFormValid) {
                    $rootScope.$broadcast('change-state-deploy-button', { component: variable.ui.name, isDisabled: true });
                }
            });
        }

        /**
         * Returns the value of an attribute
         * @param {string} attrName
         * @returns {string}
         */
        function getAttrValue(attrName) {
            return lodash.get(ctrl.item, 'attributes.' + attrName);
        }

        /**
         * Gets validation patterns depends on type of attribute
         * @param {string} pattern
         * @returns {RegExp}
         */
        function getValidationPattern(pattern) {
            return lodash.get(ctrl, pattern + 'ValidationPattern', ctrl.stringValidationPattern);
        }

        /**
         * Returns value for Name input.
         * Value could has different path depends on item type.
         * @returns {string}
         */
        function getInputValue() {
            return ctrl.type === 'volume' ? ctrl.item.volume.name : ctrl.item.name;
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
        }

        /**
         * Determine whether the item class was selected
         * @returns {boolean}
         */
        function isClassSelected() {
            return !lodash.isEmpty(ctrl.selectedClass);
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
        function isMQTTTrigger() {
            return ctrl.selectedClass.id === 'mqtt';
        }

        /**
         * Changes data of specific variable
         * @param {Object} variable
         * @param {number} index
         */
        function onChangeData(variable, index) {
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
        }

        /**
         * Set empty string to `schedule` field of `cron` trigger
         */
        function onClearButtonClick() {
            lodash.set(ctrl.item, 'attributes.schedule', '');

            $timeout(function () {
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
                    lodash.defaultsDeep(ctrl.item.volume, {
                        hostPath: {
                            path: ''
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

            ctrl.item = lodash.omit(ctrl.item, ['maxWorkers', 'url', 'secret', 'annotations', 'workerAvailabilityTimeoutMilliseconds', 'username', 'password', 'workerAllocatorName']);

            var nameDirty = ctrl.editItemForm.itemName.$dirty;
            var nameInvalid = ctrl.editItemForm.itemName.$invalid;

            ctrl.item.kind = item.id;
            ctrl.item.attributes = {};
            ctrl.item.ui.className = ctrl.selectedClass.name;

            if (!lodash.isNil(item.url)) {
                ctrl.item.url = '';
            }

            if (!lodash.isNil(item.maxWorkers)) {
                ctrl.item.maxWorkers = '';
            }

            if (!lodash.isNil(item.secret)) {
                ctrl.item.secret = '';
            }

            if (!lodash.isNil(item.annotations)) {
                ctrl.annotations = [];
            }

            if (!lodash.isNil(item.workerAvailabilityTimeoutMilliseconds)) {
                ctrl.item.workerAvailabilityTimeoutMilliseconds = item.workerAvailabilityTimeoutMilliseconds.defaultValue;
            }

            if (!lodash.isNil(item.username)) {
                ctrl.item.username = '';
            }

            if (!lodash.isNil(item.password)) {
                ctrl.item.password = '';
            }

            if (!lodash.isNil(item.workerAvailabilityTimeoutMilliseconds)) {
                ctrl.item.workerAvailabilityTimeoutMilliseconds = item.workerAvailabilityTimeoutMilliseconds.defaultValue;
            }

            lodash.each(item.attributes, function (attribute) {
                if (attribute.name === 'ingresses') {
                    ctrl.ingresses = [];
                } else if (attribute.name === 'sasl') {
                    ctrl.item.attributes.sasl = {};

                    lodash.forEach(attribute.values, function (value, key) {
                        lodash.set(ctrl.item.attributes, ['sasl', key], value.defaultValue);
                    });
                } else if (attribute.name === 'event') {
                    ctrl.eventHeaders = [];
                    ctrl.item.attributes.event = {};

                    lodash.forEach(attribute.values, function (value, key) {
                        lodash.set(ctrl.item.attributes, ['event', key], value.defaultValue);
                    });
                } else if (attribute.name === 'subscriptions') {
                    ctrl.subscriptions = [];
                } else if (attribute.name === 'kafka-topics') {
                    ctrl.topics = [];
                } else if (attribute.name === 'kafka-brokers') {
                    ctrl.brokers = [];
                } else {
                    lodash.set(ctrl.item.attributes, attribute.name, lodash.get(attribute, 'defaultValue', ''));
                }
            });

            // set form pristine to not validate new form fields
            ctrl.editItemForm.$setPristine();

            // if itemName is invalid - set it dirty to show validation message
            if (nameDirty && nameInvalid) {
                ctrl.editItemForm.itemName.$setDirty();
            }
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
         * Sets new selected value from dropdown
         * @param {Object} item
         * @param {string} field
         */
        function onSelectDropdownValue(item, field) {
            lodash.set(ctrl.item, field, item.id);
        }

        /**
         * Changes value from number input
         * @param {number} item
         * @param {string} field
         */
        function numberInputCallback(item, field) {
            lodash.set(ctrl.item, field, item);
        }

        /**
         * On submit form handler
         * Hides the item create/edit mode
         * @param {MouseEvent} event
         */
        function onSubmitForm(event) {
            ctrl.item.ui.expandable = !ctrl.editItemForm.$invalid;

            if (angular.isUndefined(event.keyCode) || event.keyCode === 13) {
                if (event.target !== $element[0] && $element.find(event.target).length === 0 &&
                    !event.target.closest('ncl-edit-item') && !event.target.closest('.ngdialog')) {
                    if (ctrl.editItemForm.$invalid) {
                        ctrl.item.ui.isFormValid = false;

                        $rootScope.$broadcast('change-state-deploy-button', { component: ctrl.item.ui.name, isDisabled: true });

                        ctrl.editItemForm.itemName.$setDirty();

                        // set form as submitted
                        ctrl.editItemForm.$setSubmitted();
                    } else {
                        $timeout(function () {
                            ctrl.item.ui.isFormValid = true;

                            if (!lodash.includes(event.target.parentElement.classList, 'row-collapse')) {
                                ctrl.item.ui.editModeActive = false;
                            }

                            lodash.forEach(ctrl.selectedClass.attributes, function (attribute) {
                                if (attribute.pattern === 'number') {
                                    var emptyValue = lodash.isNil(ctrl.item.attributes[attribute.name]) || ctrl.item.attributes[attribute.name] === '';
                                    var numberAttribute = attribute.allowEmpty && emptyValue ? '' :
                                        Number(ctrl.item.attributes[attribute.name]);

                                    lodash.set(ctrl.item, 'attributes[' + attribute.name + ']', numberAttribute);
                                }

                                if (attribute.pattern === 'arrayStr') {
                                    lodash.update(ctrl.item.attributes, attribute.name, ConverterService.toStringArray);
                                }

                                if (attribute.pattern === 'arrayInt' && !lodash.isArray(ctrl.item.attributes[attribute.name])) {
                                    ctrl.item.attributes[attribute.name] = ConverterService.toNumberArray(ctrl.item.attributes[attribute.name]);
                                }

                                if (attribute.name === 'ingresses') {
                                    var newIngresses = {};

                                    lodash.forEach(ctrl.ingresses, function (ingress, key) {
                                        newIngresses[key.toString()] = {
                                            paths: ingress.value.split(',')
                                        };

                                        if (!lodash.isEmpty(ingress.name)) {
                                            newIngresses[key.toString()].host = ingress.name;
                                        }

                                        if (!lodash.isEmpty(ingress.additionalValue)) {
                                            newIngresses[key.toString()].secretName = ingress.additionalValue;
                                        }
                                    });

                                    ctrl.item.attributes[attribute.name] = newIngresses;
                                }

                                if (attribute.name === 'event') {
                                    var newEventHeader = {};

                                    lodash.forEach(ctrl.eventHeaders, function (headers) {
                                        newEventHeader[headers.name] = headers.value;
                                    });

                                    lodash.set(ctrl.item, 'attributes.event.headers', newEventHeader);
                                }
                            });

                            if (ctrl.isHttpTrigger()) {
                                updateAnnotaions();
                            }

                            if (ctrl.isMQTTTrigger()) {
                                updateSubscriptions();
                            }

                            if (ctrl.isKafkaTrigger()) {
                                updateTopics();
                                updateBrokers();
                            }

                            $rootScope.$broadcast('change-state-deploy-button', { component: ctrl.item.ui.name, isDisabled: false });

                            ctrl.onSubmitCallback({ item: ctrl.item });
                        });
                    }
                }
            }
        }

        /**
         * Updates annotations fields
         */
        function updateAnnotaions() {
            var newAnnotations = {};

            lodash.forEach(ctrl.annotations, function (label) {
                newAnnotations[label.name] = label.value;
            });

            lodash.set(ctrl.item, 'annotations', newAnnotations);
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
            var newTopics = lodash.map(ctrl.topics, function (topic) {
                return topic.value;
            });

            lodash.set(ctrl.item, 'attributes.topics', newTopics);
        }

        /**
         * Updates Brokers fields
         */
        function updateBrokers() {
            var newBrokers = lodash.map(ctrl.brokers, function (broker) {
                return broker.value;
            });

            lodash.set(ctrl.item, 'attributes.brokers', newBrokers);
        }

        /**
         * Return placeholder text for input
         * @param {Object} attribute
         */
        function getPlaceholderText(attribute) {
            var defaultPlaceholder = 'Enter ' + ctrl.convertFromCamelCase(attribute.name).toLowerCase() + '...';
            return lodash.defaultTo(attribute.placeholder, defaultPlaceholder);
        }

        //
        // Private methods
        //

        /**
         * Validate interval and schedule fields
         */
        function validateValues() {
            if (ctrl.item.kind === 'cron') {
                var scheduleAttribute = lodash.find(ctrl.selectedClass.attributes, { name: 'schedule' });
                var intervalAttribute = lodash.find(ctrl.selectedClass.attributes, { name: 'interval' });
                var intervalInputIsFilled = !lodash.isEmpty(ctrl.editItemForm.item_interval.$viewValue);
                var scheduleInputIsFilled = !lodash.isEmpty(ctrl.editItemForm.item_schedule.$viewValue);

                if (intervalInputIsFilled === scheduleInputIsFilled) {

                    // if interval and schedule fields are filled or they are empty - makes these fields invalid
                    ctrl.editItemForm.item_interval.$setValidity('text', false);
                    ctrl.editItemForm.item_schedule.$setValidity('text', false);
                } else {

                    // if interval or schedule filed is filled - makes these fields valid
                    ctrl.editItemForm.item_interval.$setValidity('text', true);
                    ctrl.editItemForm.item_schedule.$setValidity('text', true);
                    scheduleAttribute.allowEmpty = intervalInputIsFilled;
                    intervalAttribute.allowEmpty = scheduleInputIsFilled;
                }
            } else if (ctrl.item.kind === 'rabbit-mq') {
                var queueName = lodash.find(ctrl.selectedClass.attributes, { name: 'queueName' });
                var topics = lodash.find(ctrl.selectedClass.attributes, { name: 'topics' });
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
            }
        }

        /**
         * Returns placeholder value depends on incoming component type
         * @returns {string}
         */
        function getPlaceholder() {
            var placeholders = {
                volume: 'Select type',
                default: 'Select class'
            };

            return lodash.get(placeholders, ctrl.type, placeholders.default);
        }

        /**
         * Checks for V3IO triggers
         * @returns {boolean}
         */
        function isV3ioTrigger() {
            return ctrl.selectedClass.id === 'v3ioStream';
        }
    }
}());
