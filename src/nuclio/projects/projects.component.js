/* eslint max-statements: ["error", 100] */
(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclProjects', {
            bindings: {
                projects: '<',
                createProject: '&',
                deleteProject: '&',
                updateProject: '&',
                getProjects: '&',
                getFunctions: '&'
            },
            templateUrl: 'nuclio/projects/projects.tpl.html',
            controller: NclProjectsController
        });

    function NclProjectsController($element, $filter, $rootScope, $scope, $state, $q, lodash, ngDialog,
                                   ActionCheckboxAllService, CommonTableService, ConfigService, DialogsService,
                                   ExportService, ImportService, ValidatingPatternsService) {
        var ctrl = this;

        ctrl.actions = [];
        ctrl.dropdownActions = [
            {
                id: 'exportProjects',
                name: 'Export all projects'
            },
            {
                id: 'importProject',
                name: 'Import project'
            }
        ];
        ctrl.checkedItemsCount = 0;
        ctrl.filtersCounter = 0;
        ctrl.isFiltersShowed = {
            value: false,
            changeValue: function (newVal) {
                this.value = newVal;
            }
        };
        ctrl.isReverseSorting = false;
        ctrl.isSplashShowed = {
            value: true
        };
        ctrl.nameValidationPattern = ValidatingPatternsService.name;
        ctrl.searchStates = {};
        ctrl.searchKeys = [
            'spec.displayName',
            'spec.description'
        ];
        ctrl.selectedProject = {};
        ctrl.sortOptions = [
            {
                label: 'Name',
                value: 'displayName',
                active: true
            },
            {
                label: 'Description',
                value: 'description',
                active: false
            },
            {
                label: 'Created by',
                value: 'created_by',
                active: false
            },
            {
                label: 'Created date',
                value: 'created_date',
                active: false
            }
        ];
        ctrl.sortedColumnName = 'displayName';

        ctrl.$onInit = onInit;
        ctrl.$onChanges = onChanges;
        ctrl.$onDestroy = onDestroy;

        ctrl.isDemoMode = ConfigService.isDemoMode;
        ctrl.getColumnSortingClasses = CommonTableService.getColumnSortingClasses;

        ctrl.createFunction = createFunction;
        ctrl.handleAction = handleAction;
        ctrl.importProject = importProject;
        ctrl.isProjectsListEmpty = isProjectsListEmpty;
        ctrl.onApplyFilters = onApplyFilters;
        ctrl.onSortOptionsChange = onSortOptionsChange;
        ctrl.onSelectDropdownAction = onSelectDropdownAction;
        ctrl.onResetFilters = onResetFilters;
        ctrl.onUpdateFiltersCounter = onUpdateFiltersCounter;
        ctrl.openNewProjectDialog = openNewProjectDialog;
        ctrl.refreshProjects = refreshProjects;
        ctrl.sortTableByColumn = sortTableByColumn;
        ctrl.toggleFilters = toggleFilters;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {

            // initializes projects actions array
            ctrl.actions = initActions();

            // TODO pagination

            updateProjects();

            $scope.$on('action-panel_fire-action', onFireAction);
            $scope.$on('action-checkbox-all_checked-items-count-change', updatePanelActions);
            $scope.$on('action-checkbox-all_check-all', updatePanelActions);
        }

        /**
         * Changes method
         * @param {Object} changes
         */
        function onChanges(changes) {
            if (angular.isDefined(changes.projects) && !lodash.isEmpty(changes.projects.currentValue)) {
                ctrl.projects = $filter('orderBy')(ctrl.projects, 'spec.displayName');
            }
        }

        /**
         * Destructor method
         */
        function onDestroy() {
            ngDialog.close();
        }

        //
        // Public methods
        //

        /**
         * Updates current projects
         */
        function updateProjects() {
            ctrl.isSplashShowed.value = true;

            ctrl.getProjects()
                .finally(function () {
                    ctrl.isSplashShowed.value = false;
                });
        }

        /**
         * Navigates to New Function screen
         */
        function createFunction() {
            $state.go('app.create-function', {
                navigatedFrom: 'projects'
            });
        }

        /**
         * According to given action name calls proper action handler
         * @param {string} actionType - e.g. `'delete'`, `'edit'`
         * @param {Array} projects - an array of checked projects
         * @returns {Promise}
         */
        function handleAction(actionType, projects) {
            var errorMessages = [];
            var promises = lodash.map(projects, function (project) {
                var projectDisplayName = lodash.get(project, 'spec.displayName');
                return lodash.result(project, 'ui.' + actionType)
                    .then(function (result) {
                        if (actionType === 'edit') {

                            // update the row in view
                            lodash.merge(project, result);
                        } else if (actionType === 'delete') {

                            // un-check project
                            if (project.ui.checked) {
                                project.ui.checked = false;

                                ActionCheckboxAllService.changeCheckedItemsCount(-1);
                            }

                            // remove from list
                            lodash.pull(ctrl.projects, project);
                        }
                    })
                    .catch(function (errorMessage) {
                        errorMessages.push(projectDisplayName + ': ' + errorMessage);
                    });
            });

            return $q.all(promises)
                .then(function () {
                    if (lodash.isNonEmpty(errorMessages)) {
                        return DialogsService.alert(errorMessages);
                    }
                });
        }

        /**
         * Imports project and updates the projects list
         * @param {File} file
         */
        function importProject(file) {
            ImportService.importProject(file)
                .then(updateProjects);
        }

        /**
         * Checks if functions list is empty
         * @returns {boolean}
         */
        function isProjectsListEmpty() {
            return lodash.isEmpty(ctrl.projects);
        }

        /**
         * Updates projects list depends on filters value
         */
        function onApplyFilters() {
            $rootScope.$broadcast('search-input_refresh-search');
        }

        /**
         * Sorts the table by column name depends on selected value in sort dropdown
         * @param {Object} option
         */
        function onSortOptionsChange(option) {
            var previousElement = lodash.find(ctrl.sortOptions, ['active', true]);
            var newElement = lodash.find(ctrl.sortOptions, ['label', option.label]);

            // change state of selected element, and of previous element
            previousElement.active = false;
            newElement.active = true;

            // if previous value is equal to new value, then change sorting predicate
            if (previousElement.label === newElement.label) {
                newElement.desc = !option.desc;
            }

            ctrl.isReverseSorting = newElement.desc;
            ctrl.sortedColumnName = newElement.value;

            ctrl.sortTableByColumn(ctrl.sortedColumnName);
        }

        /**
         * Called when dropdown action is selected
         * @param {Object} item - selected action
         */
        function onSelectDropdownAction(item) {
            if (item.id === 'exportProjects') {
                ExportService.exportProjects(ctrl.projects, ctrl.getFunctions);
            } else if (item.id === 'importProject') {
                angular.element($element.find('.project-import-input'))[0].click();
            }
        }

        /**
         * Handles on reset filters event
         */
        function onResetFilters() {
            $rootScope.$broadcast('search-input_reset');

            ctrl.filtersCounter = 0;
        }

        /**
         * Handles on update filters counter
         * @param {string} searchQuery
         */
        function onUpdateFiltersCounter(searchQuery) {
            ctrl.filtersCounter = lodash.isEmpty(searchQuery) ? 0 : 1;
        }

        /**
         * Creates and opens new project dialog
         */
        function openNewProjectDialog() {
            ngDialog.open({
                template: '<ncl-new-project-dialog data-close-dialog="closeThisDialog(project)" ' +
                    'data-create-project-callback="ngDialogData.createProject({project: project})">' +
                    '</ncl-new-project-dialog>',
                plain: true,
                scope: $scope,
                data: {
                    createProject: ctrl.createProject
                },
                className: 'ngdialog-theme-nuclio nuclio-project-create-dialog'
            })
                .closePromise
                .then(function (data) {
                    if (!lodash.isNil(data.value)) {
                        updateProjects();
                    }
                });
        }

        /**
         * Refreshes users list
         */
        function refreshProjects() {
            updateProjects();
        }

        /**
         * Sorts the table by column name
         * @param {string} columnName - name of column
         * @param {boolean} isJustSorting - if it is needed just to sort data without changing reverse
         */
        function sortTableByColumn(columnName, isJustSorting) {
            if (!isJustSorting) {

                // changes the order of sorting the column
                ctrl.isReverseSorting = (columnName === ctrl.sortedColumnName) ? !ctrl.isReverseSorting : false;
            }

            // saves the name of sorted column
            ctrl.sortedColumnName = columnName;

            ctrl.projects = $filter('orderBy')(ctrl.projects, 'spec.' + columnName, ctrl.isReverseSorting);
        }

        /**
         * Show/hide filters panel
         */
        function toggleFilters() {
            ctrl.isFiltersShowed.value = !ctrl.isFiltersShowed.value;
        }

        //
        // Private methods
        //

        /**
         * Handler on action-panel broadcast
         * @param {Event} event - $broadcast-ed event
         * @param {Object} data - $broadcast-ed data
         * @param {string} data.action - a name of action
         */
        function onFireAction(event, data) {
            ctrl.handleAction(data.action, lodash.filter(ctrl.projects, 'ui.checked'));
        }

        /**
         * Actions for Action panel
         * @returns {Object[]}
         */
        function initActions() {
            return [
                {
                    label: 'Delete',
                    id: 'delete',
                    icon: 'igz-icon-trash',
                    active: true,
                    confirm: {
                        message: 'Delete selected projects?',
                        yesLabel: 'Yes, Delete',
                        noLabel: 'Cancel',
                        type: 'nuclio_alert'
                    }
                },
                {
                    label: 'Edit',
                    id: 'edit',
                    icon: 'igz-icon-edit',
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
         * Updates actions of action panel according to selected nodes
         * @param {Object} event - triggering event
         * @param {Object} data - passed data
         */
        function updatePanelActions(event, data) {
            var checkedRows = lodash.filter(ctrl.projects, 'ui.checked');
            var checkedRowsCount = data.checkedCount;

            if (checkedRowsCount > 0) {

                // sets visibility status of `edit action`
                // visible if only one project is checked
                var editAction = lodash.find(ctrl.actions, {'id': 'edit'});
                if (!lodash.isNil(editAction)) {
                    editAction.visible = checkedRowsCount === 1;
                }

                // sets confirm message for `delete action` depending on count of checked rows
                var deleteAction = lodash.find(ctrl.actions, {'id': 'delete'});
                if (!lodash.isNil(deleteAction)) {
                    var message = checkedRowsCount === 1 ?
                        'Delete project “' + checkedRows[0].spec.displayName + '”?' : 'Delete selected projects?';

                    deleteAction.confirm = {
                        message: message,
                        description: 'Deleted project cannot be restored.',
                        yesLabel: 'Yes, Delete',
                        noLabel: 'Cancel',
                        type: 'nuclio_alert'
                    };
                }
            }
        }
    }
}());
