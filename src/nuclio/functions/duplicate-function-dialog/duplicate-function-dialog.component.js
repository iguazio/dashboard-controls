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
        .component('nclDuplicateFunctionDialog', {
            bindings: {
                closeDialog: '&',
                getFunction: '&',
                project: '<',
                version: '<'
            },
            templateUrl: 'nuclio/functions/duplicate-function-dialog/duplicate-function-dialog.tpl.html',
            controller: DuplicateFunctionDialogController
        });

    function DuplicateFunctionDialogController($state, $i18next, i18next, lodash, DialogsService, EventHelperService,
                                               ValidationService) {
        var ctrl = this;
        var lng = i18next.language;

        ctrl.duplicateFunctionForm = {};
        ctrl.inputModelOptions = {
            debounce: {
                'default': 0
            }
        };
        ctrl.maxLengths = {
            functionName: ValidationService.getMaxLength('function.name')
        };
        ctrl.nameTakenError = false;
        ctrl.newFunctionName = '';
        ctrl.validationRules = {
            functionName: ValidationService.getValidationRules('function.name')
        };

        ctrl.duplicateFunction = duplicateFunction;
        ctrl.inputValueCallback = inputValueCallback;
        ctrl.onClose = onClose;

        //
        // Public methods
        //

        /**
         * Duplicates selected function with a new name
         * @param {Object} event
         */
        function duplicateFunction(event) {
            if (angular.isUndefined(event) || event.keyCode === EventHelperService.ENTER) {
                ctrl.nameTakenError = false;
                ctrl.duplicateFunctionForm.$setSubmitted();

                if (ctrl.duplicateFunctionForm.$valid) {
                    var newFunction = lodash.pick(ctrl.version, 'spec');
                    var projectId = lodash.get(ctrl.project, 'metadata.name');

                    lodash.set(newFunction, 'metadata.name', ctrl.newFunctionName);

                    ctrl.getFunction({ metadata: { name: ctrl.newFunctionName } })
                        .then(function () {
                            DialogsService.alert(
                                $i18next.t('functions:ERROR_MSG.FUNCTION_NAME_ALREADY_IN_USE', { lng: lng })
                            )
                        })
                        .catch(function (error) {
                            if (error.status === 404) {
                                ctrl.closeDialog();

                                $state.go('app.project.function.edit.code', {
                                    isNewFunction: true,
                                    id: ctrl.project.metadata.name,
                                    functionId: newFunction.metadata.name,
                                    projectId: projectId,
                                    projectNamespace: ctrl.project.metadata.namespace,
                                    functionData: newFunction
                                });
                            }
                        });
                }
            }
        }

        /**
         * Sets new data from input field as a name of the duplicated function
         * @param {string} newData - new string value which should be set
         */
        function inputValueCallback(newData) {
            ctrl.newFunctionName = newData;
        }

        /**
         * Closes dialog
         * @param {Event} [event]
         */
        function onClose(event) {
            if (angular.isUndefined(event) || event.keyCode === EventHelperService.ENTER) {
                ctrl.closeDialog();
            }
        }
    }
}());
