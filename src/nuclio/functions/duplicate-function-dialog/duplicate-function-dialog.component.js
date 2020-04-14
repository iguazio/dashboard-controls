(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclDuplicateFunctionDialog', {
            bindings: {
                closeDialog: '&',
                getFunctions: '&',
                getFunction: '&',
                project: '<',
                version: '<'
            },
            templateUrl: 'nuclio/functions/duplicate-function-dialog/duplicate-function-dialog.tpl.html',
            controller: DuplicateFunctionDialogController
        });

    function DuplicateFunctionDialogController($state, $i18next, i18next, lodash, DialogsService, EventHelperService,
                                               FormValidationService, ValidatingPatternsService) {
        var ctrl = this;
        var lng = i18next.language;

        ctrl.duplicateFunctionForm = {};
        ctrl.inputModelOptions = {
            debounce: {
                'default': 0
            }
        };
        ctrl.nameMaxLength = Infinity;
        ctrl.nameTakenError = false;
        ctrl.newFunctionName = '';
        ctrl.validationRules = [];

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
            ctrl.nameMaxLength = ValidatingPatternsService.getMaxLength('function.name');
            ctrl.validationRules = ValidatingPatternsService.getValidationRules('function.name');
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
                ctrl.duplicateFunctionForm.$submitted = true;

                if (ctrl.duplicateFunctionForm.$valid) {
                    var newFunction = lodash.pick(ctrl.version, 'spec');
                    var projectID = lodash.get(ctrl.project, 'metadata.name');

                    lodash.set(newFunction, 'metadata.name', ctrl.newFunctionName);

                    ctrl.getFunction({metadata: {name: ctrl.newFunctionName}})
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
