(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('igzMoreInfo', {
            bindings: {
                description: '@',
                isDisabled: '<?',
                isDefaultTooltipEnabled: '<?',
                isDefaultTooltipHtml: '<?',
                defaultTooltipPlacement: '@?',
                defaultTooltipPopupDelay: '@?'
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
            lodash.defaults(ctrl, {
                isDisabled: false,
                isDefaultTooltipEnabled: false,
                isDefaultTooltipHtml: false,
                defaultTooltipPlacement: 'auto',
                defaultTooltipPopupDelay: '0'
            });
        }
    }
}());
