(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .directive('igzInputOnlyValidCharacters', igzInputOnlyValidCharacters);

    function igzInputOnlyValidCharacters($timeout) {
        return {
            restrict: 'A',
            require: 'ngModel',
            scope: {
                pattern: '=igzInputOnlyValidCharacters'
            },
            link: link
        };

        function link(scope, element, attr, ngModelCtrl) {
            var REGEXP = scope.pattern;
            var lastValidViewValue;

            activate();

            //
            // Private methods
            //

            /**
             * Constructor method
             */
            function activate() {
                $timeout(function () {
                    lastValidViewValue = ngModelCtrl.$viewValue;
                });

                ngModelCtrl.$parsers.unshift(checkForDigits);
            }

            /**
             * Checks whether entered value is valid
             * @param {string} viewValue - entered view value
             * @returns {string} the last valid entered value
             */
            function checkForDigits(viewValue) {
                if (attr.onlyValidCharacters) {
                    if (REGEXP.test(viewValue)) {

                        // Saves as valid view value if it's a not empty string
                        lastValidViewValue = viewValue === '' ? '' : Number(viewValue);
                    } else {

                        // Renders the last valid input in the field
                        ngModelCtrl.$viewValue = lastValidViewValue;
                        ngModelCtrl.$commitViewValue();
                        ngModelCtrl.$render();
                    }
                    return lastValidViewValue;
                } else {
                    return viewValue;
                }
            }
        }
    }
}());
