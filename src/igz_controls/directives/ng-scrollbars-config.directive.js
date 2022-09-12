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
/**
 * Directive adds max-height for scrollbar container
 * @param igzNgScrollbarsConfig.maxElementsCount (number) maximum number of children elements that fit into the scrollbar container
 * @param igzNgScrollbarsConfig.childrenSelector (string) selector for children elements
 */
(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .directive('igzNgScrollbarsConfig', igzNgScrollbarsConfig);

    function igzNgScrollbarsConfig($timeout, lodash) {
        return {
            restrict: 'A',
            link: link
        };

        function link(scope, element, attrs) {
            var config = angular.fromJson(attrs.igzNgScrollbarsConfig);

            $timeout(function () {
                activate();
            });
            scope.$watch(function () {
                return element.find(config.childrenSelector).length
            }, activate);

            /**
             * Constructor method
             */
            function activate() {
                var childrenElements = element.find(config.childrenSelector);
                var maxElementsCount = config.maxElementsCount;
                var scrollbarContainerHeight = 0;

                if (childrenElements.length > maxElementsCount) {
                    scrollbarContainerHeight = lodash.chain(childrenElements)
                        .take(maxElementsCount)
                        .map(function (child) {
                            var styles = window.getComputedStyle(child);
                            var margin = parseFloat(styles['marginTop']) + parseFloat(styles['marginBottom']);

                            return child.offsetHeight + margin;
                        })
                        .sum()
                        .value();
                }

                element.css({'max-height': scrollbarContainerHeight > 0 ? scrollbarContainerHeight : 'unset'});
            }
        }
    }
}());
