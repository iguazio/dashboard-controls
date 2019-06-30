(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclEditProjectDialog', {
            bindings: {
                project: '<',
                confirm: '&',
                closeDialog: '&',
                updateProjectCallback: '&'
            },
            templateUrl: 'nuclio/projects/edit-project-dialog/edit-project-dialog.tpl.html',
            controller: IgzEditProjectDialogController
        });

    function IgzEditProjectDialogController($scope, $i18next, i18next, lodash, EventHelperService,
                                            FormValidationService) {
        var ctrl = this;
        var lng = i18next.language;

        ctrl.data = {};
        ctrl.isLoadingState = false;
        ctrl.nameTakenError = false;
        ctrl.serverError = '';
        ctrl.nameValidationPattern = /^.{1,128}$/;

        ctrl.$onInit = onInit;

        ctrl.isShowFieldError = FormValidationService.isShowFieldError;
        ctrl.isShowFieldInvalidState = FormValidationService.isShowFieldInvalidState;

        ctrl.inputValueCallback = inputValueCallback;
        ctrl.isServerError = isServerError;
        ctrl.onClose = onClose;
        ctrl.saveProject = saveProject;

        //
        // Hook method
        //

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.data = lodash.cloneDeep(ctrl.project);
        }

        //
        // Public methods
        //

        /**
         * Handle click on `Apply changes` button or press `Enter`
         * @param {Event} [event]
         */
        function saveProject(event) {
            if (angular.isUndefined(event) || event.keyCode === EventHelperService.ENTER) {
                ctrl.nameTakenError = false;
                $scope.editProjectForm.$submitted = true;

                if ($scope.editProjectForm.$valid) {
                    ctrl.isLoadingState = true;

                    // use data from dialog to create a new project
                    var newProjectState = lodash.omit(ctrl.data, 'ui');
                    ctrl.updateProjectCallback({ project: newProjectState })
                        .then(function () {
                            ctrl.confirm({ project: newProjectState });
                        })
                        .catch(function (error) {
                            var status = lodash.get(error, 'status');

                            ctrl.serverError =
                                status === 400                   ? $i18next.t('common:ERROR_MSG.MISSING_MANDATORY_FIELDS', {lng: lng}) :
                                status === 403                   ? $i18next.t('functions:ERROR_MSG.UPDATE_PROJECT.403', {lng: lng})    :
                                status === 405                   ? $i18next.t('functions:ERROR_MSG.UPDATE_PROJECT.405', {lng: lng})    :
                                status === 409                   ? $i18next.t('functions:ERROR_MSG.UPDATE_PROJECT.409', {lng: lng})    :
                                lodash.inRange(status, 500, 599) ? $i18next.t('common:ERROR_MSG.SERVER_ERROR', {lng: lng})             :
                                                                   $i18next.t('common:ERROR_MSG.UNKNOWN_ERROR_RETRY_LATER', {lng: lng});

                            if (status === 409) {
                                ctrl.nameTakenError = true;
                            }
                        })
                        .finally(function () {
                            ctrl.isLoadingState = false;
                        });
                }
            }
        }

        /**
         * Sets new data from input field for corresponding field of current project
         * @param {string} newData - new string value which should be set
         * @param {string} field - field name, ex. `name`, `description`
         */
        function inputValueCallback(newData, field) {
            lodash.set(ctrl.data, field, newData);
        }

        /**
         * Checks if server error is present or not
         * @returns {boolean}
         */
        function isServerError() {
            return ctrl.serverError !== '';
        }

        /**
         * Closes dialog
         * @param {Event} [event]
         */
        function onClose(event) {
            if ((angular.isUndefined(event) || event.keyCode === EventHelperService.ENTER) && !ctrl.isLoadingState) {
                ctrl.closeDialog({ value: 'closed'});
            }
        }
    }
}());
