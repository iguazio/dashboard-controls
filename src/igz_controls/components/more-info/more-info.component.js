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
        .component('igzMoreInfo', {
            bindings: {
                description: '@',
                isDisabled: '<?',
                trigger: '@?',
                iconType: '@?',
                isHtmlEnabled: '<?',
                isDefaultTooltipEnabled: '<?',
                isOpen: '<?',
                defaultTooltipPlacement: '@?',
                defaultTooltipPopupDelay: '@?'
            },
            templateUrl: 'igz_controls/components/more-info/more-info.tpl.html',
            controller: IgzMoreInfoController
        });

    function IgzMoreInfoController($compile, $document, $element, $sce, $scope, $timeout, lodash) {
        var ctrl = this;

        ctrl.iconTypes = {
            INFO: 'info',
            WARN: 'warn'
        };

        ctrl.selectedIconType = ctrl.iconTypes.INFO;

        ctrl.$onInit = onInit;
        ctrl.$onChanges = onChanges;
        ctrl.$onDestroy = onDestroy;

        ctrl.handleQuestionMarkClick = handleQuestionMarkClick;
        ctrl.isClickMode = isClickMode;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            lodash.defaults(ctrl, {
                defaultTooltipPlacement: ctrl.isDefaultTooltipEnabled ? 'auto' : 'right',
                defaultTooltipPopupDelay: '0',
                isDefaultTooltipEnabled: false,
                isDisabled: false,
                isHtmlEnabled: false
            });

            // Defaults trigger method to 'mouseenter'. Available 2 modes: `mouseenter` (hover) and `click`.
            if (ctrl.trigger !== 'click') {
                ctrl.trigger = 'mouseenter';
            }
        }

        /**
         * On changes hook method.
         * @param {Object} changes
         */
        function onChanges(changes) {
            if (lodash.has(changes, 'isOpen')) {
                ctrl.isDescriptionVisible = changes.isOpen.currentValue;
                if (isClickMode()) {
                    toggleClickListener();
                }
            }

            if (lodash.has(changes, 'iconType')) {
                var valueIsValid = lodash.includes(ctrl.iconTypes, changes.iconType.currentValue);
                ctrl.selectedIconType = valueIsValid ? changes.iconType.currentValue : ctrl.iconTypes.INFO;
            }

            if (lodash.has(changes, 'description') && ctrl.isHtmlEnabled) {
                var compiled = $compile('<span>' + ctrl.description + '</span>')($scope);
                ctrl.compiledDescription = $sce.trustAsHtml(compiled[0].innerHTML);
            }
        }

        /**
         * Destructor method
         */
        function onDestroy() {
            $document.off('click', hideTooltip);
        }

        //
        // Public methods
        //

        /**
         * Determine whether the trigger method is `click`
         * @returns {boolean}
         */
        function isClickMode() {
            return ctrl.trigger === 'click';
        }

        /**
         * Handles click on question mark. Shows/hides tooltip. Works only for 'click' trigger.
         * @param {Event} event
         */
        function handleQuestionMarkClick(event) {
            event.stopPropagation();
            if (ctrl.isClickMode()) {
                ctrl.isDescriptionVisible = !ctrl.isDescriptionVisible;
                toggleClickListener();
            }
        }

        //
        // Private methods
        //

        /**
         * Hides tooltip by clicking anywhere outside of the tooltip or the question mark icon.
         * @param {Event} event
         */
        function hideTooltip(event) {
            if (!event.target.closest('.row-description') && $element.find('.question-mark')[0] !== event.target) {
                ctrl.isDescriptionVisible = false;

                $document.off('click', hideTooltip);
            }
        }

        /**
         * Adds or removes event listener for `click` event on the document for closing pop-over.
         */
        function toggleClickListener() {
            $timeout(function () {
                if (ctrl.isDescriptionVisible) {
                    $document.on('click', hideTooltip);
                } else {
                    $document.off('click', hideTooltip);
                }
            });
        }
    }
}());
