(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .directive('igzValidateElevation', igzValidateElevation);

    function igzValidateElevation(lodash) {
        return {
            restrict: 'A',
            require: 'ngModel',
            scope: {
                compareVal: '=',
                compareValUnit: '=',
                currentValUnit: '='
            },
            link: link
        };

        function link(scope, element, attributes, ngModel) {
            activate();

            function activate() {
                if (angular.isDefined(scope.compareVal)) {
                    ngModel.$validators.validateElevation = function (modelValue) {
                        return lodash.isNil(modelValue) || lodash.isNil(scope.compareVal) ||
                            calcValue(modelValue, scope.currentValUnit) <= calcValue(scope.compareVal, scope.compareValUnit);

                        function calcValue(value, unit) {
                            return (Number(unit) || 1) * Number(value);
                        }
                    };

                    scope.$watch('compareVal', function () {
                        ngModel.$validate();
                    });

                    if (angular.isDefined(scope.compareValUnit) && angular.isDefined(scope.currentValUnit)) {
                        scope.$watchGroup(['compareValUnit', 'currentValUnit'], function () {
                            ngModel.$validate();
                        });
                    }
                }
            }
        }
    }
}());
