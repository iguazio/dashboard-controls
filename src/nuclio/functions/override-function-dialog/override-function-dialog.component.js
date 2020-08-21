(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclOverrideFunctionDialog', {
            bindings: {
                closeDialog: '&',
                existingFunction: '<',
                newFunction: '<',
                project: '<'
            },
            templateUrl: 'nuclio/functions/override-function-dialog/override-function-dialog.tpl.html',
            controller: OverrideFunctionDialogController
        });

    function OverrideFunctionDialogController($state, lodash, EventHelperService) {
        var ctrl = this;

        ctrl.onClose = onClose;
        ctrl.openExistingFunction = openExistingFunction;
        ctrl.overrideFunction = overrideFunction;

        //
        // Public methods
        //

        /**
         * Closes dialog
         * @param {Event} [event]
         */
        function onClose(event) {
            if (angular.isUndefined(event) || event.keyCode === EventHelperService.ENTER) {
                ctrl.closeDialog();
            }
        }

        /**
         * Opens the existing function
         */
        function openExistingFunction() {
            var projectName = lodash.get(ctrl.existingFunction, ['metadata', 'labels', 'nuclio.io/project-name']);

            $state.go('app.project.function.edit.code', {
                id: projectName,
                projectId: projectName,
                projectNamespace: ctrl.project.metadata.namespace,
                functionId: ctrl.existingFunction.metadata.name
            });

            ctrl.closeDialog();
        }

        /**
         * Overrides the existing function
         */
        function overrideFunction() {
            lodash.defaultsDeep(ctrl.newFunction, {
                status: {
                    state: 'not yet deployed'
                }
            })

            $state.go('app.project.function.edit.code', {
                isNewFunction: true,
                id: ctrl.project.metadata.name,
                projectId: ctrl.project.metadata.name,
                projectNamespace: ctrl.project.metadata.namespace,
                functionId: ctrl.newFunction.metadata.name,
                functionData: ctrl.newFunction
            });

            ctrl.closeDialog();
        }
    }
}());
