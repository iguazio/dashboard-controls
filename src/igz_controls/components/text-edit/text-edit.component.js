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

    /**
     * @name igzTextEdit
     * @description
     * Text edit component. This component is a text editor based on `Monaco code editor`
     * https://github.com/Microsoft/monaco-editor
     *
     * @param {string} content - main text content which can be edited.
     * @param {Object} closeDialog - callback on closing editor dialog.
     * @param {Object} closeButtonText - name of the bottom close/cancel button.
     * @param {string} label - name of the text file.
     * @param {string} language - language of the current content (`plain text`, `javascript` etc.).
     *     Note: uses for updating node after submitting
     * @param {string} submitButtonText - name of the bottom submit/apply button.
     * @param {Object} submitData - callback on submitting data.
     */
    angular.module('iguazio.dashboard-controls')
        .component('igzTextEdit', {
            bindings: {
                content: '@',
                closeDialog: '&',
                closeButtonText: '@',
                ngDialogId: '@',
                label: '@',
                language: '@',
                submitButtonText: '@',
                submitData: '&'
            },
            templateUrl: 'igz_controls/components/text-edit/text-edit.tpl.html',
            controller: IgzTextPreviewController
        });

    function IgzTextPreviewController($i18next, $rootScope, $scope, $timeout, i18next, ngDialog, lodash,
                                      DialogsService) {
        var ctrl = this;
        var lng = i18next.language;
        var contentCopy = '';

        ctrl.enableWordWrap = false;
        ctrl.fileChanged = false;
        ctrl.isLoadingState = false;
        ctrl.serverError = '';

        ctrl.$onInit = onInit;

        ctrl.onChangeText = onChangeText;
        ctrl.onClose = onClose;
        ctrl.onSubmit = onSubmit;

        //
        // Hook method
        //

        /**
         * Init method
         */
        function onInit() {
            contentCopy = angular.copy(ctrl.content);

            $scope.$on('close-dialog-service_close-dialog', ctrl.onClose);
        }

        //
        // Public methods
        //

        /**
         * Sets file changed flag to true
         * @param {string} sourceCode - changed file content
         */
        function onChangeText(sourceCode) {
            var isFileChanged = !lodash.isEqual(contentCopy, sourceCode);

            ctrl.content = sourceCode;

            $timeout(function () {
                ctrl.fileChanged = isFileChanged;
            });

            $rootScope.$broadcast('text-edit_changes-have-been-made', isFileChanged);
        }

        /**
         * Closes dialog
         * @param {Object} event
         * @param {Object} data - broadcast data
         */
        function onClose(event, data) {
            if (angular.isUndefined(event)) {
                if (ctrl.fileChanged) {
                    openConfirmDialog();
                } else {
                    ctrl.closeDialog();
                }
            } else if (event.name === 'close-dialog-service_close-dialog') {
                if (ctrl.fileChanged && (ctrl.ngDialogId === data.dialogId)) {
                    openConfirmDialog();
                } else if (!ctrl.fileChanged && (ctrl.ngDialogId === data.dialogId) || lodash.includes(data.dialogId, 'confirm-dialog')) {
                    ngDialog.close(data.dialogId);
                }
            }
        }

        /**
         * Handle click on Submit Data button
         */
        function onSubmit() {
            contentCopy = angular.copy(ctrl.content);

            if (ctrl.fileChanged) {
                if (angular.isFunction(ctrl.submitData)) {
                    ctrl.isLoadingState = true;
                    ctrl.submitData({newContent: ctrl.content})
                        .then(function (data) {
                            ctrl.closeDialog({value: data});
                        })
                        .catch(function (error) {
                            ctrl.serverError = error.statusText;
                        })
                        .finally(function () {
                            ctrl.isLoadingState = false;
                        });
                }
            }
        }

        //
        // Private methods
        //

        /**
         * Open confirm dialog
         */
        function openConfirmDialog() {
            DialogsService.confirm($i18next.t('common:CHANGES_WERENT_SAVED_CONFIRM', {lng: lng}),
                                   $i18next.t('common:DONT_SAVE', {lng: lng}),
                                   $i18next.t('common:KEEP_EDITING', {lng: lng}),
                                   'text-edit')
                .then(function () {
                    ctrl.closeDialog();
                });
        }
    }
}());
