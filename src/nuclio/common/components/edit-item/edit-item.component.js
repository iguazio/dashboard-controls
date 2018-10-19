/* eslint max-statements: ["error", 100] */
(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclEditItem', {
            bindings: {
                item: '<',
                type: '@',
                onSubmitCallback: '&'
            },
            templateUrl: 'nuclio/common/components/edit-item/edit-item.tpl.html',
            controller: NclEditItemController
        });

    function NclEditItemController($document, $element, $rootScope, $scope, $timeout, lodash, ConverterService,
                                   FunctionsService, FormValidationService, PreventDropdownCutOffService) {
        var ctrl = this;

        ctrl.classList = [];
        ctrl.selectedClass = {};

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
        ctrl.stringValidationPattern = /^.{1,128}$/;
        ctrl.placeholder = '';

        ctrl.isShowFieldError = FormValidationService.isShowFieldError;
        ctrl.isShowFieldInvalidState = FormValidationService.isShowFieldInvalidState;
        ctrl.isNil = lodash.isNil;

        ctrl.addNewIngress = addNewIngress;
        ctrl.addNewAnnotation = addNewAnnotation;
        ctrl.convertFromCamelCase = convertFromCamelCase;
        ctrl.getAttrValue = getAttrValue;
        ctrl.getValidationPattern = getValidationPattern;
        ctrl.getInputValue = getInputValue;
        ctrl.handleIngressAction = handleIngressAction;
        ctrl.handleAnnotationAction = handleAnnotationAction;
        ctrl.inputValueCallback = inputValueCallback;
        ctrl.isClassSelected = isClassSelected;
        ctrl.isScrollNeeded = isScrollNeeded;
        ctrl.isHttpTrigger = isHttpTrigger;
        ctrl.isVolumeType = isVolumeType;
        ctrl.onChangeData = onChangeData;
        ctrl.onSubmitForm = onSubmitForm;
        ctrl.onSelectClass = onSelectClass;
        ctrl.onSelectDropdownValue = onSelectDropdownValue;
        ctrl.numberInputCallback = numberInputCallback;

        //
        // Hook methods
        //

        /**
         * Converts attribute names in class list from camel case
         * @param {String} string whitch must be converted
         */
        function convertFromCamelCase(str) {
            return str.replace(/([a-z])([A-Z])/g, '$1 $2');
        }

        /**
         * Initialization method
         */
        // eslint-disable-next-line
        function onInit() {
            ctrl.placeholder = getPlaceholder();

            $document.on('click', function (event) {
                if (!lodash.isNil(ctrl.editItemForm)) {
                    onSubmitForm(event);
                }
            });

            ctrl.classList = FunctionsService.getClassesList(ctrl.type);
            if (!lodash.isEmpty(ctrl.item.kind)) {
                ctrl.selectedClass = lodash.find(ctrl.classList, ['id', ctrl.item.kind]);
                ctrl.item.ui.className = ctrl.selectedClass.name;

                $timeout(validateCronClassValues);
            }

            lodash.defaults(ctrl.item, {
                workerAllocatorName: ''
            });

            if (ctrl.isVolumeType()) {
                var selectedTypeName = !lodash.isNil(ctrl.item.volume.hostPath) ? 'hostPath' : !ctrl.isNil(ctrl.item.volume.flexVolume) ? 'v3io' : null;

                if (!lodash.isNil(selectedTypeName)) {
                    ctrl.selectedClass = lodash.find(ctrl.classList, ['id', selectedTypeName]);
                }
            }

            if (!ctrl.isVolumeType() && ctrl.isHttpTrigger()) {
                if (lodash.isNil(ctrl.item.workerAvailabilityTimeoutMilliseconds)) {
                    ctrl.item.workerAvailabilityTimeoutMilliseconds = 0;
                }

                ctrl.ingresses = lodash.chain(ctrl.item.attributes.ingresses)
                    .defaultTo([])
                    .map(function (ingress) {
                        return {
                            name: ingress.host,
                            value: ingress.paths.join(','),
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

            if (!ctrl.isVolumeType() && isKafkaTrigger()) {
                lodash.defaultsDeep(ctrl.item.attributes, {
                    initialOffset: 'latest',
                    sasl: {
                        enabled: false,
                        user: '',
                        password: ''
                    }
                });
            }

            if (!ctrl.isVolumeType() && isv3ioTrigger()) {
                lodash.defaults(ctrl.item, {
                    username: '',
                    password: ''
                });
            }

            $scope.$on('deploy-function-version', ctrl.onSubmitForm);
        }

        /**
         * Post linking method
         */
        function postLink() {

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
         * Adds new ingress
         */
        function addNewIngress(event) {
            $timeout(function () {
                if (ctrl.ingresses.length < 1 || lodash.chain(ctrl.ingresses).last().get('ui.isFormValid', true).value()) {
                    ctrl.ingresses.push({
                        name: '',
                        value: '',
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
         * Checks validation of function`s variables
         */
        function checkValidation(variableName) {
            lodash.forEach(ctrl[variableName], function (variable) {
                if (!variable.ui.isFormValid) {
                    $rootScope.$broadcast('change-state-deploy-button', {component: variable.ui.name, isDisabled: true});
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
            return pattern === 'number'   ? ctrl.numberValidationPattern   :
                   pattern === 'arrayInt' ? ctrl.arrayIntValidationPattern :
                   pattern === 'arrayStr' ? ctrl.arrayStrValidationPattern : ctrl.stringValidationPattern;
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
         * Determine whether the item class was selected
         * @returns {boolean}
         */
        function isClassSelected() {
            return !lodash.isEmpty(ctrl.selectedClass);
        }

        /**
         * Returns true if scrollbar is necessary
         * @param {string} itemsType - items where scroll is needed (e.g. 'ingresses', 'annotations')
         * @returns {boolean}
         */
        function isScrollNeeded(itemsType) {
            return ctrl[itemsType].length > 10;
        }

        /**
         * Update data callback
         * @param {string} newData
         * @param {string} field
         */
        function inputValueCallback(newData, field) {
            if (ctrl.isVolumeType()) {
                if (field === 'name') {
                    lodash.set(ctrl.item, 'volumeMount.name', newData);
                    lodash.set(ctrl.item, 'volume.name', newData);
                } else {
                    lodash.set(ctrl.item, field, newData);
                }
            } else {
                lodash.set(ctrl.item, field, newData);
            }

            validateCronClassValues();
        }

        /**
         * Checks for `http` triggers
         * @returns {boolean}
         */
        function isHttpTrigger() {
            return ctrl.selectedClass.id === 'http';
        }

        /**
         * Checks is input have to be visible for sperific item type
         * @param {string} name - input name
         * @returns {boolean}
         */
        function isVolumeType(name) {
            return ctrl.type === 'volume';
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
            }
        }

        /**
         * Update item class callback
         * @param {Object} item - item class\kind
         */
        // eslint-disable-next-line
        function onSelectClass(item) {
            ctrl.selectedClass = item;

            if (ctrl.isVolumeType()) {
                if (lodash.isNil(ctrl.item.volumeMount.mountPath)) {
                    ctrl.item.volumeMount.mountPath = '';
                }

                if (item.id === 'hostPath' && lodash.isNil(ctrl.item.volume.hostPath)) {

                    // delete values from type 'v3io'
                    delete ctrl.item.volume.flexVolume;

                    lodash.set(ctrl.item, 'volume.hostPath.path', '');
                }

                if (item.id === 'v3io' && lodash.isNil(ctrl.item.volume.flexVolume)) {

                    // delete values from type 'hostPath'
                    delete ctrl.item.volume.hostPath;

                    ctrl.item.volume.flexVolume = {
                        driver: 'v3io/fuse',
                        secretRef: {
                            name: ''
                        }
                    };
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

        //
        // Private methods
        //

        /**
         * On submit form handler
         * Hides the item create/edit mode
         * @param {MouseEvent} event
         */
        function onSubmitForm(event) {
            ctrl.item.ui.expandable = !ctrl.editItemForm.$invalid;

            if (angular.isUndefined(event.keyCode) || event.keyCode === '13') {
                if (event.target !== $element[0] && $element.find(event.target).length === 0 && !event.target.closest('ncl-edit-item')) {
                    if (ctrl.editItemForm.$invalid) {
                        ctrl.item.ui.isFormValid = false;

                        $rootScope.$broadcast('change-state-deploy-button', {component: ctrl.item.ui.name, isDisabled: true});

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
                                    var numberAttribute = attribute.allowEmpty && emptyValue ?
                                        '' : Number(ctrl.item.attributes[attribute.name]);

                                    lodash.set(ctrl.item, 'attributes[' + attribute.name + ']', numberAttribute);
                                }

                                if (attribute.pattern === 'arrayStr' && !lodash.isArray(ctrl.item.attributes[attribute.name])) {
                                    ctrl.item.attributes[attribute.name] = ctrl.item.attributes[attribute.name].split(',');
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
                                    });

                                    ctrl.item.attributes[attribute.name] = newIngresses;
                                }
                            });

                            if (ctrl.item.kind === 'http') {
                                updateAnnotaions();
                            }

                            $rootScope.$broadcast('change-state-deploy-button', {component: ctrl.item.ui.name, isDisabled: false});

                            ctrl.onSubmitCallback({item: ctrl.item});
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
         * Validate interval and schedule fields
         */
        function validateCronClassValues() {
            if (ctrl.item.kind === 'cron') {
                var scheduleAttribute = lodash.find(ctrl.selectedClass.attributes, {'name': 'schedule'});
                var intervalAttribute = lodash.find(ctrl.selectedClass.attributes, {'name': 'interval'});
                var intervalInputIsFilled = !lodash.isEmpty(ctrl.editItemForm.item_interval.$viewValue);
                var scheduleInputIsFilled = !lodash.isEmpty(ctrl.editItemForm.item_schedule.$viewValue);

                if (intervalInputIsFilled === scheduleInputIsFilled) {

                    // if interval and schedule fileds are filled or they are empty - makes these fields invalid
                    ctrl.editItemForm.item_interval.$setValidity('text', false);
                    ctrl.editItemForm.item_schedule.$setValidity('text', false);
                } else {

                    // if interval or schedule filed is filled - makes these fields valid
                    ctrl.editItemForm.item_interval.$setValidity('text', true);
                    ctrl.editItemForm.item_schedule.$setValidity('text', true);
                    scheduleAttribute.allowEmpty = intervalInputIsFilled;
                    intervalAttribute.allowEmpty = scheduleInputIsFilled;
                }
            }
        }

        /**
         * Returns placeholder value depends on incoming component type
         * @returns {string}
         */
        function getPlaceholder() {
            var placeholders = {
                volume: 'Please select a volume',
                default: 'Please select a class'
            };

            return lodash.get(placeholders, ctrl.type, placeholders.default);
        }

        /**
         * Checks for `kafka` triggers
         * @returns {boolean}
         */
        function isKafkaTrigger() {
            return ctrl.selectedClass.id === 'kafka-cluster';
        }

        /**
         * Checks for `kafka` triggers
         * @returns {boolean}
         */
        function isv3ioTrigger() {
            return ctrl.selectedClass.id === 'v3ioStream';
        }
    }
}());
