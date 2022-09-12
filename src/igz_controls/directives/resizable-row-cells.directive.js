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
        .directive('igzResizableRowCells', igzResizableRowCells);

    function igzResizableRowCells($rootScope, $timeout, lodash, CommonTableService) {
        return {
            restrict: 'A',
            link: link
        };

        function link(scope, element) {
            onInit();

            /**
             * Constructor method
             */
            function onInit() {
                scope.$on('resize-cells', resizeCells);
                scope.$on('autofit-col', autoFitColumn);
                scope.$on('$destroy', onDestroy);

                $timeout.cancel(CommonTableService.rowInitTimer);

                CommonTableService.rowInitTimer = $timeout(function () {
                    $rootScope.$broadcast('reload-columns');

                    CommonTableService.rowInitTimer = null;
                }, 100)
            }

            /**
             * Destructor method
             */
            function onDestroy() {
                if (CommonTableService.rowInitTimer) {
                    CommonTableService.rowInitTimer = null;
                }
            }

            //
            // Private methods
            //

            /**
             * Checks width of cells column auto-fit
             * @param {Object} event - broadcast event
             * @param {Object} data - information about column name
             */
            function autoFitColumn(event, data) {
                var currentCell = element.find('.' + data.colClass)[0];

                if (!lodash.isNil(currentCell)) {
                    var currentWidth = currentCell.offsetWidth;

                    // temporary set auto width to get data for auto-fit
                    currentCell.style.width = 'auto';
                    var newWidth = currentCell.offsetWidth;
                    currentCell.style.width = currentWidth + 'px';

                    if (newWidth > currentWidth) {
                        var colDifference = newWidth - currentWidth + 2;

                        if (angular.isFunction(data.callbackFunction)) {
                            data.callbackFunction(colDifference);
                        }
                    }
                }
            }

            /**
             * Resize cells according to igz-resize-table-column directive move
             * @param {Object} event - broadcast event
             * @param {Object} data - information about column name and size
             */
            function resizeCells(event, data) {

                // search for cell which should be resized
                var currentCell = element.find('.' + data.colClass)[0];
                if (!lodash.isNil(currentCell)) {
                    var nextCell = currentCell.nextElementSibling;

                    // set new value for cells width
                    currentCell.style.width = data.columnWidth;

                    if (!lodash.isNil(nextCell)) {
                        nextCell.style.width = data.nextColumnWidth;
                    }
                }
            }
        }
    }
}());

