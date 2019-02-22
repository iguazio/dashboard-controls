(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('igzCopyToClipboard', {
            bindings: {
                value: '<'
            },
            templateUrl: 'igz_controls/components/copy-to-clipboard/copy-to-clipboard.tpl.html',
            controller: IgzCopyToClipboard
        });

    function IgzCopyToClipboard(DialogsService) {
        var ctrl = this;

        ctrl.copyToClipboard = copyToClipboard;

        //
        // Public method
        //

        /**
         * Copies a string to the clipboard.
         */
        function copyToClipboard() {
            if (document.queryCommandSupported && document.queryCommandSupported('copy')) {
                var textarea = document.createElement('textarea');
                textarea.textContent = ctrl.value;
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
