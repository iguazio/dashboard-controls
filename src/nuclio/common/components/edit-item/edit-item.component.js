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

    function NclEditItemController($document, $element, $scope, lodash, FunctionsService, FormValidationService) {
        var ctrl = this;

        ctrl.classList = [];
        ctrl.selectedClass = {};

        ctrl.$onInit = onInit;
        ctrl.$onDestroy = onDestroy;

        ctrl.isShowFieldError = FormValidationService.isShowFieldError;
        ctrl.isShowFieldInvalidState = FormValidationService.isShowFieldInvalidState;

        ctrl.getAttrValue = getAttrValue;
        ctrl.inputValueCallback = inputValueCallback;
        ctrl.isClassSelected = isClassSelected;
        ctrl.onSubmitForm = onSubmitForm;
        ctrl.onSelectClass = onSelectClass;

        //
        // Hook methods
        //

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
            var nameDirty = ctrl.editItemForm.itemName.$dirty;
            var nameInvalid = ctrl.editItemForm.itemName.$invalid;

            ctrl.item.kind = item.id;
            ctrl.selectedClass = item;
            ctrl.item.attributes = {};

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

                        ctrl.onSubmitCallback({item: ctrl.item});
                    }
                }
            }
        }
    }
}());
