(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclProjectsTableRow', {
            bindings: {
                project: '<',
                projectsList: '<',
                actionHandlerCallback: '&',
                deleteProject: '&',
                updateProject: '&',
                getFunctions: '&'
            },
            templateUrl: 'nuclio/projects/projects-table-row/projects-table-row.tpl.html',
            controller: NclProjectsTableRowController
        });

    function NclProjectsTableRowController($scope, $state, lodash, moment, ngDialog, ActionCheckboxAllService,
                                           ConfigService, DialogsService, ExportService) {
        var ctrl = this;

        ctrl.actions = {};

        ctrl.$onInit = onInit;

        ctrl.isDemoMode = ConfigService.isDemoMode;
        ctrl.showDetails = showDetails;
        ctrl.onFireAction = onFireAction;

        //
        // Hook method
        //

        /**
         * Initialization method
         */
        function onInit() {

            // initialize `deleteProject`, `editProject`, `exportProject` actions and assign them to `ui` property of current project
            // initialize `checked` status to `false`
            lodash.defaultsDeep(ctrl.project, {
                ui: {
                    checked: false,
                    delete: handleDeleteProject,
                    edit: editProject,
                    export: exportProject
                }
            });

            if (ConfigService.isDemoMode()) {
                lodash.defaultsDeep(ctrl.project, {
                    spec: {
                        created_by: 'admin',
                        created_date: moment().toISOString()
                    }
                });
            }

            ctrl.actions = initActions();
        }

        //
        // Public method
        //

        /**
         * According to given action name calls proper action handler
         * @param {string} actionType - a type of action
         */
        function onFireAction(actionType) {
            ctrl.actionHandlerCallback({actionType: actionType, checkedItems: [ctrl.project]});
        }

        /**
         * Handles mouse click on a project name
         * Navigates to Functions page
         * @param {MouseEvent} event
         * @param {string} [state=app.project.functions] - absolute state name or relative state path
         */
        function showDetails(event, state) {
            if (!angular.isString(state)) {
                state = 'app.project.functions';
            }

            event.preventDefault();
            event.stopPropagation();

            $state.go(state, {
                projectId: ctrl.project.metadata.name
            });
        }

        //
        // Private methods
        //

        /**
         * Deletes project from projects list
         */
        function handleDeleteProject() {
            ctrl.deleteProject({project: ctrl.project})
                .then(function () {
                    lodash.remove(ctrl.projectsList, ['metadata.name', ctrl.project.metadata.name]);
                })
                .catch(function (error) {
                    var status = lodash.get(error, 'status');
                    var errorMessage = status === 409 ? 'Cannot delete a non-empty project.' :
                        'Unknown error occurred while deleting the project.';
                    return DialogsService.alert(errorMessage);
                });
        }

        /**
         * Initializes actions
         * @returns {Object[]} - list of actions
         */
        function initActions() {
            return [
                {
                    label: 'Delete',
                    id: 'delete',
                    icon: 'igz-icon-trash',
                    active: true,
                    confirm: {
                        message: 'Delete project “' + ctrl.project.spec.displayName + '“?',
                        yesLabel: 'Yes, Delete',
                        noLabel: 'Cancel',
                        description: 'Deleted project cannot be restored.',
                        type: 'nuclio_alert'
                    }
                },
                {
                    label: 'Edit',
                    id: 'edit',
                    icon: 'igz-icon-properties',
                    active: true
                },
                {
                    label: 'Export',
                    id: 'export',
                    icon: 'igz-icon-export-yml',
                    active: true
                }
            ];
        }

        /**
         * Opens `Edit project` dialog
         */
        function editProject() {
            return ngDialog.openConfirm({
                template: '<ncl-edit-project-dialog data-project="$ctrl.project" data-confirm="confirm()"' +
                'data-close-dialog="closeThisDialog(newProject)" data-update-project-callback="ngDialogData.updateProject({project: project})">' +
                '</ncl-edit-project-dialog>',
                plain: true,
                data: {
                    updateProject: ctrl.updateProject
                },
                scope: $scope,
                className: 'ngdialog-theme-nuclio'
            })
                .then(function () {

                    // unchecks project before updating list
                    if (ctrl.project.ui.checked) {
                        ctrl.project.ui.checked = false;

                        ActionCheckboxAllService.changeCheckedItemsCount(-1);
                    }
                });
        }

        /**
         * Exports the project
         */
        function exportProject() {
            ExportService.exportProject(ctrl.project, ctrl.getFunctions);
        }
    }
}());
