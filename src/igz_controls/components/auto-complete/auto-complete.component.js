(function () {
    'use strict';

    /**
     * @name igzAutoComplete
     * @component
     *
     * @description
     * An input field that wraps around `igzValidatingInputField` component and enriches it with auto-complete feature.
     * The user enters input to the input field, and a suggestion drop-down menu is open according to the input value.
     * An optional filter drop-down field is available to make it possible to populate the suggestion list according
     * to different criteria, for example different properties of objects like first name or last name of person.
     * The user can click on a suggestion from the menu to select it.
     *
     * @param {string} bordersMode - Forwarded to `bordersMode` attribute of `igzValidatingInputField` component. Please
     *     see that component's docs for more details (which also indicates its default value).
     * @param {string} [browserAutoComplete='off'] - Forwarded to `autoComplete` attribute of `igzValidatingInputField`.
     *     Please see that component's docs for more details. Defaults to `'off'` because usually it is desired to
     *     cancel the built-in auto-completion feature of the web browser when using this component.
     * @param {string} currentValue - The initial value to populate the input field on initialization.
     * @param {Array} filterBy - A list of filter criteria. Each item will be rendered as an option in the filters
     *     drop-down menu.
     * @param {string} filterBy[].label - The label of the drop-down menu option.
     * @param {string} filterBy[].attribute - The value of the drop-down menu option that will be sent when invoking
     *     `onSuggestionSelected` for the parent component to use when compiling the list of suggestions.
     * @param {string} [emptyMessage] - Optionally display a message when suggestion list is empty.
     * @param {Object} formObject - The `<form>` element or `<ng-form>` directive containing this component. It will be
     *     forwarded to the `formObject` attribute of the `igzValidatingInputField` component.
     * @param {string} inputName - The name of the filed, will be forwarded to the `inputName` attribute of the
     *     `igzValidatingInputField` component.
     * @param {boolean} [isDisabled=false] - Set to `true` to make this field disabled. Forwarded to `isDisabled`
     *     attribute of the `igzValidatingInputField` component.
     * @param {boolean} [isFocused=false] - Set to `true` to give focus to this field once it finished initializing.
     *     Forwarded to `isFocused` attribute of the `igzValidatingInputField` component.
     * @param {boolean} [isRequired=false] - Set to `true` to make this field mandatory. The field will be invalid if it
     *     is empty. Forwarded to `validationIsRequired` attribute of the `igzValidatingInputField` component.
     * @param {string} [noMatchPolicy='allow'] - Determines the behavior when the selected suggestion value or the value
     *     on blur does not match any suggestion on the current suggestion list. Could be one of:
     *     - `'allow'` (default): Allows the input value. The input field will be valid.
     *     - `'invalid'`: The input field will be invalid. The input will remain unchanged.
     *     - `'revert'`: Reverts the input field value bacl to the last valid value. The input field will be valid.
     * @param {function} [onBlur] - A callback function for `blur` event. Invoked with `inputValue` and `inputName` when
     *     the field loses focus (if the focus moves from the input field to the suggestion menu - this function will
     *     _not_ be invoked).
     * @param {function} [onEmptyData] - A callback function for the case when input is empty and `suggestionsOnEmpty`
     *     is false. Invoked without any argument.
     * @param {function} [onTextChanged] - A callback function for changed text on losing focus. If it returns a
     *     rejected promise - it would tell this component the value is invalid.
     * @param {function} [onSuggestionSelected] - A callback function for selecting suggestion from suggestion menu.
     *     If it returns a rejected promise - it would tell this component the value is invalid.
     * @param {function} [onRequestSuggestions] - A callback function for retrieving suggestion list when input field
     *     value changes. It is invoked with:
     *     - `input`: The current input field's value
     *     - `filter`: The `attribute` property of the item in `filterBy` array that is corresponding to the selected
     *                 option of the filter drop-down menu.
     *     - `inputName`: The name of the input field.
     *     Suggestion list should be an array of objects where each object has the following properties:
     *     - `value`: the value of the suggestion to use when selecting this suggestion from the drop-down menu.
     *     - `label`: the label to show for this suggestion on the drop-down menu.
     *     - `additionalInfo`: more text to show for the suggestion after the label in the drop-down menu.
     * @param {boolean} [suggestionsOnEmpty=true] - Set to `false` in order to prevent invoking `onRequestSuggestions`
     *     when input value changed and is now empty, and invoke `onEmptyData` instead. Default is `true` which will
     *     invoke `onRequestSuggestions` when input value is empty.
     * @param {string} [placeholder] - Placeholder text to display when input is empty. Forwarded to `placeholderText`
     *     attribute of the `igzValidatingInputField` component.
     * @param {Object} [tooltip] - Allows a tooltip hint to open when hovering the input field. This is useful for not
     *     setting a tooltip on the entire `<auto-complete>` component, which includes the suggestion list too, and it
     *     is not desired to show the tooltip when hovering on the suggestion list, but only when hovering the input
     *     field itself.
     */
    angular.module('iguazio.dashboard-controls')
        .component('igzAutoComplete', {
            bindings: {
                bordersMode: '@?',
                browserAutoComplete: '@?',
                currentValue: '<?',
                emptyMessage: '@?',
                filterBy: '<?',
                formObject: '<',
                inputName: '@',
                isDisabled: '<?',
                isFocused: '<?',
                isRequired: '<?',
                noMatchPolicy: '@?',
                onBlur: '&?',
                onEmptyData: '&?',
                onTextChanged: '&?',
                onRequestSuggestions: '&?',
                onSuggestionSelected: '&?',
                suggestionsOnEmpty: '<?',
                placeholder: '@?',
                tooltip: '<?'
            },
            templateUrl: 'igz_controls/components/auto-complete/auto-complete.tpl.html',
            controller: IgzAutoCompleteController
        });

    function IgzAutoCompleteController($document, $element, $i18next, $q, i18next, lodash, EventHelperService) {
        var ctrl = this;
        var lng = i18next.language;
        var DEFAULT_PLACEHOLDER = $i18next.t('common:PLACEHOLDER.AUTO_COMPLETE_DEFAULT', { lng: lng });
        var lastValidValue = '';
        var NO_MATCH_POLICIES = {
            ALLOW: 'allow',
            INVALID: 'invalid',
            REVERT: 'revert'
        };
        var selectedNoMatchPolicy = NO_MATCH_POLICIES.ALLOW;

        ctrl.filters = [];
        ctrl.isDropdownShown = false;
        ctrl.isMoreLabelShown = false;
        ctrl.isSuggestionsShown = false;
        ctrl.loading = true;
        ctrl.selectedFilter = {};
        ctrl.selectedResult = '';
        ctrl.suggestions = [];

        ctrl.$onInit = onInit;
        ctrl.$onChanges = onChanges;
        ctrl.$onDestroy = onDestroy;
        ctrl.$postLink = postLink;

        ctrl.handleDropDownKeydown = handleDropDownKeydown;
        ctrl.handleFilterChange = handleFilterChange;
        ctrl.handleInputBlur = handleInputBlur;
        ctrl.handleInputChange = handleInputChange;
        ctrl.handleSuggestionClick = handleSuggestionClick;
        ctrl.handleSuggestionKeydown = handleSuggestionKeydown;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            if (angular.isDefined(ctrl.filterBy)) {
                ctrl.isDropdownShown = true;
                initFiltersDropdown();
            }

            // set default values for some of the optional attributes of this component (`<?`, `@?`, `&?`)
            lodash.defaults(ctrl, {
                browserAutoComplete: 'off', // by default, we do not want the browser's auto-completion for this field
                isDisabled: false,
                isFocused: false,
                isRequired: false,
                noMatchPolicy: selectedNoMatchPolicy,
                onBlur: lodash.noop,
                onEmptyData: lodash.noop,
                onTextChanged: lodash.noop,
                onRequestSuggestions: angular.noop,
                onSuggestionSelected: lodash.noop,
                placeholder: DEFAULT_PLACEHOLDER,
                suggestionsOnEmpty: true
            });

            // allow boolean bindings to be provided as either a boolean or a string
            ctrl.isDisabled = String(ctrl.isDisabled).toLowerCase() === 'true';
            ctrl.isFocused = String(ctrl.isFocused).toLowerCase() === 'true';
            ctrl.isRequired = String(ctrl.isRequired).toLowerCase() === 'true';
            ctrl.suggestionsOnEmpty = String(ctrl.suggestionsOnEmpty).toLowerCase() === 'true';

            // if provided `noMatchPolicy` attribute is one of the available values, assign it
            // otherwise `selectedNoMatchPolicy` will remain set to the default value
            if (lodash.includes(NO_MATCH_POLICIES, ctrl.noMatchPolicy)) {
                selectedNoMatchPolicy = ctrl.noMatchPolicy;
            }
        }

        /**
         * On changes hook method.
         * @param {Object} changes
         */
        function onChanges(changes) {
            // store the value of input field to later be able to revert to it on blur (see `handleInputBlur` method)
            if (angular.isDefined(changes.currentValue)) {
                lastValidValue = changes.currentValue.currentValue;
            }
        }

        /**
         * Post linking method
         */
        function postLink() {
            $document.on('click', onDocumentClick);
        }

        /**
         * Destructor method
         */
        function onDestroy() {
            $document.off('click', onDocumentClick);
        }

        //
        // Public methods
        //

        /**
         * Handles `keydown` events on auto-complete suggestion drop-down menu.
         * @param {KeyboardEvent} event - The event.
         */
        function handleDropDownKeydown(event) {
            // allow user to navigate the auto-complete suggestion drop-down menu with the keyboard:
            // use down/up arrow keys to navigate
            // use spacebar or enter to select currently focused suggestion
            switch (event.keyCode) {
                case EventHelperService.UP:
                case EventHelperService.DOWN:
                    if (!ctrl.isSuggestionsShown) {
                        ctrl.isSuggestionsShown = true
                    }
                    var firstListItem = $element.find('.auto-complete-suggestions-container .list-item').first();
                    firstListItem.focus();
                    break;
                case EventHelperService.SPACE:
                    ctrl.isSuggestionsShown = !ctrl.isSuggestionsShown;
                    break;
                case EventHelperService.ENTER:
                    ctrl.isSuggestionsShown = !ctrl.isSuggestionsShown;
                    break;
                default:
                    // ignore any other keystroke
                    break;
            }

            event.stopPropagation();
        }

        /**
         * Handles selection of an option in the filters drop-down menu (even if it is the same option that was already
         * selected).
         * @param {Object} item - The selected item.
         * @param {boolean} isItemChanged - `true` in case a different option was selected, or `false` otherwise.
         */
        function handleFilterChange(item, isItemChanged) {
            if (isItemChanged) {
                ctrl.selectedFilter = item;
            }
        }

        /**
         * Handles blur of the input field.
         * @param {FocusEvent} event - The event.
         * @param {string} value - The value of the input field.
         * @param {string} name - The name of the input field.
         */
        function handleInputBlur(event, value, name) {
            EventHelperService.getFocusedElement(event).then(function (focusedElement) {
                // if the element receiving focus is still within this component (<igz-auto-complete>) - ignore the blur
                // otherwise ...
                if (shouldHandleBlur(focusedElement)) {
                    // if the input value matches one of the auto-complete suggestions, or is equal to the last valid
                    // value, or the no-match policy is set to `allow`
                    ctrl.currentValue = value;
                    var inputMatchSomeSuggestion = lodash.some(ctrl.suggestions, ['value', value]);
                    if (
                        value === lastValidValue ||
                        inputMatchSomeSuggestion ||
                        selectedNoMatchPolicy === NO_MATCH_POLICIES.ALLOW
                    ) {
                        // notify parent component as-if this suggestion was selected and set input field valid
                        ctrl.formObject[ctrl.inputName].$setValidity('noMatch', true);
                        if (value !== lastValidValue) {
                            attemptToUpdateValue(value, ctrl.onTextChanged);
                        }
                    } else if (selectedNoMatchPolicy === NO_MATCH_POLICIES.INVALID) {
                        // if there is no match and no-match policy is set to `invalid` - set input field as invalid
                        // but keep entered input
                        ctrl.formObject[ctrl.inputName].$setValidity('noMatch', false);
                    } else if (selectedNoMatchPolicy === NO_MATCH_POLICIES.REVERT) {
                        // if there is no match and no-match policy is set to `revert` - revert view value back to last
                        // value provided to `ctrl.currentValue` by parent component
                        ctrl.formObject[ctrl.inputName].$setValidity('noMatch', true);
                        ctrl.currentValue = lastValidValue;
                    } else {
                        // should never reach here
                        throw Error('Invalid value for `no-match-policy` in `igzAutoComplete`');
                    }

                    // close the auto-complete suggestion drop-down menu and invoke parent's `onBlur` handler
                    ctrl.isSuggestionsShown = false;
                    ctrl.suggestions = [];
                    ctrl.onBlur({ inputValue: value, inputName: name });
                }
            });
        }

        /**
         * Handles the model change of the input field.
         * @param {string} value - The new value of the input field.
         */
        function handleInputChange(value) {
            ctrl.currentValue = value;
            if (!ctrl.suggestionsOnEmpty && lodash.isEmpty(value)) {
                ctrl.onEmptyData();
                return;
            }

            // request parent component for the suggestion list according to input value
            // ("promisify" the result, so the parent component could return either a promise or not)
            ctrl.loading = true;
            ctrl.isSuggestionsShown = true;
            var result = $q.when(ctrl.onRequestSuggestions({
                input: value,
                filter: ctrl.selectedFilter.id,
                inputName: ctrl.inputName
            }));
            result
                .then(function (response) {
                    ctrl.suggestions = response.suggestions;
                    ctrl.isMoreLabelShown = response.more;
                })
                .finally(function () {
                    ctrl.loading = false;
                    if (lodash.isEmpty(ctrl.suggestions) && lodash.isEmpty(ctrl.emptyMessage)) {
                        ctrl.isSuggestionsShown = false;
                    }
                });
        }

        /**
         * Handles click on a suggestion from the auto-complete suggestion drop-down menu.
         * @param {Object} value - The value of the selected suggestion.
         */
        function handleSuggestionClick(value) {
            attemptToUpdateValue(value, ctrl.onSuggestionSelected);

            ctrl.isSuggestionsShown = false;
            ctrl.suggestions = [];
        }

        /**
         * Handles pressing down a key on the an auto-complete suggestion.
         * @param {KeyboardEvent} event - The event.
         * @param {Object} item - The current item.
         */
        function handleSuggestionKeydown(event, item) {
            var dropdownField = $element.find('.input-row').first();

            switch (event.keyCode) {
                case EventHelperService.UP:
                    if (!lodash.isNull(event.target.previousElementSibling)) {
                        event.target.previousElementSibling.focus();
                        event.stopPropagation();
                    }
                    break;
                case EventHelperService.DOWN:
                    if (!lodash.isNull(event.target.nextElementSibling)) {
                        event.target.nextElementSibling.focus();
                        event.stopPropagation();
                    }
                    break;
                case EventHelperService.SPACE:
                case EventHelperService.ENTER:
                    dropdownField.focus();
                    ctrl.handleSuggestionClick(item.value);
                    break;
                default:
                    // ignore any other keystroke
                    break;
            }

            event.preventDefault();
            event.stopPropagation();
        }

        //
        // Private methods
        //

        /**
         * Attempts to update the field's value to `value` by notifying parent via invoking `method`.
         * If it returns a resolved promise the field will be rendered valid.
         * Otherwise, if a rejected promise is returned, the field will be rendered invalid in case the `invalid`
         * no-match policy is used, or reverted to the last valid value in case the `revert` no-match policy is used.
         * @param {*} value - The value to update to.
         * @param {function} method - The method to invoke to notify parent with `value`.
         */
        function attemptToUpdateValue(value, method) {
            var result = $q.when(method({ value: value, inputName: ctrl.inputName }));
            result
                .then(function () {
                    ctrl.formObject[ctrl.inputName].$setValidity('noMatch', true);
                    lastValidValue = value;

                    // dear future me (or any other developer)
                    // in case no-match policy is 'invalid' and the component is required and the next flow is executed:
                    // 1. box is empty
                    // 2. the user enters 'foo' and selects 'foobar' option from suggestion list
                    // 3. the user empties the box, which makes the field invalid (because required but empty+dirty)
                    // 4. the user enters 'fo' and selects 'foobar' option from suggestion list (again)
                    // without the next line, the box will have 'fo' instead of 'foobar'
                    ctrl.currentValue = value;
                })
                .catch(function () {
                    if (selectedNoMatchPolicy === NO_MATCH_POLICIES.INVALID) {
                        // if there is no match and no-match policy is set to `invalid` - set input field as invalid
                        // but keep entered input
                        ctrl.formObject[ctrl.inputName].$setValidity('noMatch', false);
                    } else if (selectedNoMatchPolicy === NO_MATCH_POLICIES.REVERT) {
                        // if there is no match and no-match policy is set to `revert` - revert view value back to last
                        // valid value
                        ctrl.formObject[ctrl.inputName].$setValidity('noMatch', true);
                        ctrl.currentValue = lastValidValue;
                    } else {
                        // should never reach here
                        throw Error('Invalid value for `no-match-policy` in `igzAutoComplete`');
                    }
                });
        }

        /**
         * Initializes auto-complete filters object.
         */
        function initFiltersDropdown() {
            ctrl.filters = lodash.map(ctrl.filterBy, function (filter) {
                return {
                    id: filter.attribute,
                    name: filter.label
                };
            });

            ctrl.selectedFilter = lodash.head(ctrl.filters);
        }

        /**
         * Handles mouse click on document.
         * @param {MouseEvent} event - The event.
         */
        function onDocumentClick(event) {
            // if the auto-complete suggestion drop-down menu is open and the user clicks outside of this auto-complete
            // element - close the menu
            if (ctrl.isSuggestionsShown) {
                if ($element.find(event.target).length === 0) {
                    ctrl.isSuggestionsShown = false;
                }
            }
        }

        /**
         * Determines whether the input field should handle blur event according to the focused element.
         * @param {HTMLElement} focusedElement - The element receiving focus.
         * @returns {boolean} `true` in case the input field should handle blur event, or `false` otherwise.
         */
        function shouldHandleBlur(focusedElement) {
            return angular.element(focusedElement).is('.list-item.readonly') ||
                $element.find(focusedElement).length === 0 && $document.find(focusedElement).length > 0;
        }
    }
}());
