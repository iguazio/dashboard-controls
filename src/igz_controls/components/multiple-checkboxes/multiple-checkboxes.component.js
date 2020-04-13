(function () {
    'use strict';

    /**
     * @name igzMultipleCheckboxes
     * @description
     * Multiple checkboxes input component. This component is composed of a list of options. Each option has a label
     * and a value. This list is rendered in the view as a list of checkboxes with labels. The model is an array of
     * strings. On checking a checkbox, its corresponding option's value is added to the model array. On un-checking
     * a checkbox, its corresponding option's value is removed from the model array. If `required` is specified on the
     * component's element, it means that an empty array is not allowed, i.e. if all checkboxes are un-checked, the
     * element is invalid.
     *
     * @param {Array.<string>} ng-model - an array of strings to be set by the component.
     *     Replacing this array (by reference) will update the state of the options' checkboxes accordingly.
     *     Mutating it will have no effect (e.g. pushing new items to it, pulling items from it or mutating the items).
     *     Note: string values in the assigned array model that do not match some option's `value` property will be
     *     filtered out of the model array.
     * @param {Array.<Object>} options - an array of objects describing the available options.
     *     Replacing this array (by reference) will update the option list and re-rendered it in the view.
     *     Mutating it will have no effect (e.g. pushing new items to it, pulling items from it, or mutating the items).
     *     Note: string values in the assigned array model that do not match some option's `value` property will be
     *     filtered out of the model array.
     *     Note: properties other than `value`, `label` and `disabled` of objects in `options` array are ignored.
     * @param {string} options[].value - the string value to be add to/remove from model on checking/un-checking this
     *     option.
     * @param {string} options[].label - the text of the label to display next to the checkbox.
     * @param {boolean} [options[].disabled=false] - `true` if this option should be disabled, `false` or omitted
     *     otherwise.
     * @param {string} [options[].id] - if provided this string will be used as the HTML `id` attribute of the
     *     `<option>` element.
     * @param {string} [options[].tooltipText] - text to display in tooltip when hovering on this option.
     * @param {boolean} [options[].enableTooltip=false] - `true` if tooltip should be display. Defaults to `false`.
     * @param {boolean} [options[].visibility=true] - `true` if checkbox should be display. Defaults to `true`.
     * @param {string} [baseId] - a string used for the `id` attribute of `<input type="checkbox">` element and `for`
     *     attribute of the `<label>` element, so clicking on the label will toggle the checkbox. If omitted, the
     *     component will supply an id of itself.
     * @param {boolean} [disabled=false] - set to `true` to make this instance of the component read-only. This property
     *     overrides the per-option `disabled` property.
     * @param {string} [labelPath='label'] - path to the string property inside each object of `options` array to be
     *     used as label.
     * @param {string} [valuePath='value'] - path to the string property inside each object of `options` array to be
     *     used as value.
     * @param {string} [disabledPath='disabled'] - path to the string property inside each object of `options` array to
     *     be used as disabled indicator.
     *
     * @example:
     * ```js
     * angular.module('iguazio.dashboard-controls')
     *     .component('someComponent', {
     *         template: '<igz-multiple-checkboxes data-ng-model="$ctrl.interfacesKinds" ' +
     *                                            'data-options="$ctrl.interfaceList" ' +
     *                                            'data-base-id="interface-kind"></igz-multiple-checkboxes>',
     *         controller: function () {
     *             var ctrl = this;
     *
     *             ctrl.interfaceKinds = [];
     *             ctrl.interfaceList = [
     *                 {
     *                     value: 'web',
     *                     label: 'Web'
     *                 },
     *                 {
     *                     value: 'spark',
     *                     label: 'Spark & Hadoop',
     *                     disabled: false
     *                 },
     *                 {
     *                     value: 'fuse',
     *                     label: 'File'
     *                 },
     *                 {
     *                     value: 'presto',
     *                     label: 'Presto
     *                 }
     *             ];
     *         }
     *     });
     * ```
     *
     * ```js
     * angular.module('iguazio.dashboard-controls')
     *     .component('someComponent', {
     *         template: '<igz-multiple-checkboxes data-ng-model="$ctrl.interfacesKinds" ' +
     *                                            'data-options="$ctrl.interfaceList" ' +
     *                                            'data-base-id="interface-kind" ' +
     *                                            'data-label-path="ui.label" ' +
     *                                            'data-value-path="attr.kind ' +
     *                                            'data-disabled-path="attr.disabled"></igz-multiple-checkboxes>',
     *         controller: function () {
     *             var ctrl = this;
     *
     *             ctrl.interfaceKinds = [];
     *             ctrl.interfaceList = [
     *                 {
     *                     attr: {
     *                         name: 'web'
     *                     },
     *                     ui: {
     *                         label: 'Web'
     *                     }
     *                 },
     *                 {
     *                     attr: {
     *                         value: 'spark',
     *                         disabled: true
     *                     },
     *                     ui: {
     *                         label: 'Spark & Hadoop'
     *                     }
     *                 },
     *                 {
     *                     attr: {
     *                         value: 'fuse'
     *                     },
     *                     ui: {
     *                         label: 'File'
     *                     }
     *                 },
     *                 {
     *                     attr: {
     *                         value: 'presto'
     *                     },
     *                     ui: {
     *                         label: 'Presto
     *                     }
     *                 }
     *             ];
     *         }
     *     });
     * ```
     */
    angular.module('iguazio.dashboard-controls')
        .component('igzMultipleCheckboxes', {
            require: {
                ngModelCtrl: 'ngModel'
            },
            bindings: {
                baseId: '@?',
                disabled: '<?',
                disabledPath: '@?',
                dropdown: '<',
                dropdownApply: '<',
                dropdownApplyCallback: '&?',
                groups: '<',
                labelPath: '@?',
                options: '<',
                selectAllNone: '<',
                stringArray: '=ngModel',
                title: '@?',
                valuePath: '@?'
            },
            templateUrl: 'igz_controls/components/multiple-checkboxes/multiple-checkboxes.tpl.html',
            controller: IgzMultipleCheckboxes
        });

    function IgzMultipleCheckboxes(lodash) {
        var ctrl = this;

        var LABEL_PATH_DEFAULT = 'label';
        var VALUE_PATH_DEFAULT = 'value';
        var DISABLED_PATH_DEFAULT = 'disabled';
        var TOOLTIP_ENABLED = 'enableTooltip';
        var TOOLTIP_TEXT = 'tooltipText';
        var BASE_ID_DEFAULT = 'igz_multiple_checkboxes_' + Date.now() + '_';
        var VISIBILITY_DEFAULT = 'visibility';

        ctrl.checkedItemsCount = 0;
        ctrl.isAllItemsChecked = false;
        ctrl.isDropdownOpened = false;
        ctrl.isSearchInputFocused = false;

        // stores the inner copy of the option list (so parent copy is not mutated by this component)
        ctrl.optionList = null;

        ctrl.$onInit = onInit;
        ctrl.$onChanges = onChanges;

        ctrl.addItem = addItem;
        ctrl.onApply = onApply;
        ctrl.onCancel = onCancel;
        ctrl.onCheckAllItems = onCheckAllItems;
        ctrl.onSearchInputChange = onSearchInputChange;
        ctrl.toggleAddItemField = toggleAddItemField;
        ctrl.toggleDropdown = toggleDropdown;
        ctrl.toggleSearchInputFocus = toggleSearchInputFocus;
        ctrl.updateViewValue = updateViewValue;
        ctrl.isDisabled = isDisabled;

        //
        // Hook methods
        //

        function onInit() {
            lodash.defaults(ctrl, {
                disabled: false,
                dropdown: false,
                dropdownApply: false,
                groups: false,
                selectAllNone: false
            });

            if (lodash.isNil(ctrl.optionList)) {
                ctrl.optionList = ctrl.groups ? {} : [];
            }

            // register $isEmpty to make "required" work properly for empty array
            ctrl.ngModelCtrl.$isEmpty = lodash.isEmpty;

            // on model-value change, update view: set each checkbox state (checked/un-checked) according to model
            ctrl.ngModelCtrl.$render = function () {
                updateOptionsState();
                // ctrl.updateViewValue();
            };
        }

        /**
         * Updates the internal `ctrl.optionList` according to and on change of the assigned bindings: `options`,
         * `labelPath` and `valuePath`
         * @param {Object} changesObject - AngularJS's changes-object
         */
        function onChanges(changesObject) {

            // take the new value for bindings that were changed, and take the stored value for the ones that did not
            var newOptionsValue = lodash.get(changesObject, 'options.currentValue', ctrl.options);
            var newLabelPath = lodash.get(changesObject, 'labelPath.currentValue', ctrl.labelPath);
            var newValuePath = lodash.get(changesObject, 'valuePath.currentValue', ctrl.valuePath);
            var newDisabledPath = lodash.get(changesObject, 'disabledPath.currentValue', ctrl.disabledPath);
            var newBaseId = lodash.get(changesObject, 'baseId.currentValue', lodash.defaultTo(ctrl.baseId, ''));

            if (ctrl.groups) {
                lodash.forEach(newOptionsValue, function (group, name) {
                    lodash.set(ctrl.optionList, name, lodash.omit(newOptionsValue[name], 'options'));

                    var options = lodash.map(group.options, function (option, index) {
                        var id = lodash.defaultTo(option.id, '');

                        return {
                            label: fetchOptionProperty(option, newLabelPath, LABEL_PATH_DEFAULT),
                            value: fetchOptionProperty(option, newValuePath, VALUE_PATH_DEFAULT),
                            disabled: fetchOptionProperty(option, newDisabledPath, DISABLED_PATH_DEFAULT, false),
                            enableTooltip: fetchOptionProperty(option, TOOLTIP_ENABLED, TOOLTIP_ENABLED, false),
                            tooltipText: fetchOptionProperty(option, TOOLTIP_TEXT, TOOLTIP_TEXT),
                            id: generateOptionId(newBaseId, id, index),
                            checked: option.checked,
                            filtered: option.filtered,
                            visibility: fetchOptionProperty(option, VISIBILITY_DEFAULT, VISIBILITY_DEFAULT, true)
                        };
                    });

                    lodash.set(ctrl.optionList, name + '.options', options);
                });
            } else {

                // populate option list using the provided options, label path, value path and disabled path
                // (if any of `labelPath`, `valuePath` or `disabledPath` is empty, or point to an undefined path in option
                // object - then the default value for that path is used)
                ctrl.optionList = lodash.map(newOptionsValue, function (option, index) {
                    var id = lodash.defaultTo(option.id, '');

                    return {
                        label: fetchOptionProperty(option, newLabelPath, LABEL_PATH_DEFAULT),
                        value: fetchOptionProperty(option, newValuePath, VALUE_PATH_DEFAULT),
                        disabled: fetchOptionProperty(option, newDisabledPath, DISABLED_PATH_DEFAULT, false),
                        enableTooltip: fetchOptionProperty(option, TOOLTIP_ENABLED, TOOLTIP_ENABLED, false),
                        tooltipText: fetchOptionProperty(option, TOOLTIP_TEXT, TOOLTIP_TEXT),
                        id: generateOptionId(newBaseId, id, index),
                        checked: option.checked,
                        filtered: option.filtered,
                        visibility: fetchOptionProperty(option, VISIBILITY_DEFAULT, VISIBILITY_DEFAULT, true)
                    };
                });
            }
            ctrl.ngModelCtrl.$render();

            /**
             * Returns the provided string value in case it is a non-empty string, or the default value otherwise (if it
             * is an empty string, `null` or `undefined`)
             * @param {string} stringValue - the string value
             * @param {string} defaultValue - the default value to return in case `stringValue` is empty, `null` or
             *     `undefined`
             * @returns {string} `stringValue` if it is a non-empty string, or `defaultValue` in case `stringValue` is
             *     either an empty string or a `null` or `undefined`
             */
            function getDefaultIfEmpty(stringValue, defaultValue) {
                return lodash.isEmpty(stringValue) ? defaultValue : stringValue;
            }

            /**
             * Fetches a property in an option item.
             * First tries to use the user-defined path.
             * If user-defined path is empty or it does not exist in option then uses default path.
             * If even default path does not exist in option then returns the default value if such is defined.
             * @param {Object} option - the option item from which to fetch the property
             * @param {string} userPath - path to the property in `option`
             * @param {string} defaultPath - the path to use in case `userPath` does not exist in `option`
             * @param {*} [defaultValue] - the value to return in case both `userPath` and `defaultPath` do not exist
             *     in `option`
             * @returns {*} the value at `userPath` in `option` in case it exists, otherwise the value at `defaultPath`
             *     in `option` in case it exists, otherwise `defaultValue`
             */
            function fetchOptionProperty(option, userPath, defaultPath, defaultValue) {

                // use user-defined path if exists (not `null`, `undefined` or `''`), otherwise use default
                var path = getDefaultIfEmpty(userPath, defaultPath);

                // prepare the return value in case above path does not exist in provided option
                var returnValueWhenPathNotFound = lodash.get(option, defaultPath);

                // get the value at path in option
                var returnValue = lodash.get(option, path, returnValueWhenPathNotFound);

                // in case even default path does not exist in option - return the provided default value
                return lodash.defaultTo(returnValue, defaultValue);
            }

            /**
             * Generates the value for `id` attribute of `<input type="checkbox">` element for an option.
             * @param {string} baseId - the string to use as a base for the option id.
             * @param {string} ownId - the specific id defined for the option.
             * @param {number} index - the index of the option in the option list.
             * @returns {string} concatenation of `baseId` and `ownId`. If `ownId` is empty, `index` is used instead.
             *     If both `baseId` and `ownId` are empty, then some default base id is used instead of `baseId` and
             *     `index` is used instead of `ownId`.
             *
             * @example
             * generateOptionId('baseId_', 'ownId', 1);
             * // => 'baseId_OwnId'
             *
             * @example
             * generateOptionId('', 'ownId', 1);
             * // => 'ownId'
             *
             * @example
             * generateOptionId('baseId_', '', 1);
             * // => 'baseId_1'
             *
             * @example
             * generateOptionId('', '', 1);
             * // => 'igz_multiple_checkboxes_1538567062180_1'
             */
            function generateOptionId(baseId , ownId, index) {
                return lodash.isEmpty(baseId + ownId)                        ? BASE_ID_DEFAULT + index :
                       lodash.isEmpty(ownId)                                 ? newBaseId       + index :
                       /* both are non-empty or only `newId` is non-empty */   newBaseId       + ownId ;
            }
        }

        //
        // Public methods
        //

        /**
         * Adds new item to options list.
         * Available only for groups mode in dropdown.
         * @param {string} inputValue - new item value
         * @param {Object} group - new item's group model
         * @param {string} name - group name
         */
        function addItem(inputValue, group, name) {
            if (group.addingEnabled && !lodash.isEmpty(inputValue)) {
                lodash.get(ctrl.optionList, name + '.options').unshift({
                    id: inputValue,
                    label: inputValue,
                    value: inputValue,
                    enableTooltip: false,
                    disabled: false,
                    checked: true,
                    filtered: false
                });

            }

            ctrl.toggleAddItemField(group, name);
            ctrl.updateViewValue();
        }

        /**
         * Callback on 'Apply' changes.
         */
        function onApply() {
            if (angular.isFunction(ctrl.dropdownApplyCallback)) {
                toggleDropdown();

                ctrl.dropdownApplyCallback({data: ctrl.optionList});
            }
        }

        /**
         * Callback on 'Cancel' button
         */
        function onCancel() {
            onSearchInputChange('');
            toggleDropdown();
        }

        /**
         * Callback on master checkbox state changes.
         * @param {Event} event - event object
         * @param {string} name - group name
         */
        function onCheckAllItems(event, name) {
            if (ctrl.groups && !lodash.isNil(name)) {
                var options = lodash.get(ctrl.optionList, name + '.options');
                var isAllItemsChecked = !lodash.get(ctrl.optionList, name + '.allItemsChecked');

                lodash.forEach(options, function (option) {
                    lodash.set(option, 'checked', isAllItemsChecked);
                });

                lodash.assign(ctrl.optionList[name], {
                    allItemsChecked: isAllItemsChecked,
                    itemsChecked: isAllItemsChecked ? options.length : 0,
                    options: options
                });
            } else {
                ctrl.isAllItemsChecked = !ctrl.isAllItemsChecked;
                ctrl.checkedItemsCount = ctrl.isAllItemsChecked ? ctrl.optionList.length : 0;

                lodash.forEach(ctrl.optionList, function (option) {
                    option.checked = ctrl.isAllItemsChecked;
                });
            }
        }

        /**
         * Callback on search input changes.
         * @param {string} searchData
         */
        function onSearchInputChange(searchData) {
            if (lodash.isEmpty(searchData) || lodash.isNil(searchData)) {
                lodash.forEach(ctrl.optionList, function (group) {
                    lodash.forEach(group.options, function (option) {
                        lodash.set(option, 'filtered', false);
                    });
                });
            } else {
                lodash.forEach(ctrl.optionList, function (item) {
                    if (ctrl.groups) {
                        lodash.forEach(item.options, function (option) {
                            lodash.set(option, 'filtered', !lodash.startsWith(option.value.toLowerCase(), searchData));
                        });
                    } else {
                        lodash.set(item, 'filtered', !lodash.startsWith(item.value.toLowerCase(), searchData));
                    }
                });
            }
        }

        /**
         * Toggles add new item field visibility
         * @param {Object} group - new item's group model
         * @param {string} name - group name
         */
        function toggleAddItemField(group, name) {
            if (group.addingEnabled) {
                var isVisible = !lodash.get(ctrl.optionList, name + '.addItemInputVisible', false);

                lodash.set(ctrl.optionList, name + '.addItemInputVisible', isVisible);
            }
        }

        /**
         * Toggles dropdown visibility
         */
        function toggleDropdown() {
            ctrl.isDropdownOpened = !ctrl.isDropdownOpened;
        }

        /**
         * Toggles search input focus/blur for style changes
         */
        function toggleSearchInputFocus() {
            ctrl.isSearchInputFocused = !ctrl.isSearchInputFocused;
        }

        /**
         * Sets a new state to the view-value, which is an array of strings corresponding to the checked options
         */
        function updateViewValue() {
            var newViewValue = ctrl.groups ? {} : [];

            if (ctrl.groups) {
                lodash.forEach(ctrl.optionList, function (group, key) {
                    var checkedItems = lodash.filter(group.options, 'checked');

                    group.allItemsChecked = checkedItems.length === group.options.length;

                    lodash.set(ctrl.optionList, key + '.itemsChecked', checkedItems.length);
                    lodash.set(newViewValue, key, lodash.map(checkedItems, 'value'));
                });

                if (!ctrl.dropdownApply && angular.isFunction(ctrl.dropdownApplyCallback)) {
                    ctrl.dropdownApplyCallback({data: ctrl.optionList});
                }
            } else {
                var checkedItems = lodash.filter(ctrl.optionList, 'checked');

                if (ctrl.selectAllNone) {
                    ctrl.isAllItemsChecked = checkedItems.length === ctrl.optionList.length;
                    ctrl.checkedItemsCount = checkedItems.length;
                }

                newViewValue = lodash.map(checkedItems, 'value');
            }

            ctrl.ngModelCtrl.$setViewValue(newViewValue, 'change');
        }

        /**
         * Tests whether a provided option should be disabled or not.
         * @param {{disabled: boolean}} option - the option to test
         * @returns {boolean} `true` if this option should be disabled, or `false` otherwise
         */
        function isDisabled(option) {
            return ctrl.disabled || option.disabled;
        }

        //
        // Private methods
        //

        /**
         * Checks the options that correspond to the string values inside the model, and un-checks the rest.
         */
        function updateOptionsState() {
            if (ctrl.groups) {
                lodash.forEach(ctrl.optionList, function (group, name) {
                    var viewValue = lodash.get(ctrl.ngModelCtrl.$viewValue, name, []);

                    lodash.forEach(group.options, function (option) {
                        option.checked = group.allItemsChecked ? true : lodash.includes(viewValue, option.value);
                    });
                });
            } else {
                lodash.forEach(ctrl.optionList, function (option) {
                    option.checked = lodash.includes(ctrl.ngModelCtrl.$viewValue, option.value);
                });
            }
        }
    }
}());
