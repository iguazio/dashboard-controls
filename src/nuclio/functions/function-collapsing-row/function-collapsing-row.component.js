/*eslint max-statements: ["error", 52]*/
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
                isSplashShowed: '<',
                project: '<',
                refreshFunctionsList: '&',
                updateFunction: '&'
            },
            templateUrl: 'nuclio/functions/function-collapsing-row/function-collapsing-row.tpl.html',
            controller: NclFunctionCollapsingRowController
        });

    function NclFunctionCollapsingRowController($interval, $state, $i18next, i18next, lodash, ngDialog,
                                                ActionCheckboxAllService, ConfigService, DialogsService,
                                                ExportService, FunctionsService, TableSizeService) {
        var ctrl = this;

        var FUNCTION_STATE_POLLING_DELAY = 2000;

        var apiGateways = [];
        var tempFunctionCopy = null;
        var interval = null;
        var lng = i18next.language;
        var steadyStates = FunctionsService.getSteadyStates();

        ctrl.functionActions = [];
        ctrl.functionNameTooltip = '';
        ctrl.isFunctionCollapsed = true;
        ctrl.runtimes = {
            'golang': 'Go',
            'python:2.7': 'Python 2.7',
            'python:3.6': 'Python 3.6',
            'python:3.7': 'Python 3.7',
            'python:3.8': 'Python 3.8',
            'python:3.9': 'Python 3.9',
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
        ctrl.statusStateClasses = {
            'Error': 'error-status',
            'Unhealthy': 'unhealthy-status',
            'Scaled to zero': 'scaled-to-zero-status',
            'Standby': 'standby-status',
            'Running': 'running-status',
            'Imported': 'imported-status',
            'Building': 'building-status'
        };
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

        ctrl.functionsService = FunctionsService;
        ctrl.getFunctionsTableColSize = TableSizeService.getFunctionsTableColSize;
        ctrl.isDemoMode = ConfigService.isDemoMode;
        ctrl.lodash = lodash;

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

            apiGateways = lodash.get(ctrl.function, 'status.apiGateways', []);

            initFunctionActions();
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
                convertStatusState();
                setStatusIcon();
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
            return ctrl.function.spec.disable ? $i18next.t('functions:TOOLTIP.RUN_FUNCTION', { lng: lng }) :
                $i18next.t('functions:TOOLTIP.STOP_FUNCTION', { lng: lng });
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
            if (
                lodash.isNil(event.target.closest('.igz-action-item')) &&
                lodash.isNil(event.target.closest('.actions-more-info'))
            ) {
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
            }
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

            if (!ctrl.function.spec.disable && !lodash.isEmpty(apiGateways)) {
                DialogsService.alert($i18next.t('functions:ERROR_MSG.DISABLE_API_GW_FUNCTION',
                                                { lng: lng, apiGatewayName: apiGateways[0] }));
            } else if (!ctrl.function.spec.disable) {
                disableFunction();
            } else {
                enableFunction();
            }
        }

        //
        // Private methods
        //

        /**
         * Converts function status state.
         */
        function convertStatusState() {
            ctrl.convertedStatusState = FunctionsService.getDisplayStatus(ctrl.function);
            lodash.set(ctrl.function, 'ui.convertedStatus', ctrl.convertedStatusState); // used for sorting by status
        }

        /**
         * Deletes function from functions list
         * @param {Object} [functionItem]
         * @returns {Promise}
         */
        function deleteFunction(functionItem) {
            if (lodash.isEmpty(apiGateways)) {
                ctrl.isSplashShowed.value = true;

                return ctrl.handleDeleteFunction({
                    functionData: lodash.defaultTo(functionItem, ctrl.function).metadata
                })
                    .then(function () {
                        lodash.remove(ctrl.functionsList, ['metadata.name', ctrl.function.metadata.name]);
                    })
                    .catch(function (error) {
                        var defaultMsg = $i18next.t('functions:ERROR_MSG.DELETE_FUNCTION', { lng: lng });

                        if (error.status === 409) {
                            FunctionsService.openVersionDeleteDialog()
                                .then(function () {
                                    deleteFunction(lodash.omit(ctrl.function, ['metadata.resourceVersion']));
                                });
                        } else {
                            DialogsService.alert(lodash.get(error, 'data.error', defaultMsg));
                        }
                    })
                    .finally(function () {
                        ctrl.isSplashShowed.value = false;
                    });
            } else {
                DialogsService.alert($i18next.t('functions:ERROR_MSG.DELETE_API_GW_FUNCTION', {
                    lng: lng,
                    apiGatewayName: apiGateways[0]
                }));
            }
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

            updateFunction($i18next.t('common:DISABLING', { lng: lng }) + '…');
        }

        function duplicateFunction() {
            ngDialog.open({
                template: '<ncl-duplicate-function-dialog data-close-dialog="closeThisDialog()" ' +
                    'data-get-function="ngDialogData.getFunction({metadata: metadata})" ' +
                    'data-project="ngDialogData.project" data-version="ngDialogData.version">' +
                    '</ncl-duplicate-function-dialog>',
                plain: true,
                data: {
                    getFunctions: ctrl.getFunctions,
                    getFunction: ctrl.getFunction,
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

            updateFunction($i18next.t('common:ENABLING', { lng: lng }) + '…');
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

            var deleteAction = lodash.find(ctrl.functionActions, { id: 'delete' });

            if (!lodash.isNil(deleteAction) && lodash.isEmpty(apiGateways)) {
                deleteAction.confirm = {
                    message: $i18next.t('functions:DELETE_FUNCTION', { lng: lng }) + ' “' +
                        ctrl.function.metadata.name + '”?',
                    description: $i18next.t('functions:DELETE_FUNCTION_DESCRIPTION', { lng: lng }),
                    yesLabel: $i18next.t('common:YES_DELETE', { lng: lng }),
                    noLabel: $i18next.t('common:CANCEL', { lng: lng }),
                    type: 'nuclio_alert'
                }
            }
        }

        /**
         * Pulls function status.
         * Periodically sends request to get function's state, until state will not be 'ready' or 'error'.
         * @param {string} [status='Building'] - The text to display in "Status" cell of the function while polling.
         */
        function pullFunctionState(status) {
            ctrl.convertedStatusState = lodash.defaultTo(status, $i18next.t('common:BUILDING', { lng: lng }));
            setStatusIcon();

            interval = $interval(function () {
                ctrl.getFunction({ metadata: ctrl.function.metadata, projectId: ctrl.project.metadata.name })
                    .then(function (aFunction) {
                        if (lodash.includes(steadyStates, lodash.get(aFunction, 'status.state'))) {
                            terminateInterval();
                            convertStatusState();
                            setStatusIcon();

                            if (FunctionsService.isKubePlatform()) {
                                var newResourceVersion = lodash.get(aFunction, 'metadata.resourceVersion');
                                lodash.set(ctrl.function, 'metadata.resourceVersion', newResourceVersion);
                            }
                        }
                    })
                    .catch(function (error) {
                        var defaultMsg = $i18next.t('functions:ERROR_MSG.GET_FUNCTION', { lng: lng });

                        terminateInterval();
                        convertStatusState();
                        setStatusIcon();

                        return DialogsService.alert(lodash.get(error, 'data.error', defaultMsg));
                    });
            }, FUNCTION_STATE_POLLING_DELAY);
        }

        /**
         * Returns appropriate css icon class for functions status.
         * @returns {string} - icon class
         */
        function setStatusIcon() {
            ctrl.statusIcon =
                ctrl.convertedStatusState === $i18next.t('common:RUNNING', { lng: lng }) ? 'igz-icon-pause' :
                ctrl.convertedStatusState === $i18next.t('common:STANDBY', { lng: lng }) ? 'igz-icon-play'  :
                /* else */                                                                 '';
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

            ctrl.updateFunction({ 'function': functionCopy, projectId: ctrl.project.metadata.name })
                .then(function () {
                    tempFunctionCopy = null;

                    pullFunctionState(status);
                })
                .catch(function (error) {
                    ctrl.function = tempFunctionCopy;

                    var defaultMsg = $i18next.t('functions:ERROR_MSG.UPDATE_FUNCTION', { lng: lng });

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
