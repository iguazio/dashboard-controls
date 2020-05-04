(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .directive('igzValidatePasswordConfirmation', igzValidatePasswordConfirmation);

    function igzValidatePasswordConfirmation(lodash) {
        return {
            restrict: 'A',
            require: 'ngModel',
            scope: {
                compareVal: '=igzValidatePasswordConfirmation'
            },
            link: link
        };

        function link(scope, element, attributes, ngModel) {
            activate();

            //
            // Private methods
            //

            /**
             * Constructor
             */
            function activate() {
                initValidator();
            }

            /**
             * Method to add validators
             */
            function initValidator() {
                if (angular.isDefined(scope.compareVal)) {
                    ngModel.$validators.validatePasswordConfirmation = isValueValid;

                    scope.$watch('compareVal', function () {
                        ngModel.$validate();
                    });
                }
            }

            /**
             * Method checks if passed value is valid
             * @param {string} value - current changed value
             * @returns {boolean} return true if value is valid
             */
            function isValueValid(value) {
                return lodash.isEmpty(value) || (value === scope.compareVal);
            }
        }
    }
}());

