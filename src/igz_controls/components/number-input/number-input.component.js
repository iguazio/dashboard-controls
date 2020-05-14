(function () {
    'use strict';

    /**
     * @name igzNumberInput
     * @component
     *
     * @description
     * An input field for numbers. It has up/down arrows to increase/decrease the value. The model is of type `number`
     * by default, by can be changed to `string` by setting `asString` to `true`. You can optionally add prefix and/or
     * suffix text to the input field.
     * The `angular-money-directive` directive is used {@link https://github.com/fiestah/angular-money-directive}.
     * The `igzValidateElevation` directive is used to allow easily comparing numeric inputs with some unit to another
     * value with some unit (@see igzValidateElevation).
     * @param {number|string} currentValue - The initial value of the field.
     * @param {string} [valueStep='1'] - The size of step for increment/decrement when clicking on the up/down arrows
     *     of this component.
     * @param {boolean} [allowEmptyField=false] - Set to `true` to consider field valid when empty (and
     *     `updateNumberInputCallback` will be invoked when changing input to empty)
     * @param {boolean} [asString=false] - Set to `true` to receive value as type `string` instead of type `number`.
     * @param {{power: number|string}} [currentValueUnit] - The unit scale of `currentValue`. Will be forwarded to
     *     `currentValUnit` attribute of `igzValidateElevation`.
     * @param {number|string} [defaultValue] - Default value which will be set on initialization and change in case
     *     input is empty.
     * @param {Object} [formObject] - The `<form>` or `<ng-form>` element/directive containing this input field.
     * @param {string} [inputName] - The name of the filed, will be forwarded to the `name` attribute of the HTML
     *     `<input>` element.
     * @param {boolean} [isDisabled=false] - Set to `true` to make this field disabled.
     * @param {boolean} [isFocused=false] - Set to `true` to give focus to this field once it finished initializing.
     * @param {number} [maxValue=Infinity] - The maximum valid value.
     * @param {number} [minValue=-Infinity] - The minimum valid value.
     * @param {function} [itemBlurCallback] - A callback function for `blur` event. Invoked with `event`, `inputValue`
     *     and `inputName` when the field loses focus.
     * @param {function} [itemFocusCallback] - A callback function for `focus` event. Invoked with `event` and
     *     `inputName` when the field becomes focused.
     * @param {function} [onChange] - A callback function for `change` method on item changed
     * @param {string} [placeholder] - Placeholder text to display when input is empty.
     * @param {string} [precision=0] - The number of decimal places of value.
     * @param {string} [prefixUnit] - Prefix text to show to the left of value (for example: "$").
     * @param {string} [suffixUnit] - Suffix text to show to the right of the value (for example: "GB").
     * @param {function} [updateNumberInputCallback] - A callback function for value changes. Invoked with `newData`
     *     and `field`. When `isDataRevert` is set to `true` this function will be invoked on `blur` event.
     * @param {string} [updateNumberInputField=inputName] - The field name to be passed as `field` parameter when
     *     invoking `updateDataCallback` (defaults to `inputName`'s value).
     * @param {boolean} [validationIsRequired=false] - Set to `true` to make this field mandatory. The field will be
     *     invalid if it is empty.
     * @param {number|string} [validationValue] - The value to compare `currentValue` to. Will be forwarded to
     *     `compareVal` attribute of `igzValidateElevation`.
     * @param {{power: number|string}} [validationValueUnit] - The unit scale of `validationValue`. Will be forwarded to
     *     `compareValUnit` attribute of `igzValidateElevation`.
     */
    angular.module('iguazio.dashboard-controls')
        .component('igzNumberInput', {
            bindings: {
                allowEmptyField: '<?',
                asString: '<?',
                currentValue: '<',
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
                validationValueUnit: '<?',
                valueStep: '@?'
            },
            templateUrl: 'igz_controls/components/number-input/number-input.tpl.html',
            controller: IgzNumberInputController
        });

    function IgzNumberInputController($element, $timeout, lodash, FormValidationService) {
        var ctrl = this;

        var firstValidValue;

        ctrl.inputFocused = false;
        ctrl.numberInputChanged = false;
        ctrl.numberInputValid = true;

        ctrl.$onInit = onInit;
        ctrl.$postLink = postLink;

        ctrl.isShowFieldInvalidState = FormValidationService.isShowFieldInvalidState;

        ctrl.decreaseValue = decreaseValue;
        ctrl.handleInputBlur = handleInputBlur;
        ctrl.handleInputChange = handleInputChange;
        ctrl.handleInputFocus = handleInputFocus;
        ctrl.handleSuffixClick = handleSuffixClick;
        ctrl.increaseValue = increaseValue;
        ctrl.isShownUnit = isShownUnit;
        ctrl.isValid = isValid;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            lodash.defaults(ctrl, {
                allowEmptyField: false,
                asString: false,
                defaultValue: null,
                isDisabled: false,
                isFocused: false,
                itemBlurCallback: angular.noop,
                itemFocusCallback: angular.noop,
                maxValue: Infinity,
                minValue: -Infinity,
                placeholder: '',
                precision: lodash.defaultTo(Number(ctrl.precision), 0),
                updateNumberInputCallback: angular.noop,
                updateNumberInputField: ctrl.inputName,
                validationIsRequired: false,
                valueStep: '1'
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
            var focused = String(ctrl.isFocused).toLowerCase() === 'true';
            ctrl.inputFocused = focused;
            if (focused) {
                $element.find('.field').focus();
            }
        }

        //
        // Public methods
        //

        /**
         * Checks if the input value is invalid
         * @returns {boolean}
         */
        function isValid() {
            if (angular.isDefined(ctrl.formObject) && angular.isDefined(ctrl.formObject[ctrl.inputName])) {
                var valid = !ctrl.validationIsRequired || !lodash.isNil(ctrl.currentValue) && ctrl.currentValue !== '';
                ctrl.formObject[ctrl.inputName].$setValidity('text', valid);
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

            onCurrentValueChange();
        }

        /**
         * Method adds value to current value in input
         */
        function increaseValue() {
            var nextValue = isCurrentValueEmpty() ? Number(ctrl.valueStep) :
                                                    Number(ctrl.valueStep) + Number(ctrl.currentValue);

            // when input is empty set firstValidValue
            ctrl.currentValue = lodash.defaultTo(getIncreasedValue(nextValue), firstValidValue);

            onCurrentValueChange();
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
        function handleInputChange() {
            ctrl.numberInputChanged = true;
            onCurrentValueChange();

            if (lodash.isNil(ctrl.currentValue) && !lodash.isNull(ctrl.defaultValue) && !ctrl.allowEmptyField) {
                ctrl.currentValue = ctrl.defaultValue;
            }
        }

        /**
         * Handles the `click` event of the suffix.
         * @param {Event} event - The `click` event.
         */
        function handleSuffixClick(event) {
            $element.find('.field').focus();
            ctrl.handleInputFocus(event);
        }

        /**
         * Handles the `focus` event of the input field.
         * @param {Event} event - The `focus` event on the input field or the `click` event on the suffix.
         */
        function handleInputFocus(event) {
            ctrl.inputFocused = true;

            ctrl.itemFocusCallback({
                event: event,
                inputName: ctrl.inputName
            });
        }

        /**
         * Handles the `blur` event of the input field.
         * @param {FocusEvent} event - The `blur` event.
         */
        function handleInputBlur(event) {
            ctrl.inputFocused = false;

            if (angular.isFunction(ctrl.itemFocusCallback)) {
                ctrl.itemBlurCallback({
                    event: event,
                    inputValue: ctrl.currentValue,
                    inputName: ctrl.inputName
                });
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
                lodash.get(ctrl, 'onChange', angular.noop)(ctrl.isValid());
            });
        }

        /**
         * Resets the input to default value if it is invalid
         */
        function validateCurrentValue() {
            if (angular.isDefined(ctrl.updateNumberInputCallback)) {
                var currentValueIsDefined = !lodash.isNil(ctrl.currentValue) && ctrl.currentValue !== '';

                if (ctrl.allowEmptyField || currentValueIsDefined) {
                    var newData = !currentValueIsDefined ? ''                        :
                                  ctrl.asString          ? String(ctrl.currentValue) :
                                  /* else */               Number(ctrl.currentValue);

                    ctrl.updateNumberInputCallback({
                        newData: newData,
                        field: ctrl.updateNumberInputField
                    });
                }
            }
        }
    }
}());
