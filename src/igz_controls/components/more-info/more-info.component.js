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

    function IgzMoreInfoController($document, $element, $timeout, lodash) {
        var ctrl = this;

        ctrl.iconTypes = {
            INFO: 'info',
            WARN: 'warn'
        };

        ctrl.selectedIconType = ctrl.iconTypes.INFO;

        ctrl.$onInit = onInit;
        ctrl.$onChanges = onChanges;
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
                ctrl.isDescriptionVisible ? $document.on('click', hideTooltip) : $document.off('click', hideTooltip);
            })
        }
    }
}());
