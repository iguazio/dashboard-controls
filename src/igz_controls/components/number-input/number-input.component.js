(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('igzNumberInput', {
            bindings: {
                currentValue: '<',
                valueStep: '@',
                allowEmptyField: '<?',
                currentValueUnit: '<?',
                defaultValue: '<?',
                formObject: '<?',
                inputName: '@?',
                isDisabled: '<?',
                isFocused: '@?',
                itemBlurCallback: '&?',
                itemFocusCallback: '&?',
                maxValue: '<?',
                minValue: '<?',
                onChange: '<?',
                placeholder: '@?',
                precision: '@?',
                prefixUnit: '@?',
                suffixUnit: '@?',
                updateNumberInputCallback: '&?',
                updateNumberInputField: '@?',
                validationIsRequired: '<?',
                validationValue: '<?',
                validationValueUnit: '<?'
            },
            templateUrl: 'igz_controls/components/number-input/number-input.tpl.html',
            controller: IgzNumberInputController
        });

    /**
     * IGZ number input
     * Based on `angular-money-directive` directive:
     * https://github.com/fiestah/angular-money-directive
     * Bindings properties:
     * currentValue - current value
     * valueStep - increment/decrement step
     * allowEmptyField - checks if true, then input field can be empty on initialization and
     *                   there is an ability to call updateNumberInputCallback with empty value
     * currentValueUnit - unit of current value
     * defaultValue - default value which will be set if field is empty
     * formObject - form object
     * inputName - name of input
     * isDisabled - checks if true, then input is disabled
     * isFocused - checks if true, then input is focused
     * maxValue - maximum legal value
     * minValue - minimum legal value
     * itemBlurCallback: callback for onBlur event
     * itemFocusCallback: callback for onFocus event
     * onChange - method on item changed
     * placeholder - placeholder text
     * precision - precision of value, ex. if precision is equal to 2 means that value will be in the form `X.XX`(ex. 2.11)
     * prefixUnit - prefix unit
     * suffixUnit - suffix unit
     * updateNumberInputCallback - callback on item added
     * updateNumberInputField - name of field that will be changed
     * validationIsRequired - checks if true, then input field is required(marked it as invalid)
     * validationValue - validation value
     * validationValueUnit - validation value unit
     */
    function IgzNumberInputController($timeout, $element, lodash, FormValidationService) {
        var ctrl = this;

        ctrl.numberInputChanged = false;
        ctrl.numberInputValid = true;

        ctrl.$onInit = onInit;
        ctrl.$postLink = postLink;

        ctrl.isShowFieldInvalidState = FormValidationService.isShowFieldInvalidState;

        ctrl.checkInvalidation = checkInvalidation;
        ctrl.decreaseValue = decreaseValue;
        ctrl.increaseValue = increaseValue;
        ctrl.isShownUnit = isShownUnit;
        ctrl.onBlurInput = onBlurInput;
        ctrl.onChangeInput = onChangeInput;
        ctrl.onUnitClick = onUnitClick;
        ctrl.setFocus = setFocus;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.validationIsRequired = String(ctrl.validationIsRequired) === 'true';
            ctrl.allowEmptyField = lodash.defaultTo(ctrl.allowEmptyField, false);
            ctrl.defaultValue = lodash.defaultTo(ctrl.defaultValue, null);
            ctrl.minValue = lodash.defaultTo(ctrl.minValue, 0);
            ctrl.precision = lodash.defaultTo(Number(ctrl.precision), 0);
            ctrl.placeholder = lodash.defaultTo(ctrl.placeholder, '');

            if (lodash.isNil(ctrl.currentValue) && !lodash.isNil(ctrl.defaultValue)) {
                ctrl.currentValue = ctrl.defaultValue;
            }
        }

        /**
         * Post linking method
         */
        function postLink() {
            ctrl.inputFocused = ctrl.isFocused === 'true';

            if (ctrl.isFocused === 'true') {
                $element.find('.field')[0].focus();
            }
        }

        //
        // Public methods
        //

        /**
         * Checks if the input value is invalid
         * @returns {boolean}
         */
        function checkInvalidation() {
            if (angular.isDefined(ctrl.formObject) && angular.isDefined(ctrl.formObject[ctrl.inputName])) {
                if ((lodash.isNil(ctrl.currentValue) || ctrl.currentValue === '') && ctrl.validationIsRequired) {
                    ctrl.formObject[ctrl.inputName].$setValidity('text', false);
                } else {
                    ctrl.formObject[ctrl.inputName].$setValidity('text', true);
                }
            }

            return ctrl.isShowFieldInvalidState(ctrl.formObject, ctrl.inputName);
        }

        /**
         * Method subtracts value from current value in input or sets current value to 0 it is below 0
         */
        function decreaseValue() {
            if (!lodash.isNil(ctrl.currentValue)) {
                ctrl.currentValue = Math.max(Number(ctrl.currentValue) - Number(ctrl.valueStep), 0).toFixed(ctrl.precision);

                if (angular.isDefined(ctrl.formObject) && ctrl.currentValue !== 0) {
                    ctrl.formObject[ctrl.inputName].$setViewValue(ctrl.currentValue.toString());
                    ctrl.formObject[ctrl.inputName].$render();
                }
            }
        }

        /**
         * Method adds value to current value in input
         */
        function increaseValue() {
            if (lodash.isNil(ctrl.currentValue) || ctrl.currentValue === '') {
                ctrl.currentValue = ctrl.minValue;
            } else {
                ctrl.currentValue = (Number(ctrl.currentValue) + Number(ctrl.valueStep)).toFixed(ctrl.precision);
            }

            if (angular.isDefined(ctrl.formObject)) {
                ctrl.formObject[ctrl.inputName].$setViewValue(ctrl.currentValue.toString());
                ctrl.formObject[ctrl.inputName].$render();
            }
        }

        /**
         * Method checks if passed value is defined
         * @param {string} [unitValue] - passed string unit value
         * @returns {boolean} returns true if defined
         */
        function isShownUnit(unitValue) {
            return angular.isDefined(unitValue);
        }

        /**
         * Handles on change event
         */
        function onChangeInput() {
            ctrl.numberInputChanged = true;
            onCurrentValueChange();

            if (lodash.isNil(ctrl.currentValue) && !lodash.isNull(ctrl.defaultValue) && !ctrl.allowEmptyField) {
                ctrl.currentValue = ctrl.defaultValue;
            }
        }

        /**
         * On unit click callback
         * Sets focus on input.
         */
        function onUnitClick() {
            $element.find('input')[0].focus();

            ctrl.setFocus();
        }

        /**
         * Sets ctrl.inputFocused to true if input is focused
         */
        function setFocus() {
            ctrl.inputFocused = true;

            if (angular.isFunction(ctrl.itemFocusCallback)) {
                ctrl.itemFocusCallback({inputName: ctrl.inputName});
            }
        }

        /**
         * Handles on blur event
         */
        function onBlurInput() {
            ctrl.inputFocused = false;

            if (angular.isFunction(ctrl.itemFocusCallback)) {
                ctrl.itemBlurCallback({inputName: ctrl.inputName});
            }

            onCurrentValueChange();
        }

        //
        // Private methods
        //

        /**
         * Handles any changes of current value
         */
        function onCurrentValueChange() {
            validateCurrentValue();
            $timeout(function () {
                lodash.get(ctrl, 'onChange', angular.noop)(ctrl.checkInvalidation());
            });
        }

        /**
         * Resets the input to default value if it is invalid
         */
        function validateCurrentValue() {
            if (angular.isFunction(ctrl.updateNumberInputCallback)) {
                if (ctrl.allowEmptyField || (!lodash.isNil(ctrl.currentValue) && ctrl.currentValue !== '')) {
                    ctrl.updateNumberInputCallback({
                        newData: !lodash.isNil(ctrl.currentValue) && ctrl.currentValue !== '' ? Number(ctrl.currentValue) : '',
                        field: angular.isDefined(ctrl.updateNumberInputField) ? ctrl.updateNumberInputField : ctrl.inputName
                    });
                }
            }
        }
    }
}());
