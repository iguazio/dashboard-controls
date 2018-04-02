(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .directive('igzInputBlurOnEnter', igzInputBlurOnEnter);

    function igzInputBlurOnEnter() {
        return {
            restrict: 'A',
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
                initInput();

                scope.$on('$destroy', destructor);
            }

            /**
             * Submit Rule name input on Enter key press
             */
            function initInput() {
                element.on('keydown', blurOnEnterKey);
            }

            /**
             * Set element to blur on Enter key press
             * @param {Object} e - event
             */
            function blurOnEnterKey(e) {
                if (e.keyCode === 13) {
                    element.blur();
                }
            }

            /**
             * Destructor method
             */
            function destructor() {
                element.off('keydown', blurOnEnterKey);
            }
        }
    }
}());
