(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .directive('igzShowHideSearchItem', igzShowHideSearchItem);

    function igzShowHideSearchItem(lodash) {
        return {
            restrict: 'A',
            scope: {
                dataItem: '=igzShowHideSearchItem'
            },
            link: link
        };

        function link(scope, element) {
            activate();

            //
            // Private methods
            //

            /**
             * Constructor method
             */
            function activate() {
                scope.$watch('dataItem.ui.isFitQuery', changeVisibility);
                scope.$watch('dataItem.ui.filters', changeVisibility, true);
            }

            /**
             * Method sets display property of element to false if it doesn't fit the query in search otherwise removes these property
             * @param {boolean} newValue - value displays if current element fit search query
             */
            function changeVisibility(newValue) {
                var displayValue = '';

                if (lodash.isObject(newValue)) {
                    displayValue = lodash.some(newValue, {isFitQuery: false}) ? 'none' : '';
                } else {
                    displayValue = (newValue === false) ? 'none' : '';
                }

                element.css('display', displayValue);
            }
        }
    }
}());

