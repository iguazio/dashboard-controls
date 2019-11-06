(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclFunctionCollapsingRow', {
            bindings: {
                actionHandlerCallback: '&',
                function: '<',
                functionsList: '<',
                getFunction: '&',
                getFunctions: '&',
                handleDeleteFunction: '&',
                isProjectsView: '<',
                isSplashShowed: '<',
                isProjectCollapsed: '<',
                project: '<',
                refreshFunctionsList: '&',
                updateFunction: '&'
            },
            templateUrl: 'nuclio/projects/project/functions/function-collapsing-row/function-collapsing-row.tpl.html',
            controller: NclFunctionCollapsingRowController
        });

    function NclFunctionCollapsingRowController($interval, $scope, $state, $timeout, $i18next, i18next, lodash,
                                                ngDialog, ActionCheckboxAllService, ConfigService, DialogsService,
                                                ExportService, FunctionsService, NuclioHeaderService, ProjectsService,
                                                TableSizeService) {
        var ctrl = this;
        var tempFunctionCopy = null;
        var interval = null;
        var lng = i18next.language;

        ctrl.functionActions = [];
        ctrl.functionNameTooltip = '';
        ctrl.invocationURL = '';
        ctrl.isFunctionCollapsed = true;
        ctrl.runtimes = {
            'golang': 'Go',
            'python:2.7': 'Python 2.7',
            'python:3.6': 'Python 3.6',
            'dotnetcore': '.NET Core',
            'java': 'Java',
            'nodejs': 'NodeJS',
            'shell': 'Shell',
            'ruby': 'Ruby'
        };
        ctrl.scrollConfig = {
            axis: 'y',
            advanced: {
                updateOnContentResize: true
            }
        };
        ctrl.statusIcon = null;
        ctrl.title = null;

        ctrl.$onInit = onInit;
        ctrl.$onDestroy = onDestroy;
        ctrl.$onChanges = onChanges;

        ctrl.getTooltip = getTooltip;
        ctrl.handleAction = handleAction;
        ctrl.isFunctionShowed = isFunctionShowed;
        ctrl.onFireAction = onFireAction;
        ctrl.onSelectRow = onSelectRow;
        ctrl.toggleFunctionRow = toggleFunctionRow;
        ctrl.toggleFunctionState = toggleFunctionState;

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
            ctrl.title = {
                project: ctrl.project,
                function: ctrl.function.metadata.name
            };
            ctrl.functionNameTooltip = '<b>' + ctrl.function.metadata.name + '</b>' +
                (ctrl.function.spec.description ? '<br><br>' + ctrl.function.spec.description : '');

            lodash.defaultsDeep(ctrl.function, {
                ui: {
                    metrics: {
                        count: null,
                        'cpu.idle': null,
                        size: null
                    }
                }
            });

            lodash.merge(ctrl.function, {
                ui: {
                    checked: false,
                    delete: deleteFunction,
                    duplicate: duplicateFunction,
                    export: exportFunction,
                    viewConfig: viewConfig
                }
            });

            initFunctionActions();

            $scope.$on('expand-all-rows', onExpandAllRows);
            $scope.$on('collapse-all-rows', onCollapseAllRows);
        }

        /**
         * Destructor method
         */
        function onDestroy() {
            terminateInterval();

            if (lodash.get(ctrl.function, 'ui.checked')) {
                lodash.set(ctrl.function, 'ui.checked', false);

                ActionCheckboxAllService.changeCheckedItemsCount(-1);
            }
        }

        /**
         * On changes hook method
         * @param {Object} changes
         */
        function onChanges(changes) {
            if (lodash.has(changes, 'function')) {
                var externalAddress = ConfigService.nuclio.externalIPAddress;

                convertStatusState();
                setStatusIcon();

                ctrl.invocationURL =
                    lodash.isNil(ctrl.function.status.httpPort) ? $i18next.t('functions:NOT_YET_DEPLOYED', {lng: lng}) :
                    lodash.isEmpty(externalAddress)             ? 'N/A'                                                :
                                                                  'http://' + externalAddress + ':' +
                                                                  ctrl.function.status.httpPort;
            }
        }

        //
        // Public methods
        //

        /**
         * Returns appropriate tooltip for functions status.
         * @returns {string} - tooltip
         */
        function getTooltip() {
            return ctrl.function.spec.disable ? $i18next.t('functions:TOOLTIP.RUN_FUNCTION', {lng: lng}) :
                $i18next.t('functions:TOOLTIP.STOP_FUNCTION', {lng: lng});
        }

        /**
         * According to given action name calls proper action handler
         * @param {string} actionType
         * @param {Array} checkedItems
         * @returns {Promise}
         */
        function handleAction(actionType, checkedItems) {
            ctrl.actionHandlerCallback({ actionType: actionType, checkedItems: checkedItems });
        }

        /**
         * Determines whether the current layer is showed
         * @returns {boolean}
         */
        function isFunctionShowed() {
            return ctrl.function.ui.isShowed;
        }

        /**
         * According to given action name calls proper action handler
         * @param {string} actionType - a type of action
         */
        function onFireAction(actionType) {
            ctrl.actionHandlerCallback({ actionType: actionType, checkedItems: [ctrl.function] });
        }

        /**
         * Handles mouse click on a table row and navigates to Code page of latest version
         * @param {MouseEvent} event
         * @param {string} state - absolute state name or relative state path
         */
        function onSelectRow(event, state) {
            if (!angular.isString(state)) {
                state = 'app.project.function.edit.code';
            }

            event.preventDefault();
            event.stopPropagation();

            $state.go(state, {
                id: ctrl.project.metadata.name,
                projectId: ctrl.project.metadata.name,
                functionId: ctrl.function.metadata.name,
                projectNamespace: ctrl.project.metadata.namespace
            });

            NuclioHeaderService.updateMainHeader('common:PROJECTS', ctrl.title, $state.current.name);
        }

        /**
         * Toggles function row
         * @param {MouseEvent} event
         */
        function toggleFunctionRow(event) {
            if (angular.isDefined(event) && event.target.closest('.function-row-collapse')) {
                event.stopPropagation();

                if (event.target.closest('.collapse-icon')) {
                    ctrl.isFunctionCollapsed = !ctrl.isFunctionCollapsed;
                }
            }
        }

        /**
         * Toggles function 'disabled' property and updates it on back-end
         * @param {MouseEvent} event
         */
        function toggleFunctionState(event) {
            event.preventDefault();
            event.stopPropagation();

            if (ctrl.function.spec.disable) {
                enableFunction();
            } else {
                disableFunction();
            }
        }

        //
        // Private methods
        //

        /**
         * Converts function status state.
         */
        function convertStatusState() {
            var status = lodash.chain(ctrl.function.status.state).lowerCase().upperFirst().value();

            ctrl.convertedStatusState = status === 'Error'                                ? 'Error'          :
                                        status === 'Scaled to zero'                       ? 'Scaled to zero' :
                                        status === 'Ready' && ctrl.function.spec.disable  ? 'Standby'        :
                                        status === 'Ready' && !ctrl.function.spec.disable ? 'Running'        :
                                        /* else */                                          'Building';
        }

        /**
         * Deletes function from functions list
         * @returns {Promise}
         */
        function deleteFunction() {
            ctrl.isSplashShowed.value = true;

            return ctrl.handleDeleteFunction({functionData: ctrl.function.metadata})
                .then(function () {
                    lodash.remove(ctrl.functionsList, ['metadata.name', ctrl.function.metadata.name]);
                })
                .catch(function (error) {
                    ctrl.isSplashShowed.value = false;
                    var defaultMsg = $i18next.t('functions:ERROR_MSG.DELETE_FUNCTION', {lng: lng});

                    return DialogsService.alert(lodash.get(error, 'data.error', defaultMsg));
                });
        }

        /**
         * Disables function.
         * Sends request to change `spec.disable` property
         */
        function disableFunction() {

            // in case failed request, modified function object will be restored from that copy
            tempFunctionCopy = lodash.cloneDeep(ctrl.function);

            var propertiesToDisableFunction = {
                spec: {
                    disable: true,
                    build: {
                        mode: 'neverBuild'
                    }
                }
            };

            lodash.merge(ctrl.function, propertiesToDisableFunction);

            updateFunction('Disabling…');
        }

        function duplicateFunction() {
            ngDialog.open({
                template: '<ncl-duplicate-function-dialog data-close-dialog="closeThisDialog()" ' +
                    'data-get-functions="ngDialogData.getFunctions({id: id})" ' +
                    'data-project="ngDialogData.project" data-version="ngDialogData.version">' +
                    '</ncl-duplicate-function-dialog>',
                plain: true,
                data: {
                    getFunctions: ctrl.getFunctions,
                    project: ctrl.project,
                    version: ctrl.function
                },
                className: 'ngdialog-theme-iguazio duplicate-function-dialog-wrapper'
            });
        }

        /**
         * Enables function.
         * Sends request to change `spec.disable` property
         */
        function enableFunction() {

            // in case failed request, modified function object will be restored from that copy
            tempFunctionCopy = lodash.cloneDeep(ctrl.function);

            var propertiesToEnableFunction = {
                spec: {
                    disable: false,
                    build: {
                        mode: 'neverBuild'
                    }
                }
            };

            lodash.merge(ctrl.function, propertiesToEnableFunction);

            updateFunction('Enabling…');
        }

        /**
         * Exports the function
         */
        function exportFunction() {
            ExportService.exportFunction(ctrl.function);
        }

        /**
         * Initializes function actions
         * @returns {Object[]} - list of actions
         */
        function initFunctionActions() {
            ctrl.functionActions = angular.copy(FunctionsService.initFunctionActions());

            var deleteAction = lodash.find(ctrl.functionActions, {'id': 'delete'});

            if (!lodash.isNil(deleteAction)) {
                deleteAction.confirm.message = $i18next.t('functions:DELETE_FUNCTION', {lng: lng}) + ' “' + ctrl.function.metadata.name + '”?';
            }
        }

        /**
         * Expands current function row
         * @param {Event} event - broadcast event
         * @param {Object} data - broadcast data
         */
        function onExpandAllRows(event, data) {
            if (data.rowsType === 'functions' && (angular.isUndefined(data.onlyForProject) ||
                data.onlyForProject.metadata.name === ctrl.project.metadata.name)) {
                $timeout(function () {
                    ctrl.isFunctionCollapsed = false;
                });
            }
        }

        /**
         * Collapses current function row
         * @param {Event} event - broadcast event
         * @param {Object} data - broadcast data
         */
        function onCollapseAllRows(event, data) {
            if (data.rowsType === 'functions' && (angular.isUndefined(data.onlyForProject) ||
                data.onlyForProject.metadata.name === ctrl.project.metadata.name)) {
                $timeout(function () {
                    ctrl.isFunctionCollapsed = true;
                });
            }
        }

        /**
         * Pulls function status.
         * Periodically sends request to get function's state, until state will not be 'ready' or 'error'.
         * @param {string} [status='Building'] - The text to display in "Status" cell of the function while polling.
         */
        function pullFunctionState(status) {
            ctrl.convertedStatusState = lodash.defaultTo(status, 'Building');
            setStatusIcon();

            interval = $interval(function () {
                ctrl.getFunction({ metadata: ctrl.function.metadata, projectID: ctrl.project.metadata.name })
                    .then(function (response) {
                        if (response.status.state === 'ready' || response.status.state === 'error') {
                            terminateInterval();
                            convertStatusState();
                            setStatusIcon();
                        }
                    })
                    .catch(function (error) {
                        var defaultMsg = $i18next.t('functions:ERROR_MSG.GET_FUNCTION', {lng: lng});

                        terminateInterval();
                        convertStatusState();
                        setStatusIcon();

                        return DialogsService.alert(lodash.get(error, 'data.error', defaultMsg));
                    });
            }, 2000);
        }

        /**
         * Returns appropriate css icon class for functions status.
         * @returns {string} - icon class
         */
        function setStatusIcon() {
            ctrl.statusIcon = ctrl.convertedStatusState === 'Running' ? 'igz-icon-pause' :
                              ctrl.convertedStatusState === 'Standby' ? 'igz-icon-play'  :
                              /* else */                                '';
        }

        /**
         * Terminates the interval of function state polling.
         */
        function terminateInterval() {
            if (!lodash.isNil(interval)) {
                $interval.cancel(interval);
                interval = null;
            }
        }

        /**
         * Sends request to update function state
         * @param {string} [status='Building'] - The text to display in "Status" cell of the function while polling.
         */
        function updateFunction(status) {
            ctrl.isSplashShowed.value = true;

            var pathsToExcludeOnDeploy = ['status', 'ui', 'versions'];
            var functionCopy = lodash.omit(ctrl.function, pathsToExcludeOnDeploy);

            // set `nuclio.io/project-name` label to relate this function to its project
            lodash.set(functionCopy, ['metadata', 'labels', 'nuclio.io/project-name'], ctrl.project.metadata.name);

            ctrl.updateFunction({'function': functionCopy, projectID: ctrl.project.metadata.name})
                .then(function () {
                    tempFunctionCopy = null;

                    pullFunctionState(status);
                })
                .catch(function (error) {
                    ctrl.function = tempFunctionCopy;

                    var defaultMsg = $i18next.t('functions:ERROR_MSG.UPDATE_FUNCTION', {lng: lng});

                    return DialogsService.alert(lodash.get(error, 'data.error', defaultMsg));
                })
                .finally(function () {
                    ctrl.isSplashShowed.value = false;
                })
        }

        /**
         * Show dialog with YAML function config
         */
        function viewConfig() {
            ngDialog.open({
                template: '<ncl-function-config-dialog data-close-dialog="closeThisDialog()" ' +
                          '                            data-function="ngDialogData.function">' +
                          '</ncl-function-config-dialog>',
                plain: true,
                data: {
                    function: ctrl.function
                },
                className: 'ngdialog-theme-iguazio view-yaml-dialog-wrapper'
            });
        }
    }
}());
