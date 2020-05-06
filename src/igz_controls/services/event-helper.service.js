(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .factory('EventHelperService', EventHelperService);

    function EventHelperService($q, $timeout, lodash) {
        return {
            BACKSPACE: 8,
            DOWN: 40,
            ENTER: 13,
            ESCAPE: 27,
            SPACE: 32,
            TABKEY: 9,
            UP: 38,
            getFocusedElement: getFocusedElement,
            isLeftMousePressed: isLeftMousePressed,
            isRightMousePressed: isRightMousePressed,
            isCtrlOrCmdPressed: isCtrlOrCmdPressed,
            isShiftPressed: isShiftPressed
        };

        //
        // Public methods
        //

        /**
         * Gets the HTML element that is receiving the focus after this `blur` event.
         * New browsers support `event.relatedEvent`.
         * Older browsers do not support it, but they do support `document.activeElement` which is updated only
         * on next event-loop "tick".
         * @param {FocusEvent} event - The `blur` event.
         * @returns {Promise.<HTMLElement>} A promise that resolves to the HTML element that is receiving the focus
         *     on this `blur` event.
         */
        function getFocusedElement(event) {
            return lodash.hasIn(event, 'relatedTarget') ? $q.when(event.relatedTarget) : $timeout(function () {
                return document.activeElement;
            });
        }

        /**
         * Checks whether the event invoked by left mouse click
         * @param {MouseEvent} event
         * @returns {boolean}
         */
        function isLeftMousePressed(event) {
            return event.which === 1;
        }

        /**
         * Checks whether the event invoked by left mouse click
         * @param {MouseEvent} event
         * @returns {boolean}
         */
        function isRightMousePressed(event) {
            return event.which === 3;
        }

        /**
         * Checks whether Shift key was pressed when the event invoked
         * @param {MouseEvent} event
         * @returns {boolean}
         */
        function isShiftPressed(event) {
            return event.shiftKey;
        }

        /**
         * Checks whether Ctrl or Cmd key was pressed when the event invoked
         * @param {MouseEvent} event
         * @returns {boolean}
         */
        function isCtrlOrCmdPressed(event) {
            return event.ctrlKey || event.metaKey;
        }
    }
}());
