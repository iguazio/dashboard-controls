(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclDuplicateFunctionDialog', {
            bindings: {
                closeDialog: '&',
                createFunction: '&',
                getFunctions: '&',
                project: '<',
                version: '<'
            },
            templateUrl: 'nuclio/projects/project/functions/duplicate-function-dialog/duplicate-function-dialog.tpl.html',
            controller: DuplicateFunctionDialogController
        });

    function DuplicateFunctionDialogController(lodash, EventHelperService, FormValidationService,
                                               ValidatingPatternsService) {
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

                    ctrl.getFunctions({id: projectID})
                        .then(function (response) {
                            if (lodash.isEmpty(lodash.filter(response, ['metadata.name', ctrl.newFunctionName]))) {
                                ctrl.createFunction({version: newFunction, projectID: projectID})
                                    .then(function () {
                                        ctrl.closeDialog({version: newFunction});
                                    });
                            } else {
                                ctrl.nameTakenError = true;
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
