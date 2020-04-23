(function () {
    'use strict';

    /**
     * @name igzValidatingInputField
     * @component
     *
     * @description
     * An input field that wraps around regular `<input>` or `<textarea>` elements and enriches them with validation
     * capabilities. Validation rules could be provided to display a menu of validation rules to the user on demand, and
     * mark which of them passes and which fails. The field is styled according to its validity.
     *
     * @param {string} [bordersMode='always'] - Determines when to show borders. Could be one of:
     *     - `'always'` (default): always show borders (like a regular input field)
     *     - `'hover'`: hide borders when idle, show them on hover (and on focus)
     *     - `'focus'`: hide borders when idle and on hover, show them only on focus
     *     Note: this attribute is ignored when `readOnly` attribute is set to `true`.
     * compareInputValue: used if there are two field that should be equal (password and confirm password)
     * @param {string} [fieldType='input'] - Determines the type of field:
     *     - `'input'` (default): a text box
     *     - `'password'`: a text box with concealed characters
     *     - `'textarea'`: a multi-line text-area
     *     - `'schedule'`: a mix of multiple drop-down menu fields to conveniently create a recurring schedule
     *                     (generating a CRON string @see {@link https://crontab.guru/})
     * @param {Object} [formObject] - The `<form>` or `<ng-form>` element/directive containing this input field.
     * @param {boolean} [hideCounter=false] - Set to `true` to hide the remaining characters counter when
     *     `validationMaxLength` is used.
     * @param {Object} [inputModelOptions] - A `ngModelOptions` object to forward to `ng-model-options` attribute of
     *     the HTML `<input>` or `<textarea>` element. Some options may be ignored/overridden by this component to make
     *     some of its features work properly.
     * @param {string} inputName - The name of the filed, will be forwarded to the `name` attribute of the HTML element.
     * @param {*} inputValue - The initial value of the field. This is a one-way binding that is watched for changes.
     * @param {function} [itemBlurCallback] - A callback function for `blur` event. Invoked with `inputValue` and
     *     `inputName` when the field loses focus.
     * @param {function} [itemFocusCallback] - A callback function for `focus` event. Invoked with `inputName` when the
     *     field becomes focused.
     * @param {boolean} [isDataRevert=false] - Set to `true` to revert to last valid value on losing focus. This will
     *     invoke `updateDataCallback` on `blur` event in case the value was successfully changed, and will not invoke
     *     it in case the value was reverted. `itemBlurCallback` will be invoked on `blur` event regardless.
     * @param {boolean} [isDisabled=false] - Set to `true` to make this field disabled.
     * @param {boolean} [isFocused=false] - Set to `true` to give focus to this field once it finished initializing.
     *     This is a one-way binding that is watched for changes.
     * @param {string} [tabindex=0] - Indicates where the field participates in sequential keyboard navigation.
     *     Forwarded to the `tabindex` attribute of the HTML element.
     * @param {boolean} [trim=true] - Set to `false` to prevent automatic removal of leading and trailing spaces from
     *     entered value.
     * @param {RegExp} [onlyValidCharacters] - Allows entering only the characters which match the regex pattern.
     * @param {string} [placeholderText] - Placeholder text to display when input is empty.
     * @param {boolean} [readOnly=false] - Set to `true` to make this field read-only. If `true`, ignores `borderMode`.
     * @param {boolean} [spellcheck=true] - Set to `false` to disable spell-check to this field (for example when the
     *     value of s Base64 string which clearly does not need spell checking).
     * @param {function} [updateDataCallback] - A callback function for value changes. Invoked with `newData` and
     *     `field`. When `isDataRevert` is set to `true` this function will be invoked on `blur` event.
     * @param {string} [updateDataField=inputName] - The field name to be passed as `field` parameter when invoking
     *     `updateDataCallback` (defaults to `inputName`'s value).
     * @param {boolean} [validationIsRequired=false] - Set to `true` to make this field mandatory. The field will be
     *     invalid if it is empty.
     * @param {string} [validationMaxLength] - Maximum length for this field's input (will add a counter of remaining
     *     characters, unless `hideCounter` is set to `true`). The field will be invalid if its value is longer.
     * @param {string} [validationPattern] - Regex pattern to test the field's input. The field will be invalid if the
     *     value does not match the pattern.
     * @param {boolean} [autoComplete='off'] - A hint to the web browser's auto-fill feature. Forwarded to the
     *     `autocomplete` attribute of HTML `<input>` element.
     * @param {function} [enterCallback] - A callback function for the `keydown` event when the Enter key is down.
     *     Invoked without parameters.
     * @param {string} [inputIcon] - A CSS class name to use for displaying an icon inside the box before the input.
     * @param {boolean} [isClearIcon=false] - Set to `true` to display a "Clear" action icon for emptying the input.
     * @param {Array} [validationRules] - A list of validation rules to check against as input changes. The field will
     *     be invalid if the input does not match any of the rules.
     * @param {string} validationRules[].label - The text to display as the description of the rule. For example:
     *     "Must begin with: A-Z, a-z, 0-9, -".
     * @param {RegExp|function} validationRules[].pattern - The regex pattern to test input against, or a function that
     *     will be invoked with the current input value.
     * @param {string} [validationRules[].name] - A unique name for the rule among the list.
     */
    angular.module('iguazio.dashboard-controls')
        .component('igzValidatingInputField', {
            bindings: {
                autoComplete: '@?',
                bordersMode: '@?',
                compareInputValue: '<?',
                enterCallback: '<?',
                fieldType: '@',
                formObject: '<?',
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
                tabindex: '@?',
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

        var BORDER_MODES = ['always', 'hover', 'focus'];
        var BORDERS_CLASS_BASE = 'borders-';
        var defaultBorderMode = BORDER_MODES[0];
        var defaultInputModelOptions = {
            updateOn: 'default blur',
            debounce: {
                'default': 250,
                '*': 0
            },
            allowInvalid: true
        };
        var fieldElement = {};
        var lastValidValue = '';
        var ngModel = null;
        var showPopUpOnTop = false;

        ctrl.bordersModeClass = '';
        ctrl.data = '';
        ctrl.inputFocused = false;
        ctrl.inputIsTouched = false;
        ctrl.isValidationPopUpShown = false;
        ctrl.preventInputBlur = false;

        ctrl.$onInit = onInit;
        ctrl.$postLink = postLink;
        ctrl.$onChanges = onChanges;
        ctrl.$onDestroy = onDestroy;

        ctrl.clearInputField = clearInputField;
        ctrl.getRemainingCharactersCount = getRemainingCharactersCount;
        ctrl.hasInvalidRule = hasInvalidRule;
        ctrl.isCounterVisible = isCounterVisible;
        ctrl.isFieldInvalid = isFieldInvalid;
        ctrl.isOverflowed = isOverflowed;
        ctrl.onBlur = onBlur;
        ctrl.onChange = onChange;
        ctrl.onFocus = onFocus;
        ctrl.onKeyDown = onKeyDown;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            // set default values for optional component attributes (`<?`, `@?`, `&?`) that are not updated when the
            // scope expression changes (those that change get default values in `$onChanges` lifecycle hook)
            lodash.defaults(ctrl, {
                autoComplete: 'off',
                bordersMode: defaultBorderMode,
                enterCallback: angular.noop,
                hideCounter: false,
                inputModelOptions: {},
                isClearIcon: false,
                isDataRevert: false,
                isDisabled: false,
                itemBlurCallback: angular.noop,
                itemFocusCallback: angular.noop,
                onlyValidCharacters: false,
                readOnly: false,
                spellcheck: true,
                tabindex: '0',
                trim: true,
                updateDataCallback: angular.noop,
                updateDataField: ctrl.inputName,
                validationIsRequired: false
            });

            // if provided `bordersMode` attribute is not one of the available values, set it to a default
            if (!lodash.includes(BORDER_MODES, ctrl.bordersMode)) {
                ctrl.bordersMode = defaultBorderMode;
            }
            ctrl.bordersModeClass = BORDERS_CLASS_BASE + ctrl.bordersMode;

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

                ngModel.$validators.validationRules = function (modelValue) {
                    if (!ctrl.validationIsRequired && ctrl.data === '') {
                        resetPatternsValidity();
                        return true;
                    } else {
                        return checkPatternsValidity(modelValue);
                    }
                };

                // validate on init in case the input field starts with an invalid value
                // important for cases when for example you have an invalid field due to failed rule and then switch to
                // another tab and back to the failed field, it might be re-initialized, but we want it to be displayed
                // with the "failed validation rule" icon
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
         * onChange hook
         * @param {Object} changes
         */
        function onChanges(changes) {
            if (angular.isDefined(changes.inputValue)) {
                ctrl.data = lodash.defaultTo(changes.inputValue.currentValue, '');

                // update `lastValidValue` to later use it on `blur` event in case `is-data-revert` attribute is `true`
                // and the input field is invalid (so the input field could be reverted to the last valid value)
                lastValidValue = angular.copy(ctrl.data);
            }

            if (angular.isDefined(changes.isFocused)) {
                ctrl.inputFocused = lodash.defaultTo(changes.isFocused.currentValue, false);
                if (!changes.isFocused.isFirstChange()) {
                    $timeout(function () {
                        fieldElement.focus();
                    });
                }
            }

            if (angular.isDefined(changes.validationRules)) {
                ctrl.validationRules = lodash.defaultTo(changes.validationRules.currentValue, []);
            }
        }

        /**
         * Destructor
         */
        function onDestroy() {
            angular.element($window).off('animationend');
            $document.off('click', handleValidationIconClick);
        }

        //
        // Public methods
        //

        /**
         * Clears search input field.
         */
        function clearInputField() {
            ctrl.data = '';
            onChange();
        }

        /**
         * Gets count of the remaining characters for the field.
         * @returns {number} count of the remaining characters for the field.
         */
        function getRemainingCharactersCount() {
            var maxLength = Number.parseInt(ctrl.validationMaxLength);
            var currentLength = ctrl.data.length;

            return maxLength <= 0 ? null : (maxLength - currentLength).toString();
        }

        /**
         * Checks whether there is at least one failed validation rule.
         * @returns {boolean} `true` in case there is at least one failed validation rule, or `false` otherwise.
         */
        function hasInvalidRule() {
            return lodash.some(ctrl.validationRules, ['isValid', false]);
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
         * Loses focus from input field.
         * @param {Event} event - the `blur` event object.
         */
        function onBlur(event) {
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

                ctrl.itemBlurCallback({
                    event: event,
                    inputValue: ctrl.data,
                    inputName: ctrl.inputName
                });
            }
        }

        /**
         * Updates outer model value on inner model value change.
         */
        function onChange() {
            ngModel.$validate();
            if (ngModel.$valid) {
                // update `lastValidValue` to later use it on `blur` event in case `is-data-revert` attribute is `true`
                // and the input field is invalid (so the input field could be reverted to the last valid value)
                lastValidValue = ctrl.data;
            }

            if (!ctrl.isDataRevert) {
                ctrl.updateDataCallback({
                    newData: ctrl.data,
                    field: ctrl.updateDataField
                });
            }
        }

        /**
         * Puts focus on input field.
         * @param {Event} event - The `focus` event object.
         */
        function onFocus(event) {
            ctrl.inputFocused = true;

            if (!lodash.isEmpty(ctrl.validationRules)) {
                ctrl.inputIsTouched = true;
            }

            ctrl.itemFocusCallback({
                event: event,
                inputValue: ctrl.data,
                inputName: ctrl.inputName
            });
        }

        /**
         * Handles the 'keyDown' event.
         * @param {Event} event - The `keydown` event object.
         */
        function onKeyDown(event) {
            if (event.keyCode === EventHelperService.ENTER) {
                $timeout(ctrl.enterCallback);
            }
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
         * Sets all validation rules to be valid
         */
        function resetPatternsValidity() {
            lodash.forEach(ctrl.validationRules, function (rule) {
                rule.isValid = true;
            });
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
                } else {
                    ctrl.updateDataCallback({
                        newData: ctrl.data,
                        field: ctrl.updateDataField
                    });
                }
            }
        }
    }
}());
