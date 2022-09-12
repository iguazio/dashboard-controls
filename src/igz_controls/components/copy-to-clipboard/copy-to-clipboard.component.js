/*
Copyright 2018 Iguazio Systems Ltd.
Licensed under the Apache License, Version 2.0 (the "License") with
an addition restriction as set forth herein. You may not use this
file except in compliance with the License. You may obtain a copy of
the License at http://www.apache.org/licenses/LICENSE-2.0.
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. See the License for the specific language governing
permissions and limitations under the License.
In addition, you may not use the software for any purposes that are
illegal under applicable law, and the grant of the foregoing license
under the Apache 2.0 license is conditioned upon your compliance with
such restriction.
*/
(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('igzCopyToClipboard', {
            bindings: {
                tooltipPlacement: '@?',
                tooltipText: '@?',
                value: '<'
            },
            templateUrl: 'igz_controls/components/copy-to-clipboard/copy-to-clipboard.tpl.html',
            controller: IgzCopyToClipboard
        });

    function IgzCopyToClipboard($i18next, i18next, lodash, DialogsService) {
        var ctrl = this;
        var lng = i18next.language;

        ctrl.$onInit = onInit;

        ctrl.copyToClipboard = copyToClipboard;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            lodash.defaults(ctrl, {
                tooltipPlacement: 'top'
            });
        }

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
