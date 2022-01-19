(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclFunctionConfigDialog', {
            bindings: {
                closeDialog: '&',
                function: '<'
            },
            templateUrl: 'nuclio/common/components/function-config-dialog/function-config-dialog.tpl.html',
            controller: NclFunctionConfigDialogController
        });

    function NclFunctionConfigDialogController(ExportService, MaskService) {
        var ctrl = this;

        ctrl.$onInit = onInit;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            var functionWithMask = MaskService.getObjectWithMask(ctrl.function);
            ctrl.title = ctrl.function.metadata.name + ' - configuration';

            ctrl.sourceCode = ExportService.getFunctionConfig(functionWithMask);
        }
    }
}());
