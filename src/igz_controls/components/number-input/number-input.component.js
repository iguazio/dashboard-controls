(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('igzNumberInput', {
            bindings: {
                currentValue: '<',
                valueStep: '@',
                allowEmptyField: '<?',
                asString: '<?',
                currentValueUnit: '<?',
                defaultValue: '<?',
                formObject: '<?',
                inputName: '@?',
                isDisabled: '<?',
                isFocused: '<?',
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
     * asString - if true returns the value as a string
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

        var firstValidValue;

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
            lodash.defaults(ctrl, {
                asString: false,
                validationIsRequired: false,
                allowEmptyField: false,
                defaultValue: null,
                minValue: -Infinity,
                maxValue: Infinity,
                precision: lodash.defaultTo(Number(ctrl.precision), 0),
                placeholder: ''
            });

            if (lodash.isNil(ctrl.currentValue) && !lodash.isNil(ctrl.defaultValue)) {
                ctrl.currentValue = ctrl.defaultValue;
            }

            firstValidValue = Math.max(ctrl.minValue, ctrl.maxValue) < 0 ? ctrl.maxValue : ctrl.minValue;
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
         * Method subtracts value from current value in input
         */
        function decreaseValue() {
            var nextValue = isCurrentValueEmpty() ? -Number(ctrl.valueStep) :
                                                    -Number(ctrl.valueStep) + Number(ctrl.currentValue);

            // when input is empty set firstValidValue
            ctrl.currentValue = lodash.defaultTo(getDecreasedValue(nextValue), firstValidValue);

            renderInput(ctrl.currentValue !== nextValue);
        }

        /**
         * Method adds value to current value in input
         */
        function increaseValue() {
            var nextValue = isCurrentValueEmpty() ? Number(ctrl.valueStep) :
                                                    Number(ctrl.valueStep) + Number(ctrl.currentValue);

            // when input is empty set firstValidValue
            ctrl.currentValue = lodash.defaultTo(getIncreasedValue(nextValue), firstValidValue);

            renderInput(ctrl.currentValue !== nextValue);
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
         * Checks if `nextValue` is inside the range [ctrl.minValue, ctrl.maxValue].
         * Returns valid value.
         * @param {number} nextValue
         * @returns {number|null}
         */
        function getDecreasedValue(nextValue) {
            var validValue = ctrl.currentValue;

            // range is [ctrl.minValue, ctrl.maxValue]
            if (lodash.inRange(nextValue, ctrl.minValue, ctrl.maxValue)) {
                // nextValue is inside range --> valid --> nextValue
                validValue = nextValue;
            } else if (lodash.inRange(nextValue, ctrl.maxValue, Infinity)) {
                // nextValue is to right of the range --> not valid --> end of range
                validValue = ctrl.maxValue;
            } else if (lodash.inRange(nextValue, ctrl.minValue, ctrl.minValue - Number(ctrl.valueStep))) {
                // nextValue is to left of the range, but not more then ctrl.valueStep --> not valid --> start of range
                validValue = ctrl.minValue;
            }

            // other cases --> nothing changes
            // when input is empty, ctrl.currentValue is null --> return null

            return validValue;
        }

        /**
         * Checks if `nextValue` is inside the range [ctrl.minValue, ctrl.maxValue].
         * Returns valid value.
         * @param {number} nextValue
         * @returns {number|null}
         */
        function getIncreasedValue(nextValue) {
            var validValue = ctrl.currentValue;

            // range is [ctrl.minValue, ctrl.maxValue]
            if (lodash.inRange(nextValue, ctrl.minValue, ctrl.maxValue)) {
                // nextValue is inside range --> valid --> nextValue
                validValue = nextValue;
            } else if (lodash.inRange(nextValue, -Infinity, ctrl.minValue)) {
                // nextValue is to the left of the range --> not valid --> start of range
                validValue = ctrl.minValue;
            } else if (lodash.inRange(nextValue, ctrl.maxValue, ctrl.maxValue + Number(ctrl.valueStep))) {
                // nextValue is to right of the range, but not more then ctrl.valueStep --> not valid --> end of range
                validValue = ctrl.maxValue;
            }

            // other cases --> nothing changes
            // when input is empty, ctrl.currentValue is null --> return null

            return validValue;
        }

        /**
         * Checks if current value is empty (empty input)
         * @returns {boolean}
         */
        function isCurrentValueEmpty() {
            return lodash.isNil(ctrl.currentValue) || ctrl.currentValue === '';
        }

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
         * Set new value after increase/decrease to input and render it
         * @param {boolean} focus. Whether focus input.
         */
        function renderInput(focus) {
            if (angular.isDefined(ctrl.formObject)) {
                ctrl.formObject[ctrl.inputName].$setViewValue(Number(ctrl.currentValue).toFixed(ctrl.precision));
                ctrl.formObject[ctrl.inputName].$render();
                if (focus) {
                    $element.find('input').focus();
                }
            }
        }

        /**
         * Resets the input to default value if it is invalid
         */
        function validateCurrentValue() {
            if (angular.isFunction(ctrl.updateNumberInputCallback)) {
                var currentValueIsDefined = !lodash.isNil(ctrl.currentValue) && ctrl.currentValue !== '';

                if (ctrl.allowEmptyField || currentValueIsDefined) {
                    var newData = currentValueIsDefined     ?
                                  ctrl.asString             ?
                                  String(ctrl.currentValue) :
                                  Number(ctrl.currentValue) : '';

                    ctrl.updateNumberInputCallback({
                        newData: newData,
                        field: angular.isDefined(ctrl.updateNumberInputField) ? ctrl.updateNumberInputField : ctrl.inputName
                    });
                }
            }
        }
    }
}());
