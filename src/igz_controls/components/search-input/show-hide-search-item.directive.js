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

