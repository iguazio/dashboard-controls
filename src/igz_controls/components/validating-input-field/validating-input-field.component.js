(function () {
    'use strict';

    /**
     * compareInputValue: used if there are two field that should be equal (password and confirm password)
     * fieldType: input, textarea or password
     * formObject: object of HTML form
     * hideCounter: should be counter of remaining symbols for the field visible or not
     * inputId: string that should be assigned to id attribute
     * inputModelOptions: custom options for ng-model-options
     * inputName: name attribute of an input
     * inputValue: initial value
     * itemBlurCallback: callback for onBlur event
     * itemFocusCallback: callback for onFocus event
     * isDataRevert: should incorrect value be immediately replaced by a previous correct one
     * isDisabled: is input should be disabled
     * isFocused: should input be focused when screen is displayed
     * trim: whether the input value will automatically trim
     * onBlur: callback function to be called when value was reverted
     * onlyValidCharacters: allow only that characters which passed regex pattern
     * placeholderText: text that is displayed when input is empty
     * readOnly: is input should be readonly
     * spellcheck: disable spell check for some field, for example input for base64 string
     * updateDataCallback: triggered when input was changed by a user
     * updateDataField: field name for updateDataCallback
     * validationIsRequired: input can't be empty
     * validationMaxLength: value should be shorter or equal this value
     * validationPattern: validation with regex
     * autoComplete: the string to use as a value to the "autocomplete" HTML attribute of the INPUT tag
     * enterCallback: will be called when the Enter key is pressed
     * inputIcon: a CSS class name to use for displaying an icon before the user input
     * isClearIcon: determines whether to display a "Clear" action icon for clearing input
     * validationRules: a list of validation rules to check against as input changes, each object consists of `label`
     *     (`string`) and `pattern` (`RegExp` or `function`)
     */
    angular.module('iguazio.dashboard-controls')
        .component('igzValidatingInputField', {
            bindings: {
                autoComplete: '@?',
                compareInputValue: '<?',
                enterCallback: '<?',
                fieldType: '@',
                formObject: '<',
                hideCounter: '<?',
                inputIcon: '@',
                inputModelOptions: '<?',
                inputName: '@',
                inputValue: '<',
                isClearIcon: '<?',
                isDataRevert: '@?',
                isDisabled: '<?',
                isFocused: '<?',
                itemBlurCallback: '&?',
                itemFocusCallback: '&?',
                onBlur: '&?',
                onlyValidCharacters: '<?',
                placeholderText: '@',
                readOnly: '<?',
                spellcheck: '<?',
                trim: '<?',
                updateDataCallback: '&?',
                updateDataField: '@?',
                validationIsRequired: '<',
                validationMaxLength: '@',
                validationPattern: '<',
                validationRules: '<?'
            },
            templateUrl: 'igz_controls/components/validating-input-field/validating-input-field.tpl.html',
            controller: IgzValidatingInputFieldController
        });

    function IgzValidatingInputFieldController($document, $element, $scope, $timeout, $window, lodash, EventHelperService,
                                               FormValidationService, PreventDropdownCutOffService) {
        var ctrl = this;

        var defaultInputModelOptions = {
            updateOn: 'default blur',
            debounce: {
                'default': 250,
                '*': 0
            },
            allowInvalid: true
        };
        var showPopUpOnTop = false;

        ctrl.data = '';
        ctrl.inputFocused = false;
        ctrl.inputIsTouched = false;
        ctrl.isValidationPopUpShown = false;
        ctrl.preventInputBlur = false;
        ctrl.startValue = '';

        ctrl.$onInit = onInit;
        ctrl.$onChanges = onChanges;
        ctrl.$onDestroy = onDestroy;
        ctrl.$postLink = postLink;

        ctrl.getRemainingSymbolsCounter = getRemainingSymbolsCounter;
        ctrl.isFieldInvalid = isFieldInvalid;
        ctrl.isCounterVisible = isCounterVisible;
        ctrl.isOverflowed = isOverflowed;
        ctrl.isValueInvalid = isValueInvalid;
        ctrl.focusInput = focusInput;
        ctrl.keyDown = keyDown;
        ctrl.unfocusInput = unfocusInput;
        ctrl.updateInputValue = updateInputValue;
        ctrl.clearInputField = clearInputField;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            lodash.defaults(ctrl, {
                autoComplete: 'off',
                hideCounter: false,
                inputModelOptions: {},
                inputValue: '',
                isClearIcon: false,
                isDisabled: false,
                isFocused: false,
                onlyValidCharacters: false,
                updateDataField: ctrl.inputName,
                readOnly: false,
                spellcheck: true,
                trim: true,
                validationRules: []
            });

            ctrl.data = angular.copy(ctrl.inputValue);
            ctrl.inputFocused = ctrl.isFocused;
            ctrl.startValue = angular.copy(ctrl.inputValue);
            ctrl.validationRules = angular.copy(ctrl.validationRules);

            lodash.defaultsDeep(ctrl.inputModelOptions, defaultInputModelOptions);

            if (!lodash.isEmpty(ctrl.validationRules) && !lodash.isEmpty(ctrl.data)) {
                $timeout(checkPatternsValidity.bind(null, ctrl.data, true));
            }

            $document.on('click', handleValidationIconClick);

            $scope.$on('update-patterns-validity', updatePatternsValidity);
        }

        /**
         * Method called after initialization
         */
        function postLink() {
            if (ctrl.isFocused) {

                // check is this input field is in dialog
                var timer = angular.isDefined($element.closest('.ngdialog')[0]) ? 300 : 0;

                $timeout(function () {
                    $element.find('.field')[0].focus();
                }, timer);
            }
        }

        /**
         * Destructor
         */
        function onDestroy() {
            angular.element($window).off('animationend');
            $document.off('click', handleValidationIconClick);
        }

        /**
         * onChange hook
         * @param {Object} changes
         */
        function onChanges(changes) {
            if (angular.isDefined(changes.inputValue)) {
                if (!changes.inputValue.isFirstChange()) {
                    ctrl.data = angular.copy(changes.inputValue.currentValue);
                    ctrl.startValue = angular.copy(ctrl.inputValue);

                    if (!lodash.isEmpty(ctrl.validationRules)) {
                        checkPatternsValidity(ctrl.data, false);
                    }
                }
            }

            if (angular.isDefined(changes.isFocused)) {
                if (!changes.isFocused.isFirstChange()) {
                    $timeout(function () {
                        $element.find('.field')[0].focus();
                    });
                }
            }
        }

        //
        // Public methods
        //

        /**
         * Get counter of the remaining symbols for the field
         * @returns {number}
         */
        function getRemainingSymbolsCounter() {
            if (ctrl.formObject) {
                var maxLength = parseInt(ctrl.validationMaxLength);
                var inputViewValue = lodash.get(ctrl.formObject, [ctrl.inputName,  '$viewValue']);

                return (maxLength >= 0 && inputViewValue) ? (maxLength - inputViewValue.length).toString() : null;
            }
        }

        /**
         * Check whether the field is invalid.
         * Do not validate field if onlyValidCharacters parameter was passed.
         * @returns {boolean}
         */
        function isFieldInvalid() {
            return ctrl.onlyValidCharacters ? false : FormValidationService.isShowFieldInvalidState(ctrl.formObject, ctrl.inputName);
        }

        /**
         * Check whether the counter should be visible
         * @returns {boolean}
         */
        function isCounterVisible() {
            return !ctrl.isDisabled && !ctrl.onlyValidCharacters && !ctrl.hideCounter && !ctrl.readOnly &&
                   ctrl.validationMaxLength;
        }

        /**
         * Check if pop-up has overflowed
         * @returns {boolean}
         */
        function isOverflowed() {
            var popUp = $element.find('.validation-pop-up')[0];
            var popUpPosition = popUp.getBoundingClientRect();

            if (!showPopUpOnTop && ctrl.isValidationPopUpShown) {
                showPopUpOnTop = $window.innerHeight - popUpPosition.top - popUpPosition.height < 0;
            }

            return showPopUpOnTop;
        }

        /**
         * Check whether the input value is invalid
         * @returns {boolean}
         */
        function isValueInvalid() {
            return lodash.some(ctrl.validationRules, ['isValid', false]);
        }

        /**
         * Method to make input unfocused
         */
        function focusInput() {
            ctrl.inputFocused = true;

            if (!lodash.isEmpty(ctrl.validationRules)) {
                ctrl.inputIsTouched = true;
            }

            if (angular.isFunction(ctrl.itemFocusCallback)) {
                ctrl.itemFocusCallback({ inputName: ctrl.inputName });
            }
        }

        /**
         * Handles the 'keyDown' event.
         * @param {Event} event - native event object.
         */
        function keyDown(event) {
            if (angular.isDefined(ctrl.enterCallback) && event.keyCode === EventHelperService.ENTER) {
                $timeout(ctrl.enterCallback);
            }
        }

        /**
         * Loses focus from input field.
         * @param {Event} event - native event object.
         */
        function unfocusInput(event) {
            if (!ctrl.preventInputBlur) {
                ctrl.inputFocused = false;

                // If 'data revert' option is enabled - set or revert outer model value
                setOrRevertInputValue();
            } else {
                event.target.focus();

                ctrl.preventInputBlur = false;
            }
        }

        /**
         * Updates outer model value on inner model value change
         * Used for `ng-change` directive
         */
        function updateInputValue() {
            if (angular.isDefined(ctrl.data)) {
                ctrl.inputValue = angular.isString(ctrl.data) && ctrl.trim ? ctrl.data.trim() : ctrl.data;
            }

            if (angular.isDefined(ctrl.updateDataCallback)) {
                ctrl.updateDataCallback({
                    newData: ctrl.inputValue,
                    field: angular.isDefined(ctrl.updateDataField) ? ctrl.updateDataField : ctrl.inputName
                });
            }

            if (!lodash.isEmpty(ctrl.validationRules)) {
                checkPatternsValidity(ctrl.inputValue, false);
            }
        }

        /**
         * Clear search input field
         */
        function clearInputField() {
            ctrl.data = '';
            updateInputValue();
        }

        //
        // Private methods
        //

        /**
         * Checks and sets validity based on `ctrl.validationRules`
         * @param {string} value - current input value
         * @param {boolean} isInitCheck - is it an initial check
         */
        function checkPatternsValidity(value, isInitCheck) {
            ctrl.formObject[ctrl.inputName].$setTouched();

            lodash.forEach(ctrl.validationRules, function (rule) {
                var isValid = lodash.isFunction(rule.pattern) ? rule.pattern(value, isInitCheck) : rule.pattern.test(value);

                ctrl.formObject[ctrl.inputName].$setValidity(lodash.defaultTo(rule.name, rule.label), isValid);

                rule.isValid = isValid;
            });
        }

        /**
         * Handles click on validation icon and show/hide validation pop-up
         * @param event
         */
        function handleValidationIconClick(event) {
            var validationIcon = $element.find('.validation-icon')[0];

            if (event.target === validationIcon) {
                if (!lodash.isEmpty(ctrl.validationRules)) {
                    ctrl.isValidationPopUpShown = !ctrl.isValidationPopUpShown;

                    $timeout(function () {
                        $element.find('.field').focus();
                        ctrl.inputFocused = true;
                        var popUp = $element.find('.validation-pop-up-wrapper');
                        popUp.css({
                            'height': popUp.outerHeight() > 0 ? popUp.outerHeight() : 'auto'
                        });
                    })
                }
            } else if (!event.target.closest('.input-field')) {
                ctrl.isValidationPopUpShown = false;
            }

            if (!ctrl.isValidationPopUpShown) {
                showPopUpOnTop = false;
            }
        }

        /**
         * Sets or reverts outer model value
         */
        function setOrRevertInputValue() {
            $timeout(function () {
                if (ctrl.isDataRevert) {

                    // If input is invalid - inner model value is set to undefined by Angular
                    if (angular.isDefined(ctrl.data) && ctrl.startValue !== Number(ctrl.data)) {
                        ctrl.inputValue = angular.isString(ctrl.data) ? ctrl.data.trim() : ctrl.data;
                        if (angular.isFunction(ctrl.itemBlurCallback)) {
                            ctrl.itemBlurCallback({
                                inputValue: ctrl.inputValue,
                                inputName: ctrl.inputName
                            });
                        }
                        ctrl.startValue = Number(ctrl.data);
                    } else {

                        // Revert input value; Outer model value just does not change
                        ctrl.data = ctrl.inputValue;
                        if (angular.isFunction(ctrl.onBlur)) {
                            ctrl.onBlur({ inputName: ctrl.inputName });
                        }
                    }
                } else {
                    if (angular.isFunction(ctrl.itemBlurCallback)) {
                        ctrl.itemBlurCallback({
                            inputValue: ctrl.inputValue,
                            inputName: ctrl.inputName
                        });
                    }
                }
            });
        }

        /**
         * Update patterns validity
         * @param {Event} event - native broadcast event object
         * @param {Array} inputNameList - broadcast data
         */
        function updatePatternsValidity(event, inputNameList) {
            if (!lodash.isEmpty(ctrl.validationRules) && lodash.includes(inputNameList, ctrl.inputName)) {
                checkPatternsValidity(ctrl.inputValue, false);
            }
        }
    }
}());
