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

    function IgzCopyToClipboard($i18next, i18next, DialogsService) {
        var ctrl = this;
        var lng = i18next.language;

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
                    DialogsService.alert($i18next.t('common:COPY_TO_CLIPBOARD_FAILED', {lng: lng}), ex);
                } finally {
                    document.body.removeChild(textarea);
                }
            }
        }
    }
}());
