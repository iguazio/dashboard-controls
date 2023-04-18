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
/*eslint complexity: ["error", 15]*/
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
        ctrl.duplicateInputFieldsData = [];
        ctrl.inputModelOptions = {
            debounce: {
                'default': 0
            }
        };
        ctrl.maxLengths = {
            functionName: ValidationService.getMaxLength('function.name')
        };
        ctrl.nameTakenError = false;
        ctrl.secretFieldsData = {};
        ctrl.validationRules = {
            functionName: ValidationService.getValidationRules('function.name')
        };

        ctrl.$onInit = onInit;

        ctrl.duplicateFunction = duplicateFunction;
        ctrl.inputValueCallback = inputValueCallback;
        ctrl.onClose = onClose;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            generateDuplicateInputFieldsData()
        }

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

                    lodash.forEach(ctrl.secretFieldsData, function (value, path) {
                        if (path === 'name') {
                            lodash.set(newFunction, 'metadata.name', value);
                        } else {
                            lodash.set(newFunction, path, value);
                        }
                    });

                    ctrl.getFunction({ metadata: { name: ctrl.secretFieldsData.name } })
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
         * Sets new data from input field
         * @param {string} newData - new string value which should be set
         * @param {string} field
         */
        function inputValueCallback(newData, field) {
            ctrl.secretFieldsData[field] = newData;
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

        //
        // Private methods
        //

        /**
         * Generates the data to display new input fields
         */
        function generateDuplicateInputFieldsData() {
            ctrl.duplicateInputFieldsData = lodash.map(findFunctionSecrets(), function (elem) {
                var message = '';
                var moreInfoData = '';

                if (elem.key === 'password') {
                    if (elem.path.includes('spec.triggers')) {
                        // Trigger with type MQTT\V3IO, Access key field
                        message = $i18next.t('functions:TRIGGER_ACCESS_KEY', { lng: lng, triggerName: elem.path.split('.')[2]});
                    } else if (elem.path.includes('spec.build')) {
                        // Code Entry Type: Git, Token field
                        message = $i18next.t('functions:CODE_ENTRY_TYPE_PASSWORD', { lng: lng, codeEntryType: lodash.get(ctrl.version, 'spec.build.codeEntryType', '')});
                    }
                } else if (elem.key === 'accessKeyID') {
                    // Trigger with type Kinesis, Access key ID field
                    message = $i18next.t('functions:TRIGGER_ACCESS_KEY_ID', { lng: lng, triggerName: elem.path.split('.')[2]});
                } else if (elem.key === 'secretAccessKey') {
                    // Trigger with type Kinesis, Secret Access key field
                    message = $i18next.t('functions:TRIGGER_SECRET_ACCESS_KEY', { lng: lng, triggerName: elem.path.split('.')[2]});
                } else if (elem.key === 'accessKey') {
                    // Volume with type V3IO, Access key field
                    var volumeName = lodash.get(ctrl.version, elem.path.split('.').slice(0, 3).join('.') + '.volume.name', '');

                    moreInfoData = $i18next.t('functions:ACCESS_KEY_DESCRIPTION');
                    message = $i18next.t('functions:VOLUME_ACCESS_KEY', { lng: lng, volumeName});
                } else if (elem.key === 's3SecretAccessKey') {
                    // Code Entry Type: s3, Session access key field
                    moreInfoData = $i18next.t('functions:TOOLTIP.S3.SECRET_ACCESS_KEY');
                    message = $i18next.t('functions:CODE_ENTRY_TYPE_KEY', { lng: lng, codeEntryType: lodash.get(ctrl.version, 'spec.build.codeEntryType', '')});
                } else if (elem.key === 's3SessionToken') {
                    // Code Entry Type: s3, Session token field
                    moreInfoData = $i18next.t('functions:TOOLTIP.S3.SESSION_TOKEN');
                    message = $i18next.t('functions:CODE_ENTRY_TYPE_TOKEN', { lng: lng, codeEntryType: lodash.get(ctrl.version, 'spec.build.codeEntryType', '')});
                } else if (elem.key === 'Authorization') {
                    // Code Entry Type: GitHub, Token field
                    moreInfoData = $i18next.t('functions:TOOLTIP.GITHUB.TOKEN');
                    message = $i18next.t('functions:CODE_ENTRY_TYPE_TOKEN', { lng: lng, codeEntryType: lodash.get(ctrl.version, 'spec.build.codeEntryType', '')});
                } else if (elem.key === 'X-V3io-Session-Key') {
                    // Code Entry Type: Archive, Access key field
                    moreInfoData = $i18next.t('functions:functions:TOOLTIP.V3IO_ACCESS_KEY');
                    message = $i18next.t('functions:CODE_ENTRY_ACCESS_KEY', { lng: lng, codeEntryType: lodash.get(ctrl.version, 'spec.build.codeEntryType', '')});
                }

                return {
                    moreInfoData,
                    title: message || lodash.startCase(elem.key),
                    key: elem.key,
                    path: elem.path
                }
            });
        }

        /**
         * Generates the list of fields in which the value starts with "$ref"
         * @returns {Array.<Object>}
         */
        function findFunctionSecrets() {
            var secretsArray = [];

            iterateObject(ctrl.version.spec, 'spec');

            return secretsArray;

            function iterateObject(obj, prevPath) {
                for (let [key, value] of Object.entries(obj)) {
                    if (lodash.isArray(value)) {
                        lodash.forEach(value, function (elem, index) {
                            var path = prevPath + '.'  + key + '.[' + index + ']';

                            iterateObject(elem, path);
                        });
                    } else if (lodash.isObject(value)) {
                        var path = prevPath + '.' + key;

                        iterateObject(value, path);
                    } else if (lodash.isString(value) && value.includes('$ref')) {
                        secretsArray.push({
                            path: prevPath + '.' + key,
                            key
                        });
                    }
                }
            }
        }
    }
}());
