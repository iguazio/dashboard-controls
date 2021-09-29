(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclDeployDeletedFunctionDialog', {
            bindings: {
                closeDialog: '&',
                deploy: '&',
                version: '<'
            },
            templateUrl: 'nuclio/functions/deploy-deleted-function-dialog/deploy-deleted-function-dialog.tpl.html',
            controller: DeployDeletedFunctionDialogController
        });

    function DeployDeletedFunctionDialogController($state, $rootScope, EventHelperService) {
        var ctrl = this;

        ctrl.deployFunction = deployFunction;
        ctrl.goToFunctions = goToFunctions;
        ctrl.onClose = onClose;

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
         * Redirect to functions panel
         */
        function goToFunctions() {
            $state.go('app.project.functions');

            ctrl.closeDialog();
        }

        /**
         * Deploy function
         * @param {Event} [event]
         */
        function deployFunction(event) {
            ctrl.deploy(event, ctrl.version);
            ctrl.closeDialog();
        }
    }
}());
