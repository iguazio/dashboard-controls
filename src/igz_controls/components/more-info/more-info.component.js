(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('igzMoreInfo', {
            bindings: {
                description: '@',
                isDisabled: '<?',
                trigger: '@?', // 'hover' or 'click'
                isHtmlEnabled: '<?',
                isDefaultTooltipEnabled: '<?',
                defaultTooltipPlacement: '@?',
                defaultTooltipPopupDelay: '@?'
            },
            templateUrl: 'igz_controls/components/more-info/more-info.tpl.html',
            controller: IgzMoreInfoController
        });

    function IgzMoreInfoController(lodash) {
        var ctrl = this;

        ctrl.$onInit = onInit;
        ctrl.onQuestionMarkClick = onQuestionMarkClick;
        ctrl.isClickMode = isClickMode;

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
                defaultTooltipPlacement: 'auto',
                defaultTooltipPopupDelay: '0',
            });

            // Defaults trigger method to 'mouseenter' (hover)
            ctrl.trigger = ctrl.trigger === 'click' ? 'click' : 'mouseenter';
            ctrl.isDescriptionVisible = !isClickMode(); // need only for 'click' trigger. Init value - `false`
        }

        //
        // Public methods
        //

        /**
         * Handles click on question mark. Shows/hides tooltip. Works only for 'click' trigger.
         */
        function onQuestionMarkClick() {
            if (ctrl.isClickMode()) {
                ctrl.isDescriptionVisible = !ctrl.isDescriptionVisible;
            }
        }

        /**
         * Determine whether the trigger method is `click`
         * @returns {boolean}
         */
        function isClickMode() {
            return ctrl.trigger === 'click';
        }
    }
}());
