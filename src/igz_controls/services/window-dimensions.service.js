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
