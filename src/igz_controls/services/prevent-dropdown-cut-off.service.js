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
     * Increase/set-back scrollable mCSB_container height if needed
     * to be able to scroll it down to see dropdown hidden by container's overflow
     *
     * Usage:
     * 1) Init method with passed needed element and class selectors (inside link-function)
     * preventDropdownCutOff(element, '.dropdown-element-class', '.scrollable-element-class');
     *
     * !!!Please note that service is using "enter" and "leave" animation events of `$animate` service.
     * The following directives support these events:
     * - ngRepeat
     * - ngView
     * - ngInclude
     * - ngSwitch
     * - ngIf
     * - ngMessage
     */

    angular.module('iguazio.dashboard-controls')
        .factory('PreventDropdownCutOffService', PreventDropdownCutOffService);

    function PreventDropdownCutOffService($animate, $document) {

        // Margin for the better look
        var MARGIN_BOTTOM = 15;

        return {
            preventDropdownCutOff: preventDropdownCutOff,
            resizeScrollBarContainer: resizeScrollBarContainer,
            onShowPreventDropdownCutOff: onShowPreventDropdownCutOff
        };

        //
        // Public methods
        //

        /**
         * Increase/set-back scrollable mCSB_container height if needed to be able to scroll down it to see dropdown
         * hidden by container's overflow
         * @param {Object} currentElement - dropdown directive element
         * @param {string} dropdownElementClass - dropdown menu element class selector
         * @param {?string} scrollableElementClass - scrollable container element class selector. Note that "scrollableElementClass"
         * class should be in one class together with ".mCSB_container" class
         */
        function preventDropdownCutOff(currentElement, dropdownElementClass, scrollableElementClass) {
            var dropdownElement;
            var scrollableElement;

            $animate.on('enter', currentElement, function (element, phase) {
                dropdownElement = currentElement.find(dropdownElementClass).last();

                if (dropdownElement[0] === element[0]) {
                    scrollableElement = resizeElement(currentElement, dropdownElement, scrollableElementClass, phase);
                }
            });

            $animate.on('leave', currentElement, function (element, phase) {
                if (angular.isElement(scrollableElement) && phase === 'close') {
                    scrollableElement.height('auto');
                }
            });
        }

        /**
         * Resize scrollBar container('.mCSB_container') regarding target element.
         * If targetElement does not visible through cutOff then resize scrollBar container to needed height.
         * @param {Object} currentElement - contains target element
         * @param {Object} targetElement - scrollBar container should be resized regarding this element
         */
        function resizeScrollBarContainer(currentElement, targetElement) {
            var scrollbarContainer = currentElement.closest('.mCSB_container');
            var target = currentElement.find(targetElement);

            if (scrollbarContainer.length === 1 && target.length === 1) {
                var newHeight = target.offset().top + target.height();

                scrollbarContainer.css('height',
                                       (newHeight > scrollbarContainer.height() ? newHeight :
                                                                                  scrollbarContainer.height()) + 'px');
            }
        }

        /**
         * Increase/set-back scrollable mCSB_container height and it's parent
         * to be able to scroll down it to see dropdown hidden by container's overflow
         * should be used with ng-show
         * @param {Object} currentElement - dropdown directive element
         * @param {string} dropdownElementClass - dropdown menu element class selector
         * @param {?string} scrollableElementClass - scrollable container element class selector. Note that "scrollableElementClass"
         * class should be in one class together with ".mCSB_container" class
         */
        function onShowPreventDropdownCutOff(currentElement, dropdownElementClass, scrollableElementClass) {
            $animate.on('removeClass', currentElement, function (element, phase) {
                var dropdownElement = currentElement.find(dropdownElementClass).last();

                if (dropdownElement[0] === element[0]) {
                    resizeElement(currentElement, dropdownElement, scrollableElementClass, phase);
                }
            });
        }

        /**
         * Resize element and parent to prevent dropdown cutoff
         * @param {Object} currentElement - dropdown directive element
         * @param {Object} dropdownElement - dropdown menu directive element
         * @param {?string} scrollableElementClass - scrollable container element class selector. Note that "scrollableElementClass"
         * @param {string} phase - current phase from the event
         */
        function resizeElement(currentElement, dropdownElement, scrollableElementClass, phase) {
            var scrollableElement;
            var parentScrollableElement;

            // Set default scrollable container class if undefined
            scrollableElementClass = scrollableElementClass || '.mCSB_container';

            scrollableElement = currentElement.closest(scrollableElementClass);
            if (scrollableElement.length > 0 && (phase === 'close' || phase === 'start')) {
                parentScrollableElement = scrollableElement.parent();

                var dropDownOffsetBottom = $document.height() - dropdownElement.outerHeight(true) - dropdownElement.offset().top;
                var containerOffsetBottom = $document.height() - scrollableElement.outerHeight(true) - scrollableElement.offset().top;
                var newHeight = scrollableElement.outerHeight(true) + (containerOffsetBottom - dropDownOffsetBottom) + MARGIN_BOTTOM;

                if (dropDownOffsetBottom < containerOffsetBottom) {

                    // Set scrollableElement's height to needed value
                    scrollableElement.height(newHeight);
                    if (parentScrollableElement.height() < newHeight) {
                        parentScrollableElement.height(newHeight);
                    }
                }
            } else {
                scrollableElement.height('auto');
            }

            return scrollableElement;
        }
    }
}());
