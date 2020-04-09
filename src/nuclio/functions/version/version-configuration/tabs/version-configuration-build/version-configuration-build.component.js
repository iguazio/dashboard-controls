(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclVersionConfigurationBuild', {
            bindings: {
                version: '<',
                onChangeCallback: '<'
            },
            templateUrl: 'nuclio/functions/version/version-configuration/tabs/version-configuration-build/version-configuration-build.tpl.html',
            controller: NclVersionConfigurationBuildController
        });

    function NclVersionConfigurationBuildController($rootScope, $scope, $timeout, $i18next, i18next, lodash, ngDialog,
                                                    Upload, ConfigService, ValidatingPatternsService) {
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

        ctrl.defaultFunctionConfig = lodash.get(ConfigService, 'nuclio.defaultFunctionConfig.attributes', {});
        ctrl.imageNameValidationPattern = ValidatingPatternsService.dockerReference;

        ctrl.$onInit = onInit;
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
            ctrl.disabled = lodash.get(ctrl.version, 'spec.build.codeEntryType') === 'image';
            ctrl.build.commands = lodash.get(ctrl.version, 'spec.build.commands', []);
            ctrl.build.commands = ctrl.build.commands.join('\n').replace(/''/g, '\'');

            ctrl.build.dependencies = lodash.get(ctrl.version, 'spec.build.dependencies', []).join('\n');
            ctrl.build.runtimeAttributes.repositories = lodash.get(ctrl.version, 'spec.build.runtimeAttributes.repositories', []).join('\n');

            $timeout(function () {
                if (ctrl.buildForm.$invalid) {
                    ctrl.buildForm.$setSubmitted();
                    $rootScope.$broadcast('change-state-deploy-button', {component: 'build', isDisabled: true});
                }
            });
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
            } else {
                lodash.set(ctrl.version, field, newData);
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
                data: {file: file}
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
                    label: $i18next.t('functions:SCRIPT', {lng: lng}),
                    icon: 'ncl-icon-script',
                    active: true
                },
                {
                    id: 'file',
                    label: $i18next.t('common:FILE', {lng: lng}),
                    icon: 'ncl-icon-file',
                    active: true
                }
            ];
        }
    }
}());
