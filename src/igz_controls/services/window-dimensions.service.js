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

    /*
     * Gets window height and width
     */
    angular.module('iguazio.dashboard-controls')
        .factory('WindowDimensionsService', WindowDimensionsService);

    function WindowDimensionsService($document, $window) {
        return {
            height: height,
            width: width,
            addOverflow: addOverflow,
            removeOverflow: removeOverflow,
            getElementPosition: getElementPosition
        };

        //
        // Public methods
        //

        function height() {
            var doc = $document[0];
            return $window.innerHeight || doc.documentElement.clientHeight || doc.body.clientHeight;
        }

        function width() {
            var doc = $document[0];
            return $window.innerWidth || doc.documentElement.clientWidth || doc.body.clientWidth;
        }

        /**
         * Method removes class which sets overflow to hidden
         */
        function addOverflow() {
            $document.find('body').removeClass('no-overflow');
        }

        /**
         * Method adds class which sets overflow to hidden
         */
        function removeOverflow() {
            $document.find('body').addClass('no-overflow');
        }

        /**
         * Calculates offset position of element according to its parent
         * @param {HTMLElement} el
         * @param {HTMLElement} parent
         * @returns {{left: number, top: number, right: number, bottom: number}}
         */
        function getElementPosition(el, parent) {
            var pos = {
                left: 0,
                top: 0,
                right: el.offsetWidth,
                bottom: el.offsetHeight
            };

            while (el.offsetParent && el.offsetParent !== parent) {
                pos.left += el.offsetLeft;
                pos.top += el.offsetTop;
                el = el.offsetParent;
            }

            pos.right += pos.left;
            pos.bottom += pos.top;

            return pos;
        }
    }
}());
