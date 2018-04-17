(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclVersionConfigurationBuild', {
            templateUrl: 'nuclio/projects/project/functions/version/version-configuration/tabs/version-configuration-build/version-configuration-build.tpl.html',
            controller: NclVersionConfigurationBuildController
        });

    function NclVersionConfigurationBuildController($scope, $timeout, lodash, ngDialog, Upload) {
        var ctrl = this;
        var uploadType = '';

        ctrl.version = {};
        ctrl.datasetTypesList = [
            {
                value: 'alpine',
                name: 'Alpine',
            },
            {
                value: 'jessie',
                name: 'Jessie',
            }
        ];
        ctrl.actions = initActions();
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

        ctrl.$onInit = onInit;

        ctrl.deleteFile = deleteFile;
        ctrl.getFileConfig = getFileConfig;
        ctrl.inputValueCallback = inputValueCallback;
        ctrl.onBaseImageChange = onBaseImageChange;
        ctrl.onFireAction = onFireAction;
        ctrl.uploadFile = uploadFile;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            lodash.defaultsDeep(ctrl.version, {
                spec: {
                    build: {}
                }
            });
        }

        //
        // Public methods
        //

        /**
         * Update spec.build.baseImage value
         * @param {Object} item
         */
        function onBaseImageChange(item) {
            ctrl.version.spec.build.baseImage = item.value;
        }

        /**
         * Update spec.buildCommands value
         * @param {string} newData
         */
        function inputValueCallback(newData) {
            ctrl.version.spec.build.Commands = newData.replace('\r', '\n').split('\n');
        }

        /**
         * Returns uploading file config object
         * @return {Object}
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
                    ctrl.uploadFile(data.value);
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
                    label: 'Script',
                    icon: 'ncl-icon-script',
                    active: true
                },
                {
                    id: 'file',
                    label: 'File',
                    icon: 'ncl-icon-file',
                    active: true
                }
            ];
        }
    }
}());
