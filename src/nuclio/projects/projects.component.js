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

    function NclProjectsController($element, $filter, $rootScope, $scope, $state, $q, $i18next, i18next, lodash,
                                   ngDialog, ActionCheckboxAllService, CommonTableService, ConfigService,
                                   DialogsService, ExportService, ImportService, ValidatingPatternsService) {
        var ctrl = this;
        var lng = i18next.language;

        ctrl.actions = [];
        ctrl.dropdownActions = [
            {
                id: 'exportProjects',
                name: $i18next.t('functions:EXPORT_ALL_PROJECTS', {lng: lng})
            },
            {
                id: 'importProject',
                name: $i18next.t('functions:IMPORT_PROJECTS', {lng: lng})
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
            'metadata.name',
            'spec.displayName',
            'spec.description'
        ];
        ctrl.selectedProject = {};
        ctrl.sortOptions = [
            {
                label: $i18next.t('common:NAME', {lng: lng}),
                value: 'spec.displayName',
                active: true
            },
            {
                label: $i18next.t('common:DESCRIPTION', {lng: lng}),
                value: 'spec.description',
                active: false
            },
            {
                label: $i18next.t('common:CREATED_BY', {lng: lng}),
                value: 'spec.created_by',
                active: false
            },
            {
                label: $i18next.t('functions:CREATED_DATE', {lng: lng}),
                value: 'spec.created_date',
                active: false
            }
        ];
        ctrl.sortedColumnName = 'spec.displayName';

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
                ctrl.projects = $filter('orderBy')(ctrl.projects, getName, ctrl.isReverseSorting);
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
                var projectName = getName(project);
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
                        errorMessages.push(projectName + ': ' + errorMessage);
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
            ImportService.importFile(file)
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
            var expression = columnName === 'spec.displayName' ? getName : columnName;

            if (!isJustSorting) {
                // changes the order of sorting the column
                ctrl.isReverseSorting = (columnName === ctrl.sortedColumnName) ? !ctrl.isReverseSorting : false;
            }

            // saves the name of sorted column
            ctrl.sortedColumnName = columnName;

            ctrl.projects = $filter('orderBy')(ctrl.projects, expression, ctrl.isReverseSorting);
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
         * Returns correct project name
         * @param {Object} project
         * @returns {string}
         */
        function getName(project) {
            return lodash.defaultTo(project.spec.displayName, project.metadata.name);
        }

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
                    label: $i18next.t('common:DELETE', {lng: lng}),
                    id: 'delete',
                    icon: 'igz-icon-trash',
                    active: true,
                    confirm: {
                        message: $i18next.t('functions:DELETE_PROJECTS_CONFIRM', {lng: lng}),
                        yesLabel: $i18next.t('common:YES_DELETE', {lng: lng}),
                        noLabel: $i18next.t('common:CANCEL', {lng: lng}),
                        type: 'nuclio_alert'
                    }
                },
                {
                    label: $i18next.t('common:EDIT', {lng: lng}),
                    id: 'edit',
                    icon: 'igz-icon-edit',
                    active: true
                },
                {
                    label: $i18next.t('common:EXPORT', {lng: lng}),
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
                        $i18next.t('functions:DELETE_PROJECT', {lng: lng}) + ' “' + getName(checkedRows[0]) + '”?' :
                        $i18next.t('functions:DELETE_PROJECTS_CONFIRM', {lng: lng});

                    deleteAction.confirm = {
                        message: message,
                        description: $i18next.t('functions:DELETE_PROJECT_DESCRIPTION', {lng: lng}),
                        yesLabel: $i18next.t('common:YES_DELETE', {lng: lng}),
                        noLabel: $i18next.t('common:CANCEL', {lng: lng}),
                        type: 'nuclio_alert'
                    };
                }
            }
        }
    }
}());
