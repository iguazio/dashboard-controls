(function () {
    'use strict';

    /**
     * An option on the dropdown.
     * @typedef {Object} SortOption
     * @property {boolean} active - Indicates whether the option is active (selected).
     * @property {boolean} desc - Indicates whether the sort order is descending.
     * @property {string} label - The label of the option for display.
     * @property {string} value - Unique identifier of the option (will not be displayed).
     * @property {boolean} visible - Indicates whether the option is visible.
     *
     * @name igzSortDropdown
     * @component
     *
     * @description
     * An icon button with a drop-down menu consisting of names for sorting. The selected option has a checkmark.
     * Re-selecting the selected option will change its sort order (ascending/descending).
     * Selecting a different option always starts from ascending order.
     *
     * @param {Array.<SortOption>} sortOptions - The list of options.
     * @param {SortOption} selectedOption - Set this to the value of the option to select. Use this attribute to
     *     programmatically set the selected option.
     * @param {boolean} reverseSorting - Set to `true` to apply descending order of the selected option. Set to `false`
     *     or omit to apply ascending order of the selected option. Use this to programmatically set the sorting order.
     * @param {function} [onSortChange] - A callback handler function for selecting a sorting option. It will be invoked
     *     with _option_ (the selected element from `sortOptions` array).
     */

    angular.module('iguazio.dashboard-controls')
        .component('igzSortDropdown', {
            bindings: {
                reverseSorting: '<?',
                sortOptions: '<',
                selectedOption: '<?',
                onSortChange: '&?'
            },
            templateUrl: 'igz_controls/components/sort-dropdown/sort-dropdown.tpl.html',
            controller: IgzSortDropdownController
        });

    function IgzSortDropdownController(lodash) {
        var ctrl = this;

        ctrl.$onChanges = onChanges;
        ctrl.$onInit = onInit;

        ctrl.handleOptionClick = handleOptionClick;

        //
        // Hook methods
        //

        /**
         * On changes hook method.
         * @param {Object} changes
         */
        function onChanges(changes) {
            // fill default values for missing properties of dropdown options when a new array is set to `sortOptions`
            if (lodash.has(changes, 'sortOptions')) {
                setOptionsDefaults();
            }

            // programmatically change the selected option
            if (lodash.has(changes, 'selectedOption')) {
                lodash.forEach(ctrl.sortOptions, function (option) {
                    option.active = option.value === changes.selectedOption.currentValue;
                    option.desc = ctrl.reverseSorting;
                });
            }

            // programmatically change the selected option's order (ascending/descending)
            if (lodash.has(changes, 'reverseSorting')) {
                var selectedOption = findSelectedOption();
                selectedOption.desc = changes.reverseSorting.currentValue;
            }
        }

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.isOpen = false;
        }

        //
        // Public methods
        //

        /**
         * Handles `click` event on an option.
         * @param {SortOption} option - The selected option.
         */
        function handleOptionClick(option) {
            var previousOption = findSelectedOption();

            // if an already-selected option is selected again - swap its sorting order (ascending <--> descending)
            // otherwise, select the new option and de-select the previous option and set it to ascending for next time
            if (option.active) {
                option.desc = !option.desc;
            } else {
                previousOption.desc = false;
                previousOption.active = false;
                option.active = true;
            }

            if (angular.isFunction(ctrl.onSortChange)) {
                ctrl.onSortChange({ option: option });
            }
        }

        //
        // Private methods
        //

        /**
         * Finds and returns the selected option.
         * @returns {SortOption} The option whose `active` property is `true`.
         */
        function findSelectedOption() {
            return lodash.find(ctrl.sortOptions, ['active', true]);
        }

        /**
         * Sets `visible` property for all array items into true if it is not already defined.
         * `visible` property determines whether item will be shown in the sort options list.
         */
        function setOptionsDefaults() {
            lodash.forEach(ctrl.sortOptions, function (option) {
                lodash.defaults(option, {
                    active: false,
                    desc: false,
                    value: lodash.uniqueId(),
                    visible: true
                });
            });
        }
    }
}());
