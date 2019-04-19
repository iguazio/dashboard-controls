(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('igzMoreInfo', {
            bindings: {
                description: '@',
                isDisabled: '<?',
                isTooltipEnabled: '<?',
                tooltipPlacement: '@?',
                tooltipPopupDelay: '@?'
            },
            templateUrl: 'igz_controls/components/more-info/more-info.tpl.html',
            controller: IgzMoreInfoController
        });

    function IgzMoreInfoController(lodash) {
        var ctrl = this;

        ctrl.$onInit = onInit;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.isDisabled = lodash.defaultTo(ctrl.isDisabled, false);
            ctrl.isTooltipEnabled = lodash.defaultTo(ctrl.isTooltipEnabled, false);
            ctrl.tooltipPlacement = lodash.defaultTo(ctrl.tooltipPlacement, 'auto');
            ctrl.tooltipPopupDelay = lodash.defaultTo(ctrl.tooltipPopupDelay, '0');
        }
    }
}());
