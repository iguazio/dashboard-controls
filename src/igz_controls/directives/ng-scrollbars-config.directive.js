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
                                                     .reduce(function (result, child) {
                                                         var styles = window.getComputedStyle(child);
                                                         var margin = parseFloat(styles['marginTop']) + parseFloat(styles['marginBottom']);

                                                         return result + child.offsetHeight + margin
                                                     }, 0)
                                                     .value();
                }

                element.css({'max-height': scrollbarContainerHeight > 0 ? scrollbarContainerHeight : 'unset'});
            }
        }
    }
}());
