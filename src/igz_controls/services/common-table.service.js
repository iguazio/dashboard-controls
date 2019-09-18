(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .factory('CommonTableService', CommonTableService);

    function CommonTableService() {
        return {
            getColumnSortingClasses: getColumnSortingClasses,

            rowInitTimer: null
        };

        //
        // Public methods
        //

        /**
         * Checks whether the passed column name equals the last sorted column name
         * @param {string} columnName
         * @param {string} lastSortedColumnName
         * @param {boolean} isReversed
         * @returns {{sorted: boolean, reversed: boolean}} - an object with css class names suitable for `ng-class`
         */
        function getColumnSortingClasses(columnName, lastSortedColumnName, isReversed) {
            var classes = {
                'sorted': false,
                'reversed': false
            };
            if (columnName === lastSortedColumnName) {
                classes.sorted = true;
                classes.reversed = isReversed;
            }
            return classes;
        }
    }
}());
