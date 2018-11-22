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

    function NclFunctionConfigDialogController(DialogsService, ExportService) {
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
            if (document.queryCommandSupported && document.queryCommandSupported('copy')) {
                var textarea = document.createElement('textarea');
                textarea.textContent = ctrl.sourceCode;
                textarea.style.position = 'fixed';
                document.body.appendChild(textarea);
                textarea.select();

                try {
                    return document.execCommand('copy'); // Security exception may be thrown by some browsers.
                } catch (ex) {
                    DialogsService.alert('Copy to clipboard failed.', ex);
                } finally {
                    document.body.removeChild(textarea);
                }
            }
        }
    }
}());
