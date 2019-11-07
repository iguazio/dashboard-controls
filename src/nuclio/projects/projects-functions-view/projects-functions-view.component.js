/* eslint max-statements: ["error", 100] */
/* eslint max-params: ["error", 25] */
(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclProjectsFunctionsView', {
            bindings: {
                createFunction: '&',
                createProject: '&',
                deleteFunction: '&',
                deleteProject: '&',
                getFunction: '&',
                getFunctions: '&',
                getProject: '&',
                getProjects: '&',
                getStatistics: '&',
                projects: '<',
                updateFunction: '&',
                updateProject: '&'
            },
            templateUrl: 'nuclio/projects/projects-functions-view/projects-functions-view.tpl.html',
            controller: NclProjectsFunctionsViewController
        });

    function NclProjectsFunctionsViewController($element, $filter, $interval, $q, $rootScope, $scope, $state,
                                                $stateParams, $timeout, $transitions, $i18next, i18next, lodash,
                                                ngDialog, ActionCheckboxAllService, CommonTableService, ConfigService,
                                                DialogsService, ElementLoadingStatusService, ExportService,
                                                FunctionsService, ImportService, NuclioHeaderService, ProjectsService,
                                                TableSizeService) {
        var ctrl = this;
        var lng = i18next.language;
        var title = {}; // breadcrumbs config
        var updatingInterval = null;
        var updatingIntervalTime = 30000;

        var METRICS = {
            FUNCTION_CPU: 'nuclio_function_cpu',
            FUNCTION_MEMORY: 'nuclio_function_mem',
            FUNCTION_EVENTS: 'nuclio_processor_handled_events_total',
            MAX_CPU_VALUE: 200
        };


        ctrl.checkedItemsCount = 0;
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
        ctrl.filtersCounter = 0;
        ctrl.functions = [];
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
        ctrl.projectActions = [];
        ctrl.searchKeys = [];
        ctrl.searchStates = {};
        ctrl.selectedProject = {};
        ctrl.sortOptions = [
            {
                label: $i18next.t('common:NAME', {lng: lng}),
                value: 'metadata.name',
                active: true
            },
            {
                label: $i18next.t('common:STATUS', {lng: lng}),
                value: 'status.state',
                active: false
            },
            {
                label: $i18next.t('common:REPLICAS', {lng: lng}),
                value: 'spec.replicas',
                active: false
            },
            {
                label: $i18next.t('functions:RUNTIME', {lng: lng}),
                value: 'spec.runtime',
                active: false
            }
        ];
        ctrl.sortedColumnName = '';
        ctrl.versionActions = [];
        ctrl.viewByOptions = [
            {
                id: 'projects',
                name: $i18next.t('common:PROJECTS', {lng: lng})
            },
            {
                id: 'functions',
                name: $i18next.t('common:FUNCTIONS', {lng: lng})
            }
        ];

        ctrl.$onInit = onInit;
        ctrl.$onChanges = onChanges;
        ctrl.$onDestroy = onDestroy;

        ctrl.changeView = changeView;
        ctrl.collapseAllRows = collapseAllRows;
        ctrl.expandAllRows = expandAllRows;
        ctrl.getVersions = getVersions;
        ctrl.handleFunctionVersionAction = handleFunctionVersionAction;
        ctrl.handleProjectAction = handleProjectAction;
        ctrl.importProject = importProject;
        ctrl.isFunctionsListEmpty = isFunctionsListEmpty;
        ctrl.isProjectsListEmpty = isProjectsListEmpty;
        ctrl.onApplyFilters = onApplyFilters;
        ctrl.onResetFilters = onResetFilters;
        ctrl.onSelectDropdownAction = onSelectDropdownAction;
        ctrl.onSortOptionsChange = onSortOptionsChange;
        ctrl.onUpdateFiltersCounter = onUpdateFiltersCounter;
        ctrl.openNewFunctionScreen = openNewFunctionScreen;
        ctrl.openNewProjectDialog = openNewProjectDialog;
        ctrl.refreshFunctions = refreshFunctions;
        ctrl.refreshProjects = refreshProjects;
        ctrl.sortTableByColumn = sortTableByColumn;
        ctrl.toggleFilters = toggleFilters;

        ctrl.getColumnSortingClasses = CommonTableService.getColumnSortingClasses;
        ctrl.getFunctionsTableColSize = TableSizeService.getFunctionsTableColSize;
        ctrl.isDemoMode = ConfigService.isDemoMode;
        ctrl.projectsService = ProjectsService;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            if ($state.current.url === 'projects') {
                ProjectsService.viewMode = 'projects'
            }
            ctrl.isSplashShowed.value = true;

            // initializes project actions array
            ctrl.projectActions = angular.copy(ProjectsService.initProjectActions());

            // initializes function actions array
            ctrl.functionActions = angular.copy(FunctionsService.initFunctionActions());

            // initializes version actions array
            ctrl.versionActions = angular.copy(FunctionsService.initVersionActions());

            initProjectsFunctionsView(ProjectsService.viewMode);

            $scope.$on('action-panel_fire-action', onFireAction);
            $scope.$on('action-checkbox_item-checked', onItemChecked);
            $scope.$on('action-checkbox-all_checked-items-count-change', onItemsCountChange);
            $scope.$on('action-checkbox-all_check-all', onCheckAll);

            $transitions.onStart({}, stateChangeStart);
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
            stopAutoUpdate();

            ProjectsService.viewMode = ''
        }

        //
        // Public methods
        //

        /**
         * Switches projects/functions view
         * @param {Object} viewMode - new view mode object
         */
        function changeView(viewMode) {
            initProjectsFunctionsView(viewMode.id);

            $timeout(function () {
                ProjectsService.viewMode = viewMode.id;

                updatePanelActions();
            });
        }

        /**
         * Collapses all rows (projects/functions rows, depends on current view mode)
         */
        function collapseAllRows() {
            $rootScope.$broadcast('collapse-all-rows', {rowsType: ProjectsService.viewMode})
        }

        /**
         * Expands all rows (projects/functions rows, depends on current view mode)
         */
        function expandAllRows() {
            $rootScope.$broadcast('expand-all-rows', {rowsType: ProjectsService.viewMode})
        }

        /**
         * Gets list of function versions
         * @returns {string[]}
         */
        function getVersions() {
            return lodash.chain(ctrl.functions)
                .map(function (functionItem) {

                    // TODO
                    return functionItem.version === -1 ? [] : functionItem.versions;
                })
                .flatten()
                .value();
        }

        /**
         * According to given action name calls proper action handler
         * @param {string} actionType - ex. `delete`
         * @param {Array} checkedItems - an array of checked projects
         * @returns {Promise}
         */
        function handleFunctionVersionAction(actionType, checkedItems) {
            var promises = [];

            lodash.forEach(checkedItems, function (checkedItem) {
                var actionHandler = checkedItem.ui[actionType];

                if (lodash.isFunction(actionHandler)) {
                    promises.push(actionHandler());
                }
            });

            return $q.all(promises).then(function () {
                if (angular.isDefined(checkedItems[0].metadata) && actionType === 'delete') {
                    return initFunctions().then(function () {
                        ctrl.isSplashShowed.value = false;
                    })
                }

            });
        }

        /**
         * According to given action name calls proper action handler
         * @param {string} actionType - e.g. `'delete'`, `'edit'`
         * @param {Array} projects - an array of checked projects
         * @returns {Promise}
         */
        function handleProjectAction(actionType, projects) {
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
                .then(updateProjects)
                .then(refreshFunctions);
        }

        /**
         * Checks if functions list is empty
         * @returns {boolean}
         */
        function isFunctionsListEmpty() {
            return lodash.isEmpty(ctrl.functions);
        }

        /**
         * Checks if projects list is empty
         * @returns {boolean}
         */
        function isProjectsListEmpty() {
            return lodash.isEmpty(ctrl.projects);
        }

        /**
         * Updates projects/functions list depends on filters value
         */
        function onApplyFilters() {
            $rootScope.$broadcast('search-input_refresh-search');
        }

        /**
         * Handles on reset filters event
         */
        function onResetFilters() {
            $rootScope.$broadcast('search-input_reset');

            ctrl.filtersCounter = 0;
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
         * Handles on update filters counter
         * @param {string} searchQuery
         */
        function onUpdateFiltersCounter(searchQuery) {
            ctrl.filtersCounter = lodash.isEmpty(searchQuery) ? 0 : 1;
        }

        /**
         * Navigates to New Function screen
         */
        function openNewFunctionScreen() {
            var state = ProjectsService.viewMode === '' ? 'app.project.create-function' : 'app.create-function';

            $state.go(state, {
                navigatedFrom: ProjectsService.viewMode
            });
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
         * Refreshes function list
         * @returns {Promise}
         */
        function refreshFunctions() {
            ctrl.isSplashShowed.value = true;

            var promises = lodash.map(ctrl.projects, function (project) {
                return getFunctionsByProject(project)
            });

            return $q.all(promises)
                .then(function () {
                    if (ProjectsService.viewMode !== 'projects' && lodash.isEmpty(ctrl.functions) && !$stateParams.createCancelled) {
                        ctrl.isSplashShowed.value = false;
                        var state = ProjectsService.viewMode === 'functions' ? 'app.create-function' : 'app.project.create-function';

                        $state.go(state, {
                            navigatedFrom: ProjectsService.viewMode
                        });
                    } else {

                        // TODO: unmock versions data
                        lodash.forEach(ctrl.functions, function (functionItem) {
                            lodash.set(functionItem, 'versions', [{
                                name: '$LATEST',
                                invocation: '30'
                            }]);
                            lodash.set(functionItem, 'spec.version', 1);
                        });

                    }

                    updateStatistics();
                })
                .catch(function (error) {
                    var defaultMsg = $i18next.t('functions:ERROR_MSG.GET_FUNCTIONS', {lng: lng});

                    DialogsService.alert(lodash.get(error, 'data.error', defaultMsg));
                })
                .finally(function () {
                    ctrl.isSplashShowed.value = false;
                });
        }

        /**
         * Refreshes users list
         */
        function refreshProjects() {
            updateProjects()
                .then(refreshFunctions);
        }

        /**
         * Sorts the table by column name
         * @param {string} columnName - name of column
         * @param {boolean} isJustSorting - if it is needed just to sort data without changing reverse
         */
        function sortTableByColumn(columnName, isJustSorting) {
            var expression = (ProjectsService.viewMode === 'projects' && columnName === 'spec.displayName') ? getName : columnName;

            if (!isJustSorting) {

                // changes the order of sorting the column
                ctrl.isReverseSorting = (columnName === ctrl.sortedColumnName) ? !ctrl.isReverseSorting : false;
            }

            // saves the name of sorted column
            ctrl.sortedColumnName = columnName;

            if (lodash.isEmpty(ProjectsService.viewMode)) {
                ctrl.functions = $filter('orderBy')(ctrl.functions, expression, ctrl.isReverseSorting);
            } else {
                ctrl[ProjectsService.viewMode] = $filter('orderBy')(ctrl[ProjectsService.viewMode], expression, ctrl.isReverseSorting);
            }
        }

        /**
         * Shows/hides filters panel
         */
        function toggleFilters() {
            ctrl.isFiltersShowed.value = !ctrl.isFiltersShowed.value;
        }

        //
        // Private methods
        //

        /**
         * Gets functions list promise
         * @param {Object} project
         * @returns {Promise}
         */
        function getFunctionsByProject(project) {

            // gets all functions by given project
            return ctrl.getFunctions({id: project.metadata.name})
                .then(function (functions) {
                    var functionsList = lodash.map(functions, function (functionFromResponse) {
                        var foundFunction = lodash.find(project.ui.functions, ['metadata.name', functionFromResponse.metadata.name]);
                        var ui = lodash.get(foundFunction, 'ui');
                        functionFromResponse.ui = lodash.defaultTo(ui, {project: project});

                        return functionFromResponse;
                    });

                    lodash.set(project, 'ui.functions', functionsList);

                    ctrl.functions = lodash.unionWith(functionsList, ctrl.functions, function (func1, func2) {
                        return func1.metadata.name === func2.metadata.name;
                    });
                });
        }

        /**
         * Returns correct project name
         * @param {Object} project
         * @returns {string}
         */
        function getName(project) {
            return lodash.defaultTo(project.spec.displayName, project.metadata.name);
        }

        /**
         * Initializes functions list
         * @returns {Promise}
         */
        function initFunctions() {
            var getProjectPromise = '';

            // if view mode is empty, current state is functions list by project
            // gets project from state params
            if (lodash.isEmpty(ProjectsService.viewMode)) {
                getProjectPromise = ctrl.getProject({id: $stateParams.projectId})
                    .then(function (project) {
                        project.ui = {};
                        ctrl.projects = [project];
                        title.project = project;

                        NuclioHeaderService.updateMainHeader('common:PROJECTS', title, $state.current.name);
                    })
            }

            return $q.when(getProjectPromise).then(function () {
                // it is important to render function list only after external IP addresses response is
                // back, otherwise the "Invocation URL" column might be "N/A" to a function (even if it
                // is deployed, i.e. `status.httpPort` is a number), because as long as the external IP
                // address response is not returned, it is empty and is passed to each function row
                ctrl.refreshFunctions()
                    .then(startAutoUpdate)
                    .catch(function (error) {
                        ctrl.isSplashShowed.value = false;
                        var defaultMsg = $i18next.t('functions:ERROR_MSG.GET_FUNCTIONS', {lng: lng});

                        DialogsService.alert(lodash.get(error, 'data.error', defaultMsg)).then(function () {
                            $state.go('app.projects');
                        });
                    });
            });
        }

        /**
         * Initializes data for new projects/function view
         * @param {Object} viewMode - new view mode object
         */
        function initProjectsFunctionsView(viewMode) {
            ctrl.isSplashShowed.value = true;

            stopAutoUpdate();

            if (viewMode === 'projects') {
                updateProjects(true)
                    .then(function () {
                        initFunctions()
                    });

                ctrl.searchKeys = [
                    'metadata.name',
                    'spec.displayName',
                    'spec.description'
                ];
                ctrl.sortedColumnName = 'spec.displayName';
            } else {
                initFunctions();

                ctrl.searchKeys = [
                    'metadata.name',
                    'spec.description'
                ];
                ctrl.sortedColumnName = 'metadata.name';
            }

            updatePanelActions();
        }

        /**
         * Handler on action-panel broadcast
         * @param {Event} event - $broadcast-ed event
         * @param {Object} data - $broadcast-ed data
         */
        function onFireAction(event, data) {
            if (ProjectsService.checkedItem === 'projects') {
                ctrl.handleProjectAction(data.action, lodash.filter(ctrl.projects, 'ui.checked'));
            } else if (ProjectsService.checkedItem === 'functions') {
                var checkedFunctions = lodash.filter(ctrl.functions, 'ui.checked');

                ctrl.handleFunctionVersionAction(data.action, checkedFunctions);
            } else if (ProjectsService.checkedItem === 'versions') {
                var checkedVersions = lodash.chain(ctrl.functions)
                    .map(function (functionItem) {
                        return lodash.filter(functionItem.versions, 'ui.checked');
                    })
                    .flatten()
                    .value();

                ctrl.handleFunctionVersionAction(data.action, checkedVersions);
            }
        }

        /**
         * Handler on `checkbox-all` click
         * @param {Event} event - broadcast event
         * @param {Object} data - broadcast data
         */
        function onCheckAll(event, data) {
            if (data.checkedCount === 0) {
                ProjectsService.checkedItem = '';
            }

            $timeout(updatePanelActions);
        }

        /**
         * Handler on checkbox click
         * @param {Event} event - broadcast event
         * @param {Object} data - broadcast data
         */
        function onItemChecked(event, data) {
            if (!lodash.isEmpty(data.itemType)) {
                ProjectsService.checkedItem = data.itemType
            }
        }

        /**
         * Handler on change checked items count
         * @param {Event} event - broadcast event
         * @param {Object} data - broadcast data
         */
        function onItemsCountChange(event, data) {
            if (data.checkedCount === 0) {
                ProjectsService.checkedItem = '';
            }

            updatePanelActions();
        }

        /**
         * Starts auto-update statistics.
         */
        function startAutoUpdate() {
            if (lodash.isNull(updatingInterval)) {
                updatingInterval = $interval(updateStatistics, updatingIntervalTime);
            }
        }

        /**
         * Opens a splash screen on start change state
         */
        function stateChangeStart() {
            ctrl.isSplashShowed.value = true;
        }

        /**
         * Stops auto-update statistics
         */
        function stopAutoUpdate() {
            if (!lodash.isNull(updatingInterval)) {
                $interval.cancel(updatingInterval);
                updatingInterval = null;
            }
        }

        /**
         * Updates actions of action panel according to selected nodes
         * @param {Object} event - triggering event
         * @param {Object} data - passed data
         */
        function updatePanelActions(event, data) {
            if (ProjectsService.checkedItem === 'projects') {
                updatePanelProjectActions(data);
            } else if (ProjectsService.checkedItem === 'functions') {
                updatePanelFunctionActions(data);
            } else if (ProjectsService.checkedItem === 'versions') {
                updatePanelVersionActions(data);
            }

            /**
             * Updates project actions
             * @param {Object} actionData - passed data
             */
            function updatePanelProjectActions(actionData) {
                var checkedRows = lodash.filter(ctrl.projects, 'ui.checked');
                var checkedRowsCount = lodash.get(actionData, 'checkedCount') || checkedRows.length;

                if (checkedRowsCount > 0) {

                    // sets visibility status of `edit action`
                    // visible if only one project is checked
                    var editAction = lodash.find(ctrl.projectActions, {'id': 'edit'});

                    if (!lodash.isNil(editAction)) {
                        editAction.visible = checkedRowsCount === 1;
                    }

                    // sets confirm message for `delete action` depending on count of checked rows
                    var deleteAction = lodash.find(ctrl.projectActions, {'id': 'delete'});

                    if (!lodash.isNil(deleteAction)) {
                        deleteAction.confirm.message = checkedRowsCount === 1 ?
                            $i18next.t('functions:DELETE_PROJECT', {lng: lng}) + ' “' + getName(checkedRows[0]) + '”?' :
                            $i18next.t('functions:DELETE_PROJECTS_CONFIRM', {lng: lng});
                    }
                }
            }

            /**
             * Updates function actions
             * @param {Object} actionData - passed data
             */
            function updatePanelFunctionActions(actionData) {
                var checkedRows = lodash.filter(ctrl.functions, 'ui.checked');
                var checkedRowsCount = lodash.get(actionData, 'checkedCount') || checkedRows.length;

                if (checkedRowsCount > 0) {

                    // sets visibility status of `duplicate, export, viewConfig` actions
                    // visible if only one function is checked
                    var duplicateAction = lodash.find(ctrl.functionActions, {'id': 'duplicate'});
                    var exportAction = lodash.find(ctrl.functionActions, {'id': 'export'});
                    var viewConfigAction = lodash.find(ctrl.functionActions, {'id': 'viewConfig'});

                    if (!lodash.isNil(duplicateAction)) {
                        duplicateAction.visible = checkedRowsCount === 1;
                    }

                    if (!lodash.isNil(exportAction)) {
                        exportAction.visible = checkedRowsCount === 1;
                    }

                    if (!lodash.isNil(viewConfigAction)) {
                        viewConfigAction.visible = checkedRowsCount === 1;
                    }

                    // sets confirm message for `delete action` depending on count of checked rows
                    var deleteAction = lodash.find(ctrl.functionActions, {'id': 'delete'});

                    if (!lodash.isNil(deleteAction)) {
                        deleteAction.confirm.message = checkedRowsCount === 1 ?
                            $i18next.t('functions:DELETE_FUNCTION', {lng: lng}) + ' “' + checkedRows[0].metadata.name + '”?' :
                            $i18next.t('functions:DELETE_FUNCTIONS_CONFIRM', {lng: lng});
                    }
                }
            }

            /**
             * Updates version actions
             * @param {Object} actionData - passed data
             */
            function updatePanelVersionActions(actionData) {
                var checkedRows = lodash.chain(ctrl.functions)
                                        .map(function (functionItem) {
                                            return lodash.filter(functionItem.versions, 'ui.checked');
                                        })
                                        .flatten()
                                        .value();
                var checkedRowsCount = lodash.get(actionData, 'checkedCount') || checkedRows.length;

                if (checkedRowsCount > 0) {

                    // sets visibility status of `edit action`
                    // visible if only one version is checked
                    var editAction = lodash.find(ctrl.versionActions, {'id': 'edit'});

                    if (!lodash.isNil(editAction)) {
                        editAction.visible = checkedRowsCount === 1;
                    }

                    // sets confirm message for `delete action` depending on count of checked rows
                    var deleteAction = lodash.find(ctrl.versionActions, {'id': 'delete'});

                    if (!lodash.isNil(deleteAction)) {
                        deleteAction.confirm.message = checkedRowsCount === 1 ?
                            $i18next.t('functions:DELETE_VERSION', {lng: lng}) + ' “' + checkedRows[0].name + '”?' :
                            $i18next.t('functions:DELETE_VERSIONS_CONFIRM', {lng: lng});
                    }
                }
            }
        }

        /**
         * Updates current projects
         * @param {boolean} hideSplashScreen
         * @returns {Promise}
         */
        function updateProjects(hideSplashScreen) {
            if (!hideSplashScreen) {
                ctrl.isSplashShowed.value = true;
            }

            return ctrl.getProjects()
                .finally(function () {
                    if (!hideSplashScreen) {
                        ctrl.isSplashShowed.value = false;
                    }
                });
        }

        /**
         * Gets and parses data for Invocation #, CPU and Memory columns
         */
        function updateStatistics() {
            var MILLIS_IN_AN_HOUR = 60 * 60 * 1000;
            var now = Date.now();
            var from = new Date(now - MILLIS_IN_AN_HOUR).toISOString();
            var until = new Date(now).toISOString();
            var args = {
                metric: METRICS.FUNCTION_EVENTS,
                from: from,
                until: until,
                interval: '5m'
            };

            ctrl.getStatistics(args)
                .then(parseData.bind(null, args.metric))
                .catch(handleError.bind(null, args.metric));

            args.metric = METRICS.FUNCTION_CPU;
            ctrl.getStatistics(args)
                .then(parseData.bind(null, args.metric))
                .catch(handleError.bind(null, args.metric));

            args.metric = METRICS.FUNCTION_MEMORY;
            ctrl.getStatistics(args)
                .then(parseData.bind(null, args.metric))
                .catch(handleError.bind(null, args.metric));

            /**
             * Returns CPU value
             */
            function getCpuValue(value) {
                return Number(value) / METRICS.MAX_CPU_VALUE * 100;
            }

            /**
             * Sets error message to the relevant function
             */
            function handleError(type, error) {
                lodash.forEach(ctrl.functions, function (aFunction) {
                    lodash.set(aFunction, 'ui.error.' + type, error.msg);

                    $timeout(function () {
                        $rootScope.$broadcast('element-loading-status_hide-spinner', {name: type + '-' + aFunction.metadata.name});
                    });
                });
            }

            /**
             * Parses data for charts
             * @param {string} type
             * @param {Object} data
             */
            function parseData(type, data) {
                var results = lodash.get(data, 'result', []);

                lodash.forEach(ctrl.functions, function (aFunction) {
                    var funcStats = [];

                    lodash.forEach(results, function (result) {
                        var functionName = lodash.get(aFunction, 'metadata.name');
                        var metric = lodash.get(result, 'metric', {});
                        var resultName = lodash.defaultTo(metric.function, metric.function_name);

                        if (resultName === functionName) {
                            funcStats.push(result);
                        }
                    });

                    if (lodash.isObject(funcStats)) {
                        var latestValue = lodash.sum(lodash.map(funcStats, function (stat) {
                            return Number(lodash.last(stat.values)[1]);
                        }));

                        // calculating of invocation per second regarding last timestamps
                        var invocationPerSec = lodash.chain(funcStats)
                            .map(function (stat) {
                                var firstValue;
                                var secondValue;

                                if (stat.values.length < 2) {
                                    return 0;
                                }

                                // handle array of length 2
                                firstValue = stat.values[0];
                                secondValue = stat.values[1];

                                // when querying up to current time prometheus
                                // may duplicate the last value, so we calculate an earlier
                                // interval [pre-last] to get a meaningful value
                                if (stat.values.length > 2) {
                                    firstValue = stat.values[stat.values.length - 3];
                                    secondValue = stat.values[stat.values.length - 2];
                                }

                                var valuesDiff = Number(secondValue[1]) - Number(firstValue[1]);
                                var timestampsDiff = secondValue[0] - firstValue[0];

                                return valuesDiff / timestampsDiff;
                            })
                            .sum()
                            .value();

                        var funcValues = lodash.get(funcStats, '[0].values', []);

                        if (funcStats.length > 1) {
                            funcValues = lodash.fromPairs(funcValues);

                            for (var i = 1; i < funcStats.length; i++) {
                                var values = lodash.get(funcStats, '[' + i + '].values', []);

                                lodash.forEach(values, function (value) { // eslint-disable-line no-loop-func
                                    var timestamp = value[0];

                                    lodash.set(funcValues, timestamp, lodash.has(funcValues, timestamp) ?
                                        Number(funcValues[timestamp]) + Number(value[1]) : Number(value[1]));
                                });
                            }

                            funcValues = lodash.chain(funcValues)
                                .toPairs()
                                .sortBy(function (value) {
                                    return value[0];
                                })
                                .value();
                        }

                        if (type === METRICS.FUNCTION_CPU) {
                            lodash.merge(aFunction.ui, {
                                metrics: {
                                    'cpu.cores': latestValue,
                                    cpuCoresLineChartData: lodash.map(funcValues, function (dataPoint) {
                                        return [dataPoint[0] * 1000, Number(dataPoint[1])]; // [time, value]
                                    })
                                }
                            })
                        } else if (type === METRICS.FUNCTION_MEMORY) {
                            lodash.merge(aFunction.ui, {
                                metrics: {
                                    size: Number(latestValue),
                                    sizeLineChartData: lodash.map(funcValues, function (dataPoint) {
                                        return [dataPoint[0] * 1000, Number(dataPoint[1])]; // [time, value]
                                    })
                                }
                            })
                        } else { // type === METRICS.FUNCTION_COUNT
                            lodash.merge(aFunction.ui, {
                                metrics: {
                                    count: Number(latestValue),
                                    countLineChartData: lodash.map(funcValues, function (dataPoint) {
                                        return [dataPoint[0] * 1000, Number(dataPoint[1])]; // [time, value]
                                    }),
                                    invocationPerSec: $filter('scale')(invocationPerSec, Number.isInteger(invocationPerSec) ? 0 : 2)
                                }
                            })
                        }
                    }
                });

                ElementLoadingStatusService.hideSpinnerGroup(lodash.map(ctrl.functions, function (aFunction) {
                    return type + '-' + lodash.get(aFunction, 'metadata.name');
                }));
            }
        }
    }
}());
