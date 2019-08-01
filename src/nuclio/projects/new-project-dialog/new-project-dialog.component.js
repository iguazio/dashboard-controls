(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclNewProjectDialog', {
            bindings: {
                closeDialog: '&',
                createProjectCallback: '&'
            },
            templateUrl: 'nuclio/projects/new-project-dialog/new-project-dialog.tpl.html',
            controller: IgzNewProjectDialogController
        });

    function IgzNewProjectDialogController($scope, $i18next, i18next, lodash, moment, ConfigService, DialogsService,
                                           EventHelperService, FormValidationService, ValidatingPatternsService) {
        var ctrl = this;
        var lng = i18next.language;

        ctrl.data = {};
        ctrl.isLoadingState = false;
        ctrl.nameTakenError = false;
        ctrl.nameValidationPattern = ValidatingPatternsService.functionName;
        ctrl.serverError = '';

        ctrl.$onInit = onInit;

        ctrl.isShowFieldError = FormValidationService.isShowFieldError;
        ctrl.isShowFieldInvalidState = FormValidationService.isShowFieldInvalidState;

        ctrl.createProject = createProject;
        ctrl.inputValueCallback = inputValueCallback;
        ctrl.isServerError = isServerError;
        ctrl.onClose = onClose;

        //
        // Hook method
        //

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.data = getBlankData();
        }

        //
        // Public methods
        //

        /**
         * Handle click on `Create project` button or press `Enter`
         * @param {Event} [event]
         */
        function createProject(event) {
            if (angular.isUndefined(event) || event.keyCode === EventHelperService.ENTER) {
                ctrl.nameTakenError = false;
                $scope.newProjectForm.$submitted = true;

                if ($scope.newProjectForm.$valid) {
                    ctrl.isLoadingState = true;

                    if (ConfigService.isDemoMode()) {
                        lodash.defaultsDeep(ctrl.data, {
                            spec: {
                                created_by: 'admin',
                                created_date: moment().toISOString()
                            }
                        });
                    }

                    // use data from dialog to create a new project
                    ctrl.createProjectCallback({ project: ctrl.data })
                        .then(function () {
                            ctrl.closeDialog({ project: ctrl.data });
                        })
                        .catch(function (error) {
                            var status = lodash.get(error, 'status');

                            ctrl.serverError =
                                status === 400                   ? $i18next.t('common:ERROR_MSG.MISSING_MANDATORY_FIELDS', {lng: lng}) :
                                status === 403                   ? $i18next.t('functions:ERROR_MSG.CREATE_PROJECT.403', {lng: lng})    :
                                status === 405                   ? $i18next.t('functions:ERROR_MSG.CREATE_PROJECT.405', {lng: lng})    :
                                status === 409                   ? $i18next.t('functions:ERROR_MSG.CREATE_PROJECT.409', {lng: lng})    :
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
         * Sets new data from input field for corresponding field of new project
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
                ctrl.closeDialog();
            }
        }

        //
        // Private method
        //

        /**
         * Gets black data
         * @returns {Object} - black data
         */
        function getBlankData() {
            return {
                metadata: {
                    name: ''
                },
                spec: {
                    description: ''
                }
            };
        }
    }
}());
