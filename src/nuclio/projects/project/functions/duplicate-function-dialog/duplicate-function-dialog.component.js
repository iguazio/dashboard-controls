(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclDuplicateFunctionDialog', {
            bindings: {
                closeDialog: '&',
                project: '<',
                version: '<'
            },
            templateUrl: 'nuclio/projects/project/functions/duplicate-function-dialog/duplicate-function-dialog.tpl.html',
            controller: DuplicateFunctionDialogController
        });

    function DuplicateFunctionDialogController($scope, EventHelperService, FormValidationService, FunctionsService,
                                               NuclioCommonService, ValidatingPatternsService) {
        var ctrl = this;

        ctrl.duplicateFunctionForm = {};
        ctrl.inputModelOptions = {
            debounce: {
                'default': 0
            }
        };
        ctrl.nameTakenError = false;
        ctrl.newFunctionName = '';

        ctrl.isShowFieldInvalidState = FormValidationService.isShowFieldInvalidState;
        ctrl.validationPatterns = ValidatingPatternsService;

        ctrl.duplicateFunction = duplicateFunction;
        ctrl.inputValueCallback = inputValueCallback;
        ctrl.onClose = onClose;

        //
        // Public methods
        //

        /**
         * Wrapper for `FunctionsService.duplicateFunction` method
         */
        function duplicateFunction(event) {
            if (angular.isUndefined(event) || event.keyCode === EventHelperService.ENTER) {
                ctrl.nameTakenError = false;
                ctrl.duplicateFunctionForm.$submitted = true;

                if (ctrl.duplicateFunctionForm.$valid) {
                    NuclioCommonService.duplicateFunction(ctrl.version, ctrl.newFunctionName, ctrl.project.metadata.name)
                        .then(ctrl.closeDialog)
                        .catch(function () {
                            ctrl.nameTakenError = true;
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
