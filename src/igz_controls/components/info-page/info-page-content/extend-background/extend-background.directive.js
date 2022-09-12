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

    /**
     * Extend white background to the bottom of the view port
     */
    angular.module('iguazio.dashboard-controls')
        .directive('igzExtendBackground', igzExtendBackground);

    function igzExtendBackground($timeout) {
        return {
            restrict: 'A',
            link: link
        };

        function link(scope, element, attrs) {
            var timeout = 0;
            var containerPath = 'body';

            activate();

            //
            // Private methods
            //

            /**
             * Constructor method
             */
            function activate() {
                timeout = Number(attrs.igzExtendBackground) || 0;
                containerPath = attrs.containerPath || 'body';

                $timeout(elementMinHeight, timeout);
                scope.$on('igzWatchWindowResize::resize', elementMinHeight);
            }

            /**
             * Calculate and change element height
             */
            function elementMinHeight() {
                var container = angular.element(containerPath);

                if (angular.isDefined(container[0])) {
                    var containerBox = container[0].getBoundingClientRect();
                    var paddingBottom = parseInt(container.css('padding-bottom'), 10);
                    var box = element[0].getBoundingClientRect();

                    if (containerBox.height === 0) {
                        element.css('height', '100%');
                        element.css('padding-bottom', '45px');
                    } else {
                        element.css('padding-bottom', '0');
                        element.css('height', (containerBox.bottom + paddingBottom - box.top) + 'px');
                    }
                }
            }
        }
    }
}());
