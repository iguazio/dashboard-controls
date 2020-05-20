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

    function NclFunctionConfigDialogController(ExportService) {
        var ctrl = this;

        ctrl.$onInit = onInit;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.title = ctrl.function.metadata.name + ' - configuration';
            ctrl.sourceCode = ExportService.getFunctionConfig(ctrl.function);
        }
    }
}());
