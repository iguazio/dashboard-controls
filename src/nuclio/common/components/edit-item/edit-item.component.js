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

    function NclEditItemController($document, $element, $rootScope, $scope, $timeout, lodash, ConverterService, FunctionsService, FormValidationService,
                                   PreventDropdownCutOffService) {
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

        ctrl.isShowFieldError = FormValidationService.isShowFieldError;
        ctrl.isShowFieldInvalidState = FormValidationService.isShowFieldInvalidState;
        ctrl.isNil = lodash.isNil;

        ctrl.addNewIngress = addNewIngress;
        ctrl.convertFromCamelCase = convertFromCamelCase;
        ctrl.getAttrValue = getAttrValue;
        ctrl.getValidationPattern = getValidationPattern;
        ctrl.handleAction = handleAction;
        ctrl.inputValueCallback = inputValueCallback;
        ctrl.isClassSelected = isClassSelected;
        ctrl.isScrollNeeded = isScrollNeeded;
        ctrl.isHttpTrigger = isHttpTrigger;
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
        function onInit() {
            $scope.$on('deploy-function-version', ctrl.onSubmitForm);
            $document.on('click', function (event) {
                if (!lodash.isNil(ctrl.editItemForm)) {
                    onSubmitForm(event);
                }
            });

            ctrl.classList  = FunctionsService.getClassesList(ctrl.type);
            if (!lodash.isEmpty(ctrl.item.kind)) {
                ctrl.selectedClass = lodash.find(ctrl.classList, ['id', ctrl.item.kind]);
                ctrl.item.ui.className = ctrl.selectedClass.name;

                $timeout(function () {
                    validateCronClassValues();
                })
            }

            if (isHttpTrigger()) {
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
            }
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
         * Adds new variable
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
         * Updates function`s variables
         */
        function updateIngresses() {
            lodash.forEach(ctrl.ingresses, function (ingress) {
                if (!ingress.ui.isFormValid) {
                    $rootScope.$broadcast('change-state-deploy-button', {component: ingress.ui.name, isDisabled: true});
                }
            });
        }

        /**
         * Returns the value of an attribute
         * @param {string} newData
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
         * Handler on specific action type
         * @param {string} actionType
         * @param {number} index - index of variable in array
         */
        function handleAction(actionType, index) {
            if (actionType === 'delete') {
                ctrl.ingresses.splice(index, 1);

                updateIngresses();
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
         * @return {boolean}
         */
        function isScrollNeeded() {
            return ctrl.ingresses.length > 10;
        }

        /**
         * Update data callback
         * @param {string} newData
         * @param {string} field
         */
        function inputValueCallback(newData, field) {
            lodash.set(ctrl.item, field, newData);

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
         * Changes data of specific variable
         * @param {Object} variable
         * @param {number} index
         */
        function onChangeData(variable, index) {
            ctrl.ingresses[index] = variable;

            updateIngresses();
        }

        /**
         * Update item class callback
         * @param {Object} item - item class\kind
         */
        function onSelectClass(item) {
            ctrl.item = lodash.omit(ctrl.item, ['maxWorkers', 'url', 'secret']);

            var nameDirty = ctrl.editItemForm.itemName.$dirty;
            var nameInvalid = ctrl.editItemForm.itemName.$invalid;

            ctrl.item.kind = item.id;
            ctrl.selectedClass = item;
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

            lodash.each(item.attributes, function (attribute) {
                if (attribute.name === 'ingresses') {
                    ctrl.ingresses = [];
                } else {
                    lodash.set(ctrl.item.attributes, attribute.name, '');
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
                                    var ingresses = lodash.defaultTo(ctrl.item.attributes[attribute.name], {});

                                    lodash.forEach(ctrl.ingresses, function (ingress, key) {
                                        ingresses[key.toString()] = {
                                            paths: ingress.value.split(',')
                                        };

                                        if (!lodash.isEmpty(ingress.name)) {
                                            ingresses[key.toString()].host = ingress.name;
                                        }
                                    });

                                    ctrl.item.attributes[attribute.name] = ingresses;
                                }
                            });

                            $rootScope.$broadcast('change-state-deploy-button', {component: ctrl.item.ui.name, isDisabled: false});

                            ctrl.onSubmitCallback({item: ctrl.item});
                        });
                    }
                }
            }
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
    }
}());
