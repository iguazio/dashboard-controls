(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclProjectsTableRow', {
            bindings: {
                project: '<',
                projectsList: '<',
                actionHandlerCallback: '&'
            },
            templateUrl: 'nuclio/projects/projects-table-row/projects-table-row.tpl.html',
            controller: NclProjectsTableRowController
        });

    function NclProjectsTableRowController($scope, $state, lodash, moment, ngDialog, ActionCheckboxAllService, DialogsService,
                                           NuclioProjectsDataService) {
        var ctrl = this;

        ctrl.actions = {};

        ctrl.$onInit = onInit;

        ctrl.showDetails = showDetails;
        ctrl.onFireAction = onFireAction;

        //
        // Hook method
        //

        /**
         * Initialization method
         */
        function onInit() {

            // initialize `deleteProject`, `editProjects` actions and assign them to `ui` property of current project
            // TODO sets default `created_by` and `created_date` if they are not defined
            // initialize `checked` status to `false`
            lodash.defaultsDeep(ctrl.project, {
                spec: {
                    created_by: 'admin',
                    created_date: moment().toISOString()
                },
                ui: {
                    checked: false,
                    delete: deleteProject,
                    edit: editProject
                }
            });

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
        function deleteProject() {
            NuclioProjectsDataService.deleteProject(ctrl.project)
                .catch(function (error) {
                    var errorMessages = {
                        403: 'You do not have permissions to delete this project.',
                        default: 'Unknown error occurred while deleting the project.'
                    };

                    return DialogsService.alert(lodash.get(errorMessages, error.status, errorMessages.default));
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
                }
            ];
        }

        /**
         * Opens `Edit project` dialog
         */
        function editProject() {
            return ngDialog.openConfirm({
                template: '<ncl-edit-project-dialog data-project="$ctrl.project" data-confirm="confirm()"' +
                'data-close-dialog="closeThisDialog(newProject)"></ncl-edit-project-dialog>',
                plain: true,
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
    }
}());
