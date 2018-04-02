(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('igzSortDropdown', {
            bindings: {
                sortOptions: '<',
                updateDataCallback: '<'
            },
            templateUrl: 'sort-dropdown/sort-dropdown.tpl.html',
            controller: IgzSortDropdownController
        });

    function IgzSortDropdownController() {
        var ctrl = this;

        ctrl.getItemClass = getItemClass;
        ctrl.toggleSortingOrder = toggleSortingOrder;

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
