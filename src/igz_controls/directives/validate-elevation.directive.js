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
