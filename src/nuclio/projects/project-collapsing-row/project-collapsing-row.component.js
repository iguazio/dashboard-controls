(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclProjectCollapsingRow', {
            bindings: {
                deleteFunction: '&',
                deleteProject: '&',
                functionActionHandlerCallback: '&',
                isSplashShowed: '&',
                getFunction: '&',
                getFunctions: '&',
                project: '<',
                projectActionHandlerCallback: '&',
                projectsList: '<',
                updateFunction: '&',
                updateProject: '&'
            },
            templateUrl: 'nuclio/projects/project-collapsing-row/project-collapsing-row.tpl.html',
            transclude: true,
            controller: NclProjectCollapsingRowController
        });

    function NclProjectCollapsingRowController($q, $rootScope, $scope, $state, $timeout, $i18next, i18next, lodash,
                                                moment, ngDialog, ActionCheckboxAllService, ConfigService, ExportService,
                                                ProjectsService, TableSizeService) {
        var ctrl = this;
        var lng = i18next.language;

        ctrl.isProjectFunctionsCollapsed = true;
        ctrl.isProjectCollapsed = true;
        ctrl.projectActions = {};

        ctrl.$onInit = onInit;
        ctrl.$onDestroy = onDestroy;

        ctrl.isProjectEmpty = isProjectEmpty;
        ctrl.onFireAction = onFireAction;
        ctrl.onSelectRow = onSelectRow;
        ctrl.toggleProjectRow = toggleProjectRow;

        ctrl.getFunctionsTableColSize = TableSizeService.getFunctionsTableColSize;
        ctrl.projectsService = ProjectsService;
        ctrl.isDemoMode = ConfigService.isDemoMode;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {

            // initialize `checked` status to `false`
            lodash.defaultsDeep(ctrl.project, {
                ui: {
                    checked: false
                }
            });

            // assign `deleteProject`, `editProject`, `exportProject` actions to `ui` property of current project
            lodash.assign(ctrl.project.ui, {
                'expand-all': expandAllProjectFunctions,
                'collapse-all': collapseAllProjectFunctions,
                'delete': deleteProject,
                'edit': editProject,
                'export': exportProject
            });

            if (ConfigService.isDemoMode()) {
                lodash.defaultsDeep(ctrl.project, {
                    spec: {
                        created_by: 'admin',
                        created_date: moment().toISOString()
                    }
                });
            }

            initProjectActions();

            $scope.$on('expand-all-rows', onExpandAllRows);
            $scope.$on('collapse-all-rows', onCollapseAllRows);
        }

        /**
         * Destructor method
         */
        function onDestroy() {
            if (lodash.get(ctrl.project, 'ui.checked')) {
                lodash.set(ctrl.project, 'ui.checked', false);

                ActionCheckboxAllService.changeCheckedItemsCount(-1);
            }
        }

        //
        // Public method
        //

        /**
         * Checks if project is empty
         * @returns {boolean}
         */
        function isProjectEmpty() {
            return lodash.isEmpty(ctrl.project.ui.functions);
        }

        /**
         * According to given action name calls proper action handler
         * @param {string} actionType - a type of action
         */
        function onFireAction(actionType) {
            ctrl.projectActionHandlerCallback({ actionType: actionType, checkedItems: [ctrl.project] });
        }

        /**
         * Handles mouse click on a project name
         * Navigates to Functions page
         * @param {MouseEvent} event
         * @param {string} [state=app.project.functions] - absolute state name or relative state path
         */
        function onSelectRow(event, state) {
            if (!angular.isString(state)) {
                state = 'app.project.functions';
            }

            event.preventDefault();
            event.stopPropagation();

            $state.go(state, {
                projectId: ctrl.project.metadata.name
            });
        }

        /**
         * Toggles project row
         */
        function toggleProjectRow() {
            $timeout(function () {
                ctrl.isProjectCollapsed = !ctrl.isProjectCollapsed
            })
        }

        //
        // Private methods
        //

        /**
         * Sends broadcast to collapse all function rows in current project
         * @return {Promise}
         */
        function collapseAllProjectFunctions() {
            $rootScope.$broadcast('collapse-all-rows', {
                rowsType: 'functions',
                onlyForProject: ctrl.project
            });

            return $q.when();
        }

        /**
         * Deletes project from projects list
         * @returns {Promise}
         */
        function deleteProject() {
            var projectId = lodash.get(ctrl.project, 'metadata.name');

            return ctrl.deleteProject({ project: ctrl.project })
                .then(function () {
                    return projectId;
                })
                .catch(function (error) {
                    var defaultMsg = $i18next.t('functions:ERROR_MSG.DELETE_PROJECT', {lng: lng});

                    return $q.reject(lodash.get(error, 'data.error', defaultMsg));
                });
        }

        /**
         * Opens `Edit project` dialog
         */
        function editProject() {
            return ngDialog.openConfirm({
                template: '<ncl-edit-project-dialog ' +
                    'data-project="$ctrl.project"' +
                    'data-confirm="confirm(project)" ' +
                    'data-close-dialog="closeThisDialog(value)" ' +
                    'data-update-project-callback="ngDialogData.updateProject({project: project})">' +
                '</ncl-edit-project-dialog>',
                plain: true,
                data: {
                    updateProject: ctrl.updateProject
                },
                scope: $scope,
                className: 'ngdialog-theme-nuclio nuclio-project-edit-dialog'
            })
                .catch(function (error) {
                    if (error !== 'closed') {
                        return $q.reject($i18next.t('functions:ERROR_MSG.UPDATE_PROJECT', {lng: lng}));
                    }
                });
        }

        /**
         * Sends broadcast to expand all function rows in current project
         * @return {Promise}
         */
        function expandAllProjectFunctions() {
            $rootScope.$broadcast('expand-all-rows', {
                rowsType: 'functions',
                onlyForProject: ctrl.project
            });

            return $q.when();
        }

        /**
         * Exports the project
         * @returns {Promise}
         */
        function exportProject() {
            ExportService.exportProject(ctrl.project, ctrl.getFunctions);
            return $q.when();
        }

        /**
         * Initializes project actions
         * @returns {Object[]} - list of project actions
         */
        function initProjectActions() {
            ctrl.projectActions = angular.copy(ProjectsService.initProjectActions());

            var deleteAction = lodash.find(ctrl.projectActions, {'id': 'delete'});

            if (!lodash.isNil(deleteAction)) {
                deleteAction.confirm.message = $i18next.t('functions:DELETE_PROJECT', {lng: lng}) + ' “' +
                    lodash.defaultTo(ctrl.project.spec.displayName, ctrl.project.metadata.name) + '“?'
            }
        }

        /**
         * Expands current project row
         * @param {Event} event - broadcast event
         * @param {Object} data - broadcast data
         */
        function onExpandAllRows(event, data) {
            if (data.rowsType === 'projects') {
                $timeout(function () {
                    ctrl.isProjectCollapsed = false;
                });
            }
        }

        /**
         * Collapses current project row
         * @param {Event} event - broadcast event
         * @param {Object} data - broadcast data
         */
        function onCollapseAllRows(event, data) {
            if (data.rowsType === 'projects') {
                $timeout(function () {
                    ctrl.isProjectCollapsed = true;
                });
            }
        }
    }
}());
