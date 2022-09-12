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
        .factory('CloseDialogService', CloseDialogService);

    function CloseDialogService($document, $rootScope, lodash, ngDialog, EventHelperService) {
        var scope = $rootScope.$new();
        var isUploadImageWindowOpen = false;
        var isChangesHaveBeenMade = false;

        activate();

        return {
            toggleIsUploadImageWindowOpen: toggleIsUploadImageWindowOpen
        };

        //
        // Public methods
        //

        /**
         * Toggles flag of isUploadImageWindowOpen
         */
        function toggleIsUploadImageWindowOpen() {
            isUploadImageWindowOpen = !isUploadImageWindowOpen;
        }

        //
        // Private methods
        //

        /**
         * Constructor method
         */
        function activate() {
            scope.$on('wizard_changes-have-been-made', onChanges);
            scope.$on('text-edit_changes-have-been-made', onChanges);

            // array of the IDs of opened ndDialogs
            // will change if some ngDialog have been opened or closed
            scope.ngDialogs = ngDialog.getOpenDialogs();

            scope.$watchCollection('ngDialogs', function (newVal, oldVal) {
                if (lodash.isEmpty(oldVal) && newVal.length === 1) {
                    $document.on('keyup', onKeyUp);
                } else if (lodash.isEmpty(newVal)) {
                    $document.off('keyup', onKeyUp);

                    isChangesHaveBeenMade = false;
                }
            });
        }

        /**
         * Closes last opened dialog
         */
        function onKeyUp(event) {
            if (event.keyCode === EventHelperService.ESCAPE) {
                if (isUploadImageWindowOpen || isChangesHaveBeenMade) {
                    isUploadImageWindowOpen = false;
                    $rootScope.$broadcast('close-dialog-service_close-dialog', {dialogId: lodash.last(scope.ngDialogs)});
                } else {
                    ngDialog.close(lodash.last(scope.ngDialogs));

                    if (lodash.isEmpty(scope.ngDialogs)) {
                        $document.off('keyup', onKeyUp);
                    }
                }

                scope.$digest();
            }
        }

        /**
         * Broadcast callback which should be called when wizards has some changes
         * Sends from such wizards: new container wizard, new storage pool wizard
         * @param {Object} event - broadcast event object
         * @param {boolean} data - broadcast data
         */
        function onChanges(event, data) {
            isChangesHaveBeenMade = data;
        }
    }
}());
