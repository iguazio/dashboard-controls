(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .directive('igzPreventParentScroll', function () {
            return {
                restrict: 'A',
                scope: false,
                link: link
            };
        });

    function link(scope, element) {
        element.bind('mousewheel', onMouseWheel);

        /**
         * Prevents scrolling parent container
         * @param {Event} event
         */
        function onMouseWheel(event) {
            element[0].scrollTop -= (event.wheelDeltaY || (event.originalEvent && (event.originalEvent.wheelDeltaY || event.originalEvent.wheelDelta)) || event.wheelDelta || 0);
            event.stopPropagation();
            event.preventDefault();
            event.returnValue = false;
        }
    }
}());
