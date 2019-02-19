(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .factory('CommonService', CommonService);

    function CommonService(DialogsService) {
        return {
            copyToClipboard: copyToClipboard
        };

        function copyToClipboard(data) {
            if (document.queryCommandSupported && document.queryCommandSupported('copy')) {
                var textarea = document.createElement('textarea');
                textarea.textContent = data;
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
