(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclProjectsWelcomePage', {
            bindings: {
                createProject: '&'
            },
            templateUrl: 'nuclio/projects/projects-welcome-page/projects-welcome-page.tpl.html',
            controller: NclProjectsWelcomePageController
        });

    function NclProjectsWelcomePageController($scope, $state, ngDialog) {
        var ctrl = this;

        ctrl.$onDestroy = onDestroy;

        ctrl.openNewProjectDialog = openNewProjectDialog;

        //
        // Hook method
        //

        /**
         * Destructor method
         */
        function onDestroy() {
            ngDialog.close();
        }

        //
        // Public method
        //

        /**
         * Handle click on `Create new project` button
         * @param {Object} event
         */
        function openNewProjectDialog(event) {
            ngDialog.open({
                template: '<ncl-new-project-dialog data-close-dialog="closeThisDialog(project)" ' +
                'data-create-project-callback="ngDialogData.createProject({project: project})"></ncl-new-project-dialog>',
                plain: true,
                scope: $scope,
                data: {
                    createProject: ctrl.createProject
                },
                className: 'ngdialog-theme-nuclio new-project-dialog-wrapper'
            }).closePromise
                .then(function () {
                    $state.go('app.projects');
                });
        }
    }
}());
