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
        .component('nclVersionConfigurationBuild', {
            bindings: {
                version: '<',
                onChangeCallback: '<',
                isFunctionDeploying: '&'
            },
            templateUrl: 'nuclio/functions/version/version-configuration/tabs/version-configuration-build/version-configuration-build.tpl.html',
            controller: NclVersionConfigurationBuildController
        });

    function NclVersionConfigurationBuildController($rootScope, $scope, $timeout, $i18next, i18next, lodash, ngDialog,
                                                    Upload, ConfigService, FunctionsService, ValidationService) {
        var ctrl = this;
        var lng = i18next.language;
        var uploadType = '';

        ctrl.actions = initActions();
        ctrl.build = {
            runtimeAttributes: {}
        };
        ctrl.script = {
            uploading: false,
            uploaded: false,
            progress: '0%',
            icon: 'ncl-icon-script',
            name: ''
        };
        ctrl.file = {
            uploading: false,
            uploaded: false,
            progress: '0%',
            icon: 'ncl-icon-file',
            name: ''
        };
        ctrl.disabled = true;
        ctrl.platformKindIsKube = false;
        ctrl.onBuildImageDescription = '';

        ctrl.defaultFunctionConfig = lodash.get(ConfigService, 'nuclio.defaultFunctionConfig.attributes', {});
        ctrl.imageNameValidationPattern = ValidationService.dockerReference;
        ctrl.maxLengths = {
            imageName: ValidationService.getMaxLength('function.imageName')
        };
        ctrl.imageName = '';

        ctrl.$onInit = onInit;
        ctrl.$onChanges = onChanges;
        ctrl.$onDestroy = onDestroy;

        ctrl.deleteFile = deleteFile;
        ctrl.getFileConfig = getFileConfig;
        ctrl.inputValueCallback = inputValueCallback;
        ctrl.isDemoMode = ConfigService.isDemoMode;
        ctrl.onFireAction = onFireAction;
        ctrl.uploadFile = uploadFile;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.onBuildImageDescription = $i18next.t('functions:ONBUILD_IMAGE_DESCRIPTION', {
                interpolation: {
                    prefix: '__',
                    suffix: '__'
                },
                lng: lng
            });
            ctrl.platformKindIsKube = FunctionsService.isKubePlatform();
        }

        /**
         * On changes hook method.
         * @param {Object} changes
         */
        function onChanges(changes) {
            if (angular.isDefined(changes.version)) {
                ctrl.disabled = lodash.get(ctrl.version, 'spec.build.codeEntryType') === 'image';
                ctrl.build.commands = lodash.get(ctrl.version, 'spec.build.commands', []);
                ctrl.build.commands = ctrl.build.commands.join('\n').replace(/''/g, '\'');

                ctrl.build.dependencies = lodash.get(ctrl.version, 'spec.build.dependencies', []).join('\n');
                ctrl.build.runtimeAttributes.repositories = lodash.get(ctrl.version, 'spec.build.runtimeAttributes.repositories', []).join('\n');

                ctrl.imageName = lodash.get(ctrl.version, 'spec.build.image');
                var imageNamePrefix = ctrl.version.ui.imageNamePrefix;
                if (!lodash.isEmpty(imageNamePrefix) && lodash.startsWith(ctrl.imageName, imageNamePrefix)) {
                    ctrl.imageName = ctrl.imageName.replace(imageNamePrefix, '');
                }

                $timeout(function () {
                    if (ctrl.buildForm.$invalid) {
                        ctrl.buildForm.$setSubmitted();
                        $rootScope.$broadcast('change-state-deploy-button', { component: 'build', isDisabled: true });
                    }
                });
            }
        }

        /**
         * Destructor method
         */
        function onDestroy() {
            $rootScope.$broadcast('change-state-deploy-button', {
                component: 'build',
                isDisabled: lodash.get(ctrl.buildForm, '$invalid', false)
            });
        }

        //
        // Public methods
        //

        /**
         * Update spec.buildCommands value
         * @param {string} newData
         * @param {string} field
         */
        function inputValueCallback(newData, field) {
            if (lodash.includes(['commands', 'dependencies', 'runtimeAttributes.repositories'], field)) {
                if (lodash.isEmpty(newData)) {
                    lodash.unset(ctrl.build, field);
                    lodash.unset(ctrl.version, 'spec.build.' + field);
                } else {
                    var commands = newData.replace(/\r/g, '\n').split(/\n+/);

                    lodash.set(ctrl.build, field, newData);
                    lodash.set(ctrl.version, 'spec.build.' + field, commands);
                }
            } else if (field === 'imageName') {
                var imageNamePrefix = ctrl.version.ui.imageNamePrefix;
                var prefix = lodash.isEmpty(imageNamePrefix) ? '' : imageNamePrefix;
                lodash.set(ctrl.version, 'spec.build.image', prefix + newData);
                ctrl.imageName = newData;
            } else {
                if (field === 'readinessTimeoutSeconds' && newData === '') {
                    lodash.unset(ctrl.version, field);
                } else {
                    lodash.set(ctrl.version, field, newData);
                }
            }

            $timeout(function () {
                $rootScope.$broadcast('change-state-deploy-button', {
                    component: 'build',
                    isDisabled: lodash.get(ctrl.buildForm, '$invalid', false)
                });
            });

            ctrl.onChangeCallback();
        }

        /**
         * Returns uploading file config object
         * @returns {Object}
         */
        function getFileConfig() {
            return ctrl[uploadType];
        }

        /**
         * According to given action name calls proper action handler
         * @param {string} fileType - a type of uploading file
         * @returns {boolean} if file of this fileType already uploaded
         */
        function onFireAction(fileType) {

            // this if is a temporary solution as at the moment we don't know the maximum quantity of the uploading files
            if ((fileType === 'file' && ctrl.file.uploaded) || (fileType === 'script' && ctrl.script.uploaded)) {
                return false;
            }

            uploadType = fileType;

            ngDialog.open({
                template: '<ncl-version-configuration-build-dialog data-close-dialog="closeThisDialog(file)"></ncl-version-configuration-build-dialog>',
                plain: true,
                scope: $scope,
                className: 'ngdialog-theme-nuclio version-configuration-build-dialog-wrapper'
            }).closePromise
                .then(function (data) {
                    if (!lodash.isNil(data.value)) {
                        ctrl.uploadFile(data.value);
                    }
                });
        }

        /**
         * Upload selected file on server
         * @param {Object} file - selected file
         */
        function uploadFile(file) {
            var uploadingData = getFileConfig();

            Upload.upload({
                url: '', // TODO
                data: { file: file }
            }).then(function (response) { // on success
                if (!uploadingData.uploaded && !lodash.isNil(response.config.data.file)) {
                    uploadingData.uploading = false;
                    uploadingData.uploaded = true;
                    uploadingData.name = response.config.data.file.name;
                    uploadingData.progress = '100%';
                }
            }, function (response) { // on error
                uploadingData.uploading = false;
                uploadingData.uploaded = false;
            }, function (load) { // on progress
                if (!lodash.isNil(load.config.data.file)) {
                    var progressPercentage = parseInt(100.0 * load.loaded / load.total);

                    uploadingData.uploading = true;
                    uploadingData.progress = progressPercentage + '%';
                    uploadingData.name = load.config.data.file.name;
                }
            });

            uploadingData.uploading = false;
        }

        /**
         * Delete file button handler
         * @param {string} type - type of file
         */
        function deleteFile(type) {
            ctrl[type] = {
                uploading: false,
                uploaded: false,
                progress: '0%',
                icon: 'ncl-icon-' + type,
                name: ''
            };
            ctrl.onChangeCallback();
        }

        //
        // Private methods
        //

        /**
         * Initializes actions
         * @returns {Object[]} - list of actions
         */
        function initActions() {
            return [
                {
                    id: 'script',
                    label: $i18next.t('functions:SCRIPT', { lng: lng }),
                    icon: 'ncl-icon-script',
                    active: true
                },
                {
                    id: 'file',
                    label: $i18next.t('common:FILE', { lng: lng }),
                    icon: 'ncl-icon-file',
                    active: true
                }
            ];
        }
    }
}());
