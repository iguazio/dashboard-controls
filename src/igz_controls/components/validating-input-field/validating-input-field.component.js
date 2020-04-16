(function () {
    'use strict';

    /**
     * compareInputValue: used if there are two field that should be equal (password and confirm password)
     * fieldType: input, textarea or password
     * formObject: object of HTML form
     * hideCounter: set to `true` to hide the remaining characters counter when `validationMaxLength` is used.
     * inputModelOptions: custom options for ng-model-options
     * inputName: name attribute of an input
     * inputValue: initial value
     * itemBlurCallback: callback for `blur` event
     * itemFocusCallback: callback for `focus` event
     * isDataRevert: set to `true` to revert to last valid value on losing focus (this will call `updateDataCallback` on
     *     `blur` event in case the value was successfully changed, and will not call it in case the value was reverted)
     * isDisabled: is input should be disabled
     * isFocused: should input be focused when screen is displayed
     * trim: whether the input value will automatically trim
     * onlyValidCharacters: allow only that characters which passed regex pattern
     * placeholderText: text that is displayed when input is empty
     * readOnly: is input should be readonly
     * spellcheck: disable spell check for some field, for example input for base64 string
     * updateDataCallback: triggered when input was changed by a user
     * updateDataField: field name to be passed as `field` to `updateDataCallback` (defaults to `inputName`'s value)
     * validationIsRequired: input can't be empty
     * validationMaxLength: value should be shorter or equal this value (will add a counter of remaining characters,
     *     unless `hideCounter` is set to `true`)
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
                isDataRevert: '<?',
                isDisabled: '<?',
                isFocused: '<?',
                itemBlurCallback: '&?',
                itemFocusCallback: '&?',
                onlyValidCharacters: '<?',
                placeholderText: '@',
                readOnly: '<?',
                spellcheck: '<?',
                trim: '<?',
                updateDataCallback: '&?',
                updateDataField: '@?',
                validationIsRequired: '<?',
                validationMaxLength: '@?',
                validationPattern: '<?',
                validationRules: '<?'
            },
            templateUrl: 'igz_controls/components/validating-input-field/validating-input-field.tpl.html',
            controller: IgzValidatingInputFieldController
        });

    function IgzValidatingInputFieldController($document, $element, $scope, $timeout, $window, lodash,
                                               EventHelperService) {
        var ctrl = this;

        var defaultInputModelOptions = {
            updateOn: 'default blur',
            debounce: {
                'default': 250,
                '*': 0
            },
            allowInvalid: true
        };
        var fieldElement = null;
        var lastValidValue = '';
        var ngModel = null;
        var showPopUpOnTop = false;

        ctrl.data = '';
        ctrl.inputFocused = false;
        ctrl.inputIsTouched = false;
        ctrl.isValidationPopUpShown = false;
        ctrl.preventInputBlur = false;

        ctrl.$onInit = onInit;
        ctrl.$onChanges = onChanges;
        ctrl.$onDestroy = onDestroy;
        ctrl.$postLink = postLink;

        ctrl.getRemainingSymbolsCounter = getRemainingSymbolsCounter;
        ctrl.isFieldInvalid = isFieldInvalid;
        ctrl.isCounterVisible = isCounterVisible;
        ctrl.isOverflowed = isOverflowed;
        ctrl.isValueInvalid = hasInvalidRule;
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
                isDataRevert: false,
                isDisabled: false,
                isFocused: false,
                onlyValidCharacters: false,
                updateDataField: ctrl.inputName,
                readOnly: false,
                spellcheck: true,
                trim: true,
                validationIsRequired: false,
                validationRules: []
            });

            ctrl.validationRules = angular.copy(ctrl.validationRules);

            lodash.defaultsDeep(ctrl.inputModelOptions, defaultInputModelOptions);
        }

        /**
         * Post linking method
         */
        function postLink() {
            $document.on('click', handleValidationIconClick);

            $scope.$applyAsync(function () {
                fieldElement = $element.find('.field');
                ngModel = fieldElement.controller('ngModel');

                // if `validation-rules` attribute is used - add the appropriate validator
                if (!lodash.isEmpty(ctrl.validationRules)) {
                    ngModel.$validators.validationRules = function (modelValue) {
                        return checkPatternsValidity(modelValue, false);
                    };
                }

                // validate on init in case the input field starts with an invalid value
                ngModel.$validate();

                // set focus to the input field in case `is-focused` attribute is `true`
                // if the input field is inside a dialog, await the dialog's animation
                if (ctrl.isFocused) {
                    var timer = $element.closest('.ngdialog').length > 0 ? 300 : 0;

                    $timeout(function () {
                        fieldElement.focus();
                    }, timer);
                }
            });
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
                ctrl.data = angular.copy(changes.inputValue.currentValue);

                // update `lastValidValue` to later use it on `blur` event in case `is-data-revert` attribute is `true`
                // and the input field is invalid (so the input field could be reverted to the last valid value)
                lastValidValue = angular.copy(ctrl.inputValue);
            }

            if (angular.isDefined(changes.isFocused)) {
                ctrl.inputFocused = changes.isFocused.currentValue;
                if (!changes.isFocused.isFirstChange()) {
                    $timeout(function () {
                        fieldElement.focus();
                    });
                }
            }
        }

        //
        // Public methods
        //

        /**
         * Gets count of the remaining characters for the field.
         * @returns {number} count of the remaining characters for the field.
         */
        function getRemainingSymbolsCounter() {
            var maxLength = Number.parseInt(ctrl.validationMaxLength);
            var currentLength = lodash.get(ngModel, '$viewValue.length', -1);

            return currentLength < 0 || maxLength <= 0 ? null : (maxLength - currentLength).toString();
        }

        /**
         * Checks whether the field is invalid.
         * Do not validate field if `onlyValidCharacters` component attribute was passed.
         * @returns {boolean} `true` in case the field is valid, or `false` otherwise.
         */
        function isFieldInvalid() {
            return ctrl.onlyValidCharacters ? false :
                (lodash.get(ctrl.formObject, '$submitted') || lodash.get(ngModel, '$dirty')) &&
                    lodash.get(ngModel, '$invalid');
        }

        /**
         * Checks whether the counter should be visible.
         * @returns {boolean} `true` in case the counter should be visible, or `false` otherwise.
         */
        function isCounterVisible() {
            return !ctrl.isDisabled && !ctrl.onlyValidCharacters && !ctrl.hideCounter && !ctrl.readOnly &&
                   !lodash.isNil(ctrl.validationMaxLength);
        }

        /**
         * Checks whether validation-rule pop-up has overflowed.
         * @returns {boolean} `ture` in case of overflow, or `false` otherwise.
         */
        function isOverflowed() {
            var popUp = $element.find('.validation-pop-up');

            if (!showPopUpOnTop && ctrl.isValidationPopUpShown) {
                showPopUpOnTop = $window.innerHeight - popUp.offset().top - popUp.outerHeight() < 0;
            }

            return showPopUpOnTop;
        }

        /**
         * Checks whether there is at least one failed validation rule.
         * @returns {boolean} `true` in case there is at least one failed validation rule, or `false` otherwise.
         */
        function hasInvalidRule() {
            return lodash.some(ctrl.validationRules, ['isValid', false]);
        }

        /**
         * Puts focus on input field.
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
            if (ctrl.preventInputBlur) {
                ctrl.preventInputBlur = false;
                ctrl.inputFocused = true;
                event.target.focus();
            } else {
                ctrl.inputFocused = false;

                // in case `is-data-revert` attribute is `true` - set or revert outer model value
                if (ctrl.isDataRevert) {
                    setOrRevertInputValue();
                }

                if (angular.isFunction(ctrl.itemBlurCallback)) {
                    ctrl.itemBlurCallback({
                        inputValue: ctrl.data,
                        inputName: ctrl.inputName
                    });
                }
            }
        }

        /**
         * Updates outer model value on inner model value change.
         */
        function updateInputValue() {
            ngModel.$validate();
            if (ngModel.$valid) {

                // update `lastValidValue` to later use it on `blur` event in case `is-data-revert` attribute is `true`
                // and the input field is invalid (so the input field could be reverted to the last valid value)
                lastValidValue = ctrl.data;
            }

            if (!ctrl.isDataRevert && angular.isFunction(ctrl.updateDataCallback)) {
                ctrl.updateDataCallback({
                    newData: ctrl.data,
                    field: ctrl.updateDataField
                });
            }
        }

        /**
         * Clears search input field.
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
         */
        function checkPatternsValidity(value) {
            lodash.forEach(ctrl.validationRules, function (rule) {
                rule.isValid = lodash.isFunction(rule.pattern) ? rule.pattern(value) :
                               /* else, it is a RegExp */        rule.pattern.test(value);
            });

            return !hasInvalidRule();
        }

        /**
         * Handles click on validation icon and show/hide validation pop-up.
         * @param {Event} event - The `click` event.
         */
        function handleValidationIconClick(event) {
            var popUp = $element.find('.validation-pop-up-wrapper');
            if (event.target === $element.find('.validation-icon')[0]) {
                if (!lodash.isEmpty(ctrl.validationRules)) {
                    ctrl.isValidationPopUpShown = !ctrl.isValidationPopUpShown;

                    $timeout(function () {
                        fieldElement.focus();
                        ctrl.inputFocused = true;
                        popUp.css('height', popUp.outerHeight() > 0 ? popUp.outerHeight().toString() : 'auto');
                    })
                }
            } else if (showPopUpOnTop && event.target === popUp[0] || $element.find(event.target).length === 0) {
                // when `showPopUpOnTop` is `true`, the `.validation-pop-up-wrapper` stays with `position: fixed` below
                // the input field, and only its child `.validation-pop-up` moves above the input field with
                // `position: relative`.
                // so clicking below the input field seems like clicking outside of it, but actually you might be
                // clicking on this invisible wrapper that is nested in `$element`.
                // that's why `showPopUpOnTop && event.target === popUp[0]` condition means the user intended to close
                // the validation pop-up.
                //
                // ----------------------------
                // |                          |
                // |    .validation-pop-up    |
                // |    position: relative    |
                // ----------------------------
                // ----------------------------
                // |      .input-field        |
                // ----------------------------
                // ----------------------------
                // |                          |  <-- clicking here means the pop-up should be closed
                // |.validation-pop-up-wrapper|
                // |     position: fixed      |
                // ----------------------------
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
            if (ctrl.isDataRevert) {
                // in case model update is debounced using `ngModelOptions`, make sure to commit it (which also
                // validates it) before proceeding
                ngModel.$commitViewValue();

                // if the input value is invalid - revert it to the last valid value
                // otherwise, notify the user about the value change
                if (ngModel.$invalid) {
                    ctrl.data = lastValidValue;
                } else if (angular.isFunction(ctrl.updateDataCallback)) {
                    ctrl.updateDataCallback({
                        newData: ctrl.data,
                        field: ctrl.updateDataField
                    });
                }
            }
        }
    }
}());
