(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('igzMoreInfo', {
            bindings: {
                description: '@',
                isDisabled: '<?',
                trigger: '@?',
                isHtmlEnabled: '<?',
                isDefaultTooltipEnabled: '<?',
                defaultTooltipPlacement: '@?',
                defaultTooltipPopupDelay: '@?'
            },
            templateUrl: 'igz_controls/components/more-info/more-info.tpl.html',
            controller: IgzMoreInfoController
        });

    function IgzMoreInfoController($document, $element, $timeout, lodash) {
        var ctrl = this;

        ctrl.$onInit = onInit;
        ctrl.isClickMode = isClickMode;
        ctrl.onQuestionMarkClick = onQuestionMarkClick;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            lodash.defaults(ctrl, {
                isDisabled: false,
                isHtmlEnabled: false,
                isDefaultTooltipEnabled: false,
                defaultTooltipPlacement: ctrl.isDefaultTooltipEnabled ? 'auto' : 'right',
                defaultTooltipPopupDelay: '0'
            });

            // Defaults trigger method to 'mouseenter'. Available 2 modes: `hover (mouseenter)` and `click`.
            if (ctrl.trigger !== 'click') {
                ctrl.trigger = 'mouseenter';
            }

            // In `click` mode this variable is responsible for displaying tooltip.
            // If it is `true` tooltip is shown and hidden otherwise. Toggles by `onQuestionMarkClick` only in this mode.
            // In `hover` mode is always `true`.
            ctrl.isDescriptionVisible = !isClickMode();
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
         */
        function onQuestionMarkClick() {
            if (ctrl.isClickMode()) {
                ctrl.isDescriptionVisible = !ctrl.isDescriptionVisible;

                $timeout(function () {
                    ctrl.isDescriptionVisible ? $document.on('click', hideTooltip) : $document.off('click', hideTooltip);
                })
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
    }
}());
