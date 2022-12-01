/*
Copyright 2018 Iguazio Systems Ltd.
Licensed under the Apache License, Version 2.0 (the "License") with
an addition restriction as set forth herein. You may not use this
file except in compliance with the License. You may obtain a copy of
the License at http://www.apache.org/licenses/LICENSE-2.0.
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. See the License for the specific language governing
permissions and limitations under the License.
In addition, you may not use the software for any purposes that are
illegal under applicable law, and the grant of the foregoing license
under the Apache 2.0 license is conditioned upon your compliance with
such restriction.
*/
/* eslint max-statements: ["error", 100] */
/* eslint complexity: ["error", 12] */
(function () {
    'use strict';

    /**
     * @name igzDefaultDropdown
     * @description
     * Default drop down component. This component is a toggleable menu that allows the user to choose one value from a
     * predefined list. It can also become a combo-box where the user can enter text. It can also auto-complete the
     * option by the partially enetered value.
     *
     * @param {Object|string} selectedItem - an object/string to be set by the component.
     *     The value that will be set as selected item from predefined list.
     *     Note: if `enableTyping` is equal to `true` it means that the user can mutate this value. In this case
     *     after modifying the value the new list item will be created.
     * @param {Array.<Object>} valuesArray - an array of objects describing the available options that user can select.
     * @param {boolean} [additionalClass] - optionally add another CSS class name to the containing HTML element of the drop-down.
     * @param {boolean} [autocomplete=false] - set to `true` to allow filtering of options by entered text.
     * @param {boolean} [autocompleteIgnoreCase=false] - set to `true` to ignore case while filtering options.
     * @param {boolean} [autocompleteMatch='prefix'] - set to `'prefix'` to match the entered text as a prefix of an
     *     option, or `'contains'` to match it as a substring anywhere in the option.
     * @param {function} [bottomButtonCallback] - callback on toggleable menu's bottom button click.
     * @param {string} [bottomButtonText] - the text of the toggleable menu's bottom button.
     * @param {string} [dropdownType='regular'] - type of the predefined dropdown (`'regular'`, `'badges-dropdown'`,
     *     `'priority'`).
     * @param {boolean} [enableTyping=false] - set to `true` to allow typing new value in the collapsed dropdown input.
     *     In case the entered value does not match any of the options in `valuesArray`, the `item` parameter passed
     *     to `itemSelectCallback` will have a `typed` property of `true`.
     * @param {boolean} [enableOverlap=false] - set to `true` to dropdown overlap the parental block (please set z-index
     *     for `.default-container` if it needed).
     * @param {Object} [formObject] - form object.
     * @param {string} [inputName] - name of the input.
     * @param {boolean} [iconClass='igz-icon-dropdown'] - a CSS class name to use for the drop-down arrow icon.
     * @param {boolean} [isDisabled=false] - set to `true` to make this instance of the component read-only.
     * @param {boolean} [isFocused=false] - should input be focused when screen is displayed
     * @param {boolean} [isCapitalized=false] - set to `true` to make capitalized all text from listing and selected
     *     value.
     * @param {boolean} [isPagination=false] - set to `true` to remove check mark from selected list`s item.
     *     Note: only for pagination dropdown.
     * @param {boolean} [isRequired=false] - set to `true` to make required selection of a value.
     * @param {string} [itemSelectField] - name of the field that should be set from the selected value.
     * @param {function} [itemSelectCallback] - callback on selecting item from a list.
     * @param {Object} [matchPattern] - pattern for validating typed value if enableTyping is `true`.
     * @param {string} [nameKey] - name of the list`s item which should be shown.
     * @param {function} [onOpenDropdown] - callback on opening dropdown menu.
     * @param {function} [onCloseDropdown] - callback on closing dropdown menu.
     * @param {boolean} [readOnly=false] - marked dropdown as `readonly`.
     * @param {boolean} [preventDropUp=false] - set to `true` to prevent drop up the menu.
     * @param {string} [placeholder] - text which should be shown if no value is selected.
     * @param {string} [selectPropertyOnly] - name of the property which should be set to selectedItem.
     *     Note: in that case ctrl.selectedItem will be a string value.
     * @param {boolean} [skipSelection=false] - make the dropdown unselectable. On selecting any item, dropdown doesn't
     *     select it, and always shows placeholder.
     * @param {boolean} [trim=true] - whether the input value will automatically trim
     */
    angular.module('iguazio.dashboard-controls')
        .component('igzDefaultDropdown', {
            bindings: {
                additionalClass: '@?',
                autocomplete: '<?',
                autocompleteIgnoreCase: '<?',
                autocompleteMatch: '@?',
                selectedItem: '<',
                valuesArray: '<',
                bottomButtonCallback: '<?',
                bottomButtonText: '@?',
                dropdownType: '@?',
                enableTyping: '<?',
                enableOverlap: '<?',
                formObject: '<?',
                iconClass: '@?',
                inputName: '@?',
                isDisabled: '<?',
                isFocused: '<?',
                isCapitalized: '<?',
                isPagination: '<?',
                isRequired: '<?',
                itemSelectField: '@?',
                itemSelectCallback: '&?',
                matchPattern: '<?',
                nameKey: '@?',
                onOpenDropdown: '&?',
                onCloseDropdown: '&?',
                readOnly: '<?',
                preventDropUp: '<?',
                placeholder: '@?',
                selectPropertyOnly: '@?',
                skipSelection: '<?',
                trim: '<?'
            },
            templateUrl: 'igz_controls/components/default-dropdown/default-dropdown.tpl.html',
            transclude: true,
            controller: IgzDefaultDropdownController
        });

    function IgzDefaultDropdownController($scope, $element, $document, $timeout, $transclude, $window, lodash,
                                          EventHelperService, FormValidationService, PreventDropdownCutOffService,
                                          PriorityDropdownService, SeverityDropdownService) {
        var ctrl = this;

        var valuesArrayCopy = [];

        ctrl.topPosition = 'inherit';
        ctrl.typedValue = '';
        ctrl.isDropdownContainerShown = false;
        ctrl.isDropUp = false;
        ctrl.selectedItemDescription = '';
        ctrl.isTranscludePassed = false;

        ctrl.$onInit = onInit;
        ctrl.$onChanges = onChanges;
        ctrl.$onDestroy = onDestroy;
        ctrl.$postLink = postLink;

        ctrl.checkIsRequired = checkIsRequired;
        ctrl.getDescription = getDescription;
        ctrl.getIcon = getIcon;
        ctrl.getNameTemplate = getNameTemplate;
        ctrl.getTooltip = getTooltip;
        ctrl.getValuesArray = getValuesArray;
        ctrl.isItemSelected = isItemSelected;
        ctrl.isPlaceholderClass = isPlaceholderClass;
        ctrl.isShowDropdownError = isShowDropdownError;
        ctrl.isTypingEnabled = isTypingEnabled;
        ctrl.onChangeTypingInput = onChangeTypingInput;
        ctrl.onDropDownKeydown = onDropDownKeydown;
        ctrl.onItemKeydown = onItemKeydown;
        ctrl.selectItem = selectItem;
        ctrl.showSelectedItem = showSelectedItem;
        ctrl.toggleDropdown = toggleDropdown;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            lodash.defaults(ctrl, {
                autocomplete: false,
                autocompleteIgnoreCase: false,
                autocompleteMatch: 'prefix',
                dropdownType: 'regular',
                enableOverlap: false,
                enableTyping: false,
                iconClass: 'igz-icon-dropdown',
                isCapitalized: false,
                isDisabled: false,
                isFocused: false,
                isPagination: false,
                isRequired: false,
                preventDropUp: false,
                readOnly: false,
                skipSelection: false,
                trim: true
            });

            valuesArrayCopy = angular.copy(ctrl.valuesArray);

            if (ctrl.dropdownType === 'priority') {
                ctrl.valuesArray = PriorityDropdownService.getPrioritiesArray();
            }

            if (ctrl.dropdownType === 'severity') {
                ctrl.valuesArray = SeverityDropdownService.getSeveritiesArray();
            }

            setDefaultInputValue();

            setDefaultPlaceholder();

            setEmptyObjectIfNullSelected();

            setValuesVisibility();

            if (ctrl.enableOverlap) {
                resizeDropdownContainer();
                angular.element($window).on('resize', resizeDropdownContainer);
            }

            // checks if transclude template was passed
            $transclude(function (transclude) {
                ctrl.isTranscludePassed = transclude.length > 0 && !(

                    // a single text node with whitespace only, meaning there is nothing important between the opening
                    // tag `<igz-default-dropdown>` and the closing tag `</igz-default-dropdown>`
                    transclude.length === 1 && transclude[0].nodeType === 3 && transclude.text().trim() === ''
                );
            });

            // set focus (for using keyboard) if ctrl.isFocused is true
            $timeout(function () {
                if (ctrl.isFocused) {
                    var elementToFocus = ctrl.isTypingEnabled() ? '.default-dropdown-field input' :
                                                                  '.default-dropdown-field';

                    $element.find(elementToFocus).first().focus();
                }
            }, 500);

            $scope.$on('close-drop-down', unselectDropdown);
        }

        /**
         * On changes hook method
         * @param {Object} changes
         */
        function onChanges(changes) {
            if (angular.isDefined(changes.selectedItem)) {
                if (!changes.selectedItem.isFirstChange()) {
                    setDefaultInputValue();
                }
            }

            if (angular.isDefined(changes.valuesArray)) {
                if (!changes.valuesArray.isFirstChange()) {
                    ctrl.valuesArray = angular.copy(changes.valuesArray.currentValue);
                    valuesArrayCopy = angular.copy(ctrl.valuesArray);

                    setValuesVisibility();
                    setDefaultInputValue();
                }
            }
        }

        /**
         * Post linking method
         */
        function postLink() {
            if (!ctrl.enableOVerlap) {
                PreventDropdownCutOffService.preventDropdownCutOff($element, '.default-dropdown-container');
            }
            $document.on('click', unselectDropdown);
        }

        /**
         * Destructor method
         */
        function onDestroy() {
            $document.off('click', unselectDropdown);
            angular.element($window).off('resize', resizeDropdownContainer);
        }

        //
        // Public methods
        //

        /**
         * Sets required flag
         */
        function checkIsRequired() {
            return Boolean(ctrl.isRequired);
        }

        /**
         * Returns the description of the provided item. Searches for a direct `description` property, or a
         * `description` property inside an `attr` property
         * @param {Object} item - the item whose description should be returned
         * @returns {string}
         */
        function getDescription(item) {
            return lodash.get(item, 'description', lodash.get(item, 'attr.description'), '');
        }

        /**
         * Returns the tooltip of the provided item
         * @param {Object} item - the item whose tooltip should be returned
         * @returns {string}
         */
        function getTooltip(item) {
            return lodash.get(item, 'tooltip', '');
        }

        /**
         * Returns the icon of the provided item.
         * @param {Object} item - the item whose icon should be returned
         * @returns {string}
         */
        function getIcon(item) {
            return lodash.get(item, 'icon', '');
        }

        /**
         * Returns the name of the provided item. Searches for a direct `nameTemplate` property
         * @param {Object} item - the item whose name should be returned
         * @returns {string}
         */
        function getNameTemplate(item) {
            return lodash.get(item, 'nameTemplate', getName(item));
        }

        /**
         * Gets array of available values
         * @returns {Array}
         */
        function getValuesArray() {
            return ctrl.valuesArray;
        }

        /**
         * Determines whether current item selected
         * @param {Object} item - current item
         * @returns {boolean}
         */
        function isItemSelected(item) {
            return angular.isDefined(ctrl.selectPropertyOnly) ?
                ctrl.selectedItem === lodash.get(item, ctrl.selectPropertyOnly) :
                lodash.isEqual(ctrl.selectedItem, item);
        }

        /**
         * Checks if placeholder class should be set on input field
         * @returns {boolean}
         */
        function isPlaceholderClass() {
            return angular.isDefined(ctrl.selectPropertyOnly) ?
                ctrl.selectedItem === null :
                ctrl.selectedItem.id === null;
        }

        /**
         * Checks whether show error if custom dropdown is invalid or on whole form validation (on submit, tab switch)
         * @param {Object} form
         * @param {string} elementName
         * @returns {boolean|undefined}
         */
        function isShowDropdownError(form, elementName) {
            return ctrl.isRequired ?
                FormValidationService.isShowFieldInvalidState(form, elementName) :
                undefined;
        }

        /**
         * Checks if the typing in dropdown's field is enabled
         * @returns {boolean}
         */
        function isTypingEnabled() {
            return ctrl.enableTyping || ctrl.autocomplete;
        }

        /**
         * Changes selected item depending on typed value
         */
        /* eslint complexity: ["error", 13] */
        function onChangeTypingInput() {
            ctrl.isDropdownContainerShown = false;

            if ((ctrl.enableTyping || ctrl.autocomplete) && lodash.isEmpty(ctrl.typedValue)) {
                ctrl.valuesArray = valuesArrayCopy;

                ctrl.formObject[ctrl.inputName].$setValidity('text', true);

                if (!ctrl.isRequired) {
                    ctrl.selectItem({
                        id: '',
                        name: '',
                        visible: true
                    });
                }

                // emulate a click to open drop-down menu in case the user cleared the text input field
                $element.find('.default-dropdown-field')[0].dispatchEvent(new Event('click'));
            } else {
                if (ctrl.autocomplete) {
                    var typedValue = ctrl.autocompleteIgnoreCase ? ctrl.typedValue.toLowerCase() : ctrl.typedValue;

                    ctrl.valuesArray = lodash.filter(valuesArrayCopy, function (item) {
                        var itemName = ctrl.autocompleteIgnoreCase ? item.name.toLowerCase() : item.name;

                        return ctrl.autocompleteMatch === 'contains' ? lodash.includes(itemName, typedValue) :
                            lodash.startsWith(itemName, typedValue);
                    });

                    if (ctrl.valuesArray.length > 0) {
                        $element.find('.default-dropdown-field')[0].dispatchEvent(new Event('click'));
                        if (ctrl.formObject[ctrl.inputName].$invalid) {
                            ctrl.formObject[ctrl.inputName].$setValidity('text', true);
                        }
                    } else if (!ctrl.enableTyping) {
                        ctrl.formObject[ctrl.inputName].$setValidity('text', false);
                    }
                }

                if (ctrl.enableTyping) {
                    var newItem = {
                        id: ctrl.typedValue,
                        typed: true,
                        visible: true
                    };
                    lodash.set(newItem, ctrl.nameKey || 'name', ctrl.typedValue);

                    ctrl.selectItem(lodash.find(ctrl.valuesArray, ['name', ctrl.typedValue]) || newItem);
                }
            }
        }

        /**
         * Handles keydown events on dropdown
         * @param {Object} event
         */
        function onDropDownKeydown(event) {
            switch (event.keyCode) {
                case EventHelperService.UP:
                case EventHelperService.DOWN:
                    if (!ctrl.isDropdownContainerShown) {
                        ctrl.isDropdownContainerShown = true
                    }
                    var firstListItem = $element.find('.default-dropdown-container .list-item').first();
                    firstListItem.focus();
                    break;
                case EventHelperService.TABKEY:
                    ctrl.isDropdownContainerShown = false;
                    break;
                case EventHelperService.SPACE:
                    if (ctrl.trim) {
                        ctrl.isDropdownContainerShown = !ctrl.isDropdownContainerShown;
                    }
                    break;
                case EventHelperService.ENTER:
                    ctrl.isDropdownContainerShown = !ctrl.isDropdownContainerShown;
                    break;
                default:
                    break;
            }
            event.stopPropagation();
        }

        /**
         * Handles keydown events on dropdown items
         * @param {Object} event
         * @param {Object} item - current item
         */
        function onItemKeydown(event, item) {
            var dropdownField = $element.find('.default-dropdown-field').first();
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
                    ctrl.selectItem(item, event);
                    break;
                case EventHelperService.ESCAPE:
                case EventHelperService.TABKEY:
                    dropdownField.focus();
                    ctrl.isDropdownContainerShown = false;
                    break;
                default:
                    break;
            }
            event.preventDefault();
            event.stopPropagation();
        }

        function resizeDropdownContainer() {
            var dropdown = $element.find('.default-dropdown-field')[0];
            var dropdownWidth = lodash.get(window.getComputedStyle(dropdown), 'width');

            angular.element($element.find('.default-dropdown-container')[0]).css('width', dropdownWidth);
        }

        /**
         * Sets current item as selected
         * @param {Object} item - current item
         * @param {Object} [event]
         */
        function selectItem(item, event) {
            if (!item.disabled) {
                var previousItem = angular.copy(ctrl.selectedItem);

                if (!ctrl.skipSelection) {
                    if (angular.isDefined(ctrl.selectPropertyOnly)) {
                        ctrl.selectedItem = lodash.get(item, ctrl.selectPropertyOnly);
                        ctrl.selectedItemDescription = item.description;
                    } else {
                        ctrl.selectedItem = item;
                    }
                    ctrl.typedValue = getName(item);
                }

                if (angular.isFunction(ctrl.itemSelectCallback)) {
                    $timeout(function () {
                        ctrl.itemSelectCallback({
                            item: item,
                            isItemChanged: !lodash.isEqual(previousItem, ctrl.selectedItem),
                            field: angular.isDefined(ctrl.itemSelectField) ? ctrl.itemSelectField : null
                        });
                    });
                }

                if (angular.isDefined(event)) {
                    ctrl.isDropdownContainerShown = false;

                    if (ctrl.autocomplete) {
                        ctrl.valuesArray = valuesArrayCopy;
                    }
                }
            }

            if (!lodash.isNil(event)) {
                event.stopPropagation();
            }
        }

        /**
         * Displays selected item name in dropdown. If model is set to null, set default object
         * @returns {string}
         */
        function showSelectedItem() {
            if (!ctrl.selectedItem) {
                setEmptyObjectIfNullSelected();
                ctrl.hiddenInputValue = '';
            }

            if (angular.isDefined(ctrl.selectPropertyOnly) && (angular.isDefined(ctrl.valuesArray))) {

                // Set description for selected item
                var selectedItemUiValue = lodash.find(ctrl.valuesArray, function (item) {
                    return lodash.get(item, ctrl.selectPropertyOnly) === ctrl.selectedItem;
                });

                ctrl.selectedItemDescription = lodash.get(selectedItemUiValue, 'description', null);

                // Return temporary object used for selected item name displaying on UI input field
                return {
                    name: lodash.get(selectedItemUiValue, 'name', lodash.get(selectedItemUiValue, ctrl.nameKey, ctrl.placeholder)),
                    icon: {
                        name: lodash.get(selectedItemUiValue, 'icon.name', ''),
                        class: lodash.get(selectedItemUiValue, 'icon.class', '')
                    },
                    description: ctrl.selectedItemDescription
                };
            }
            return ctrl.selectedItem;
        }

        /**
         * Shows dropdown element
         * @params {Object} $event
         */
        function toggleDropdown($event) {
            var dropdownContainer = $event.currentTarget;
            var buttonHeight = dropdownContainer.getBoundingClientRect().height;
            var position = dropdownContainer.getBoundingClientRect().top;
            var positionLeft = dropdownContainer.getBoundingClientRect().left;

            ctrl.isDropUp = false;

            if (!ctrl.preventDropUp) {
                if (!ctrl.isDropdownContainerShown) {
                    $timeout(function () {
                        var dropdownMenu = $element.find('.default-dropdown-container');
                        var menuHeight = dropdownMenu.height();

                        if (position > menuHeight && $window.innerHeight - position < buttonHeight + menuHeight) {
                            ctrl.isDropUp = true;
                            ctrl.topPosition = -menuHeight + 'px';
                        } else {
                            ctrl.isDropUp = false;
                            ctrl.topPosition = 'inherit';
                        }

                        if ($window.innerWidth - positionLeft < dropdownMenu.width()) {
                            dropdownMenu.css('right', '0');
                        }
                    });
                }
            }
            ctrl.isDropdownContainerShown = !ctrl.isDropdownContainerShown;

            if (ctrl.isDropdownContainerShown) {
                setValuesVisibility();

                $timeout(function () {
                    setWidth();

                    if (angular.isFunction(ctrl.onOpenDropdown)) {
                        ctrl.onOpenDropdown({ element: $element });
                    }

                    if (ctrl.enableOverlap) {
                        resizeDropdownContainer();
                    }
                });

                if (!ctrl.enableOverlap) {
                    PreventDropdownCutOffService.preventDropdownCutOff($element, '.default-dropdown-container');
                }
            } else {
                if (angular.isFunction(ctrl.onCloseDropdown)) {
                    ctrl.onCloseDropdown();
                }
            }
        }

        //
        // Private methods
        //

        /**
         * Returns the name of the provided item. Searches for a direct `name` property, or searches `name` property by
         * `nameKey`
         * @param {Object} item - the item whose name should be returned
         * @returns {string}
         */
        function getName(item) {
            return lodash.get(item, 'name', lodash.get(item, ctrl.nameKey, ''));
        }

        /**
         * Sets default input value
         */
        function setDefaultInputValue() {
            if (!lodash.isNil(ctrl.selectedItem)) {
                ctrl.typedValue = getName(angular.isDefined(ctrl.selectPropertyOnly) ?
                    lodash.find(ctrl.valuesArray, [ctrl.selectPropertyOnly, ctrl.selectedItem]) : ctrl.selectedItem);

                if (ctrl.typedValue === '' && ctrl.enableTyping) {
                    ctrl.typedValue = ctrl.selectedItem;
                }
            }
        }

        /**
         * Sets default placeholder for drop-down if it's value is not defined
         */
        function setDefaultPlaceholder() {
            if (!ctrl.placeholder) {
                ctrl.placeholder = 'Please select...';
            }
        }

        /**
         * Sets default empty value if any other object has not been defined earlier
         */
        function setEmptyObjectIfNullSelected() {
            if (!ctrl.selectedItem) {
                ctrl.selectedItem = angular.isDefined(ctrl.selectPropertyOnly) ? null : {
                    id: null,
                    name: null
                };
            }
        }

        /**
         * Sets `visible` property for all array items into true if it is not already defined.
         * `visible` property determines whether item will be shown in drop-down list.
         */
        function setValuesVisibility() {
            lodash.forEach(ctrl.valuesArray, function (value) {
                lodash.defaults(value, {visible: true});
            });
        }

        /**
         * Takes the largest element and sets him width as min-width to all elements (needed to style drop-down list)
         */
        function setWidth() {
            var labels = $element.find('.default-dropdown-container ul li').find('.list-item-label');
            var minWidth = lodash(labels)
                .map(function (label) {
                    return angular.element(label)[0].clientWidth;
                })
                .min();

            lodash.forEach(labels, function (label) {
                angular.element(label).css('min-width', minWidth);
            });
        }

        /**
         * Handle click on the document and not on the dropdown field and close the dropdown
         * @param {Object} e - event
         */
        function unselectDropdown(e) {
            if ($element.find(e.target).length === 0) {
                $scope.$evalAsync(function () {
                    ctrl.isDropdownContainerShown = false;
                    ctrl.isDropUp = false;

                    if (angular.isFunction(ctrl.onCloseDropdown)) {
                        ctrl.onCloseDropdown();
                    }
                });
            }
        }
    }
}());
