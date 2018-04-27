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

    function NclEditItemController($document, $element, $scope, lodash, ConverterService, FunctionsService, FormValidationService) {
        var ctrl = this;

        ctrl.classList = [];
        ctrl.selectedClass = {};

        ctrl.$onInit = onInit;
        ctrl.$onDestroy = onDestroy;

        ctrl.numberValidationPattern = /^\d+$/;
        ctrl.arrayIntValidationPattern = /^[-,0-9]+$/;
        ctrl.arrayStrValidationPattern = /^.{1,128}$/;
        ctrl.stringValidationPattern = /^.{1,128}$/;

        ctrl.isShowFieldError = FormValidationService.isShowFieldError;
        ctrl.isShowFieldInvalidState = FormValidationService.isShowFieldInvalidState;
        ctrl.isNil = lodash.isNil;

        ctrl.getAttrValue = getAttrValue;
        ctrl.getValidationPattern = getValidationPattern;
        ctrl.inputValueCallback = inputValueCallback;
        ctrl.isClassSelected = isClassSelected;
        ctrl.onSubmitForm = onSubmitForm;
        ctrl.onSelectClass = onSelectClass;
        ctrl.convertFromCamelCase = convertFromCamelCase;

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
            }
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
         * Update data callback
         * @param {string} newData
         * @param {string} field
         */
        function inputValueCallback(newData, field) {
            lodash.set(ctrl.item, field, newData);
        }

        /**
         * Determine whether the item class was selected
         * @returns {boolean}
         */
        function isClassSelected() {
            return !lodash.isEmpty(ctrl.selectedClass);
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
                lodash.set(ctrl.item.attributes, attribute.name, '');
            });

            // set form pristine to not validate new form fields
            ctrl.editItemForm.$setPristine();

            // if itemName is invalid - set it dirty to show validation message
            if (nameDirty && nameInvalid) {
                ctrl.editItemForm.itemName.$setDirty();
            }
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
            if (angular.isUndefined(event.keyCode) || event.keyCode === '13') {
                if (event.target !== $element[0] && $element.find(event.target).length === 0) {
                    if (ctrl.editItemForm.$invalid) {
                        ctrl.item.ui.expandable = false;
                        ctrl.editItemForm.itemName.$setDirty();

                        // set form as submitted
                        ctrl.editItemForm.$setSubmitted();
                    } else {
                        ctrl.item.ui.expandable = true;

                        lodash.forEach(ctrl.selectedClass.attributes, function (attribute) {
                            if (attribute.pattern === 'number') {
                                lodash.set(ctrl.item, 'attributes[' + attribute.name + ']', Number(ctrl.item.attributes[attribute.name]));
                            }

                            if (attribute.pattern === 'arrayStr' && !lodash.isArray(ctrl.item.attributes[attribute.name])) {
                                ctrl.item.attributes[attribute.name] = ctrl.item.attributes[attribute.name].split(',');
                            }

                            if (attribute.pattern === 'arrayInt' && !lodash.isArray(ctrl.item.attributes[attribute.name])) {
                                ctrl.item.attributes[attribute.name] = ConverterService.toNumberArray(ctrl.item.attributes[attribute.name]);
                            }
                        });

                        ctrl.onSubmitCallback({item: ctrl.item});
                    }
                }
            }
        }
    }
}());
