(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('igzDuplicateDialog', {
            bindings: {
                addNewApiGatewayCallback: '&?',
                apiGateway: '<?',
                closeDialog: '&',
                getFunctions: '&?',
                getFunction: '&?',
                project: '<?',
                version: '<?'
            },
            templateUrl: 'igz_controls/components/duplicate-dialog/duplicate-dialog.tpl.html',
            controller: DuplicateDialogController
        });

    function DuplicateDialogController($state, $i18next, i18next, lodash, ApiGatewaysDataService, DialogsService,
                                       EventHelperService, FormValidationService, LoginService,
                                       ValidatingPatternsService) {
        var ctrl = this;
        var lng = i18next.language;
        var isDuplicateFunctionDialog = false;

        ctrl.duplicateForm = {};
        ctrl.inputModelOptions = {
            debounce: {
                'default': 0
            }
        };
        ctrl.dialogTitle = '';
        ctrl.inputLabel = '';
        ctrl.inputPlaceholder = '';
        ctrl.nameTakenError = false;
        ctrl.newItemName = '';
        ctrl.validationRules = [];

        ctrl.$onInit = onInit;

        ctrl.duplicate = duplicate;
        ctrl.inputValueCallback = inputValueCallback;
        ctrl.onClose = onClose;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            isDuplicateFunctionDialog = lodash.isEmpty(ctrl.apiGateway);
            ctrl.dialogTitle = isDuplicateFunctionDialog ? $i18next.t('functions:DUPLICATE_FUNCTION', {lng: lng}) :
                                                           $i18next.t('projects:DUPLICATE_API_GATEWAY', {lng: lng});
            ctrl.inputLabel = isDuplicateFunctionDialog ? $i18next.t('common:FUNCTION_NAME', {lng: lng}) :
                                                          $i18next.t('projects:API_GATEWAY_NAME', {lng: lng});
            ctrl.inputPlaceholder = isDuplicateFunctionDialog ? $i18next.t('functions:PLACEHOLDER.ENTER_FUNCTION_NAME', {lng: lng}) :
                                                                $i18next.t('projects:PLACEHOLDER.ENTER_API_GATEWAY_NAME', {lng: lng});
            ctrl.validationRules = ValidatingPatternsService.getValidationRules('k8s.dns1123Label');
        }

        //
        // Public methods
        //

        /**
         * Duplicates selected item
         * @param {Object} event
         */
        function duplicate(event) {
            if (angular.isUndefined(event) || event.keyCode === EventHelperService.ENTER) {
                ctrl.nameTakenError = false;
                ctrl.duplicateForm.$setSubmitted();

                if (ctrl.duplicateForm.$valid) {
                    if (isDuplicateFunctionDialog) {
                        duplicateFunction();
                    } else {
                        duplicateApiGateway();
                    }
                }
            }
        }

        /**
         * Sets new data from input field as a name of the duplicated function
         * @param {string} newData - new string value which should be set
         */
        function inputValueCallback(newData) {
            ctrl.newItemName = newData;
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
         * Duplicates selected api gateway with a new name
         */
        function duplicateApiGateway() {
            var newApiGateway = lodash.pick(ctrl.apiGateway, ['spec', 'meta']);
            var projectName = lodash.get(newApiGateway, 'meta.labels.entries[1].value');
            lodash.set(newApiGateway, 'meta.name', ctrl.newItemName);
            lodash.set(newApiGateway, 'spec.name', ctrl.newItemName);
            lodash.set(newApiGateway, 'meta.labels.entries[0].value', LoginService.getUsername());

            ApiGatewaysDataService.createApiGateway(newApiGateway, projectName)
                .then(function (response) {
                    ctrl.addNewApiGatewayCallback({taskId: response.id, newApiGateway: newApiGateway});
                    ctrl.closeDialog();
                })
                .catch(function (error) {
                    var errorMessage = lodash.get(error, 'data.errors[0].detail', error.statusText);

                    DialogsService.alert(errorMessage);
                });
        }

        /**
         * Duplicates selected function with a new name
         */
        function duplicateFunction() {
            var newFunction = lodash.pick(ctrl.version, 'spec');
            var projectID = lodash.get(ctrl.project, 'metadata.name');

            lodash.set(newFunction, 'metadata.name', ctrl.newItemName);

            ctrl.getFunction({metadata: {name: ctrl.newItemName}})
                .then(function () {
                    DialogsService.alert($i18next.t('functions:ERROR_MSG.FUNCTION_NAME_ALREADY_IN_USE', {lng: lng}))
                })
                .catch(function (error) {
                    if (error.status === 404) {
                        ctrl.closeDialog();

                        $state.go('app.project.function.edit.code', {
                            isNewFunction: true,
                            id: ctrl.project.metadata.name,
                            functionId: newFunction.metadata.name,
                            projectId: projectID,
                            projectNamespace: ctrl.project.metadata.namespace,
                            functionData: newFunction
                        });
                    }
                });
        }
    }
}());
