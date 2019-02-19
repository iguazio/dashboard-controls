(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclFunctionConfigDialog', {
            bindings: {
                closeDialog: '&',
                function: '<',
            },
            templateUrl: 'nuclio/common/components/function-config-dialog/function-config-dialog.tpl.html',
            controller: NclFunctionConfigDialogController
        });

    function NclFunctionConfigDialogController(CommonService, DialogsService, ExportService) {
        var ctrl = this;

        ctrl.editorTheme = {
            id: 'vs',
            name: 'Light',
            visible: true
        };

        ctrl.$onInit = onInit;
        ctrl.copyToClipboard = copyToClipboard;

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

        //
        // Public methods
        //

        /**
         * Copies a string to the clipboard. Must be called from within an event handler such as click
         */
        function copyToClipboard() {
            CommonService.copyToClipboard(ctrl.sourceCode);
        }
    }
}());
