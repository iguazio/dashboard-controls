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
        .component('nclVersionConfigurationBuildDialog', {
            bindings: {
                closeDialog: '&'
            },
            templateUrl: 'nuclio/functions/version/version-configuration/tabs/version-configuration-build/version-configuration-build-dialog/version-configuration-build-dialog.tpl.html',
            controller: NclVersionConfigurationBuildDialogController
        });

    function NclVersionConfigurationBuildDialogController(EventHelperService) {
        var ctrl = this;

        ctrl.onClose = onClose;
        ctrl.uploadFile = uploadFile;

        //
        // Public methods
        //

        /**
         * Closes dialog
         * @param {Event} [event]
         */
        function onClose(event) {
            if ((angular.isUndefined(event) || event.keyCode === EventHelperService.ENTER) && !ctrl.isLoadingState) {
                ctrl.closeDialog();
            }
        }

        /**
         * Closes dialog and pass selected file for further work
         * @param {Object} file - uploading file
         */
        function uploadFile(file) {
            ctrl.closeDialog({file: file});
        }
    }
}());
