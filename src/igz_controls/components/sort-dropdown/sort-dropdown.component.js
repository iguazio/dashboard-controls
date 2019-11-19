(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('igzSortDropdown', {
            bindings: {
                sortOptions: '<',
                reverseSorting: '<',
                updateDataCallback: '<'
            },
            templateUrl: 'igz_controls/components/sort-dropdown/sort-dropdown.tpl.html',
            controller: IgzSortDropdownController
        });

    function IgzSortDropdownController(lodash) {
        var ctrl = this;

        ctrl.$onInit = onInit;

        ctrl.getItemClass = getItemClass;
        ctrl.setValuesVisibility = setValuesVisibility;
        ctrl.toggleSortingOrder = toggleSortingOrder;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.setValuesVisibility();
        }

        //
        // Public methods
        //

        /**
         * Returns item's class attribute
         * @param {boolean} isFieldActive - state of item
         * @returns {string}
         */
        function getItemClass(isFieldActive) {
            return isFieldActive ? 'active-item' : '';
        }

        /**
         * Sets `visible` property for all array items into true if it is not already defined.
         * `visible` property determines whether item will be shown in the sort options list.
         */
        function setValuesVisibility() {
            lodash.forEach(ctrl.sortOptions, function (value) {
                lodash.defaults(value, {visible: true});
            });
        }

        /**
         * Toggles sorting order for files
         * @param {string} option - attribute to sort by
         */
        function toggleSortingOrder(option) {
            if (angular.isFunction(ctrl.updateDataCallback)) {
                ctrl.updateDataCallback(option);
            }
        }
    }
}());
