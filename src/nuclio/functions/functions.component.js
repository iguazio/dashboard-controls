/* eslint max-statements: ["error", 100] */
/* eslint max-params: ["error", 25] */
/* eslint complexity: ["error", 15] */
(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclFunctions', {
            bindings: {
                createFunction: '&',
                createFunctionWhenEmpty: '<?',
                deleteFunction: '&',
                getFunction: '&',
                getFunctions: '&',
                getStatistics: '&',
                project: '<',
                updateFunction: '&'
            },
            templateUrl: 'nuclio/functions/functions.tpl.html',
            controller: FunctionsController
        });

    function FunctionsController($filter, $interval, $q, $rootScope, $scope, $state, $stateParams, $timeout,
                                 $transitions, $i18next, i18next, lodash, CommonTableService, ConfigService,
                                 DialogsService, ElementLoadingStatusService, FunctionsService, NuclioHeaderService,
                                 TableSizeService) {
        var ctrl = this;
        var lng = i18next.language;
        var updatingFunctionsInterval = null;
        var updatingStatisticsInterval = null;
        var UPDATING_FUNCTIONS_INTERVAL_TIME = 30000;
        var UPDATING_STATISTICS_INTERVAL_TIME = 30000;

        var METRICS = {
            FUNCTION_CPU: 'nuclio_function_cpu',
            FUNCTION_MEMORY: 'nuclio_function_mem',
            FUNCTION_EVENTS: 'nuclio_processor_handled_events_total'
        };

        ctrl.filtersCounter = 0;
        ctrl.functions = [];
        ctrl.originalSortedFunctions = [];
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
        ctrl.page = {};
        ctrl.project = {};
        ctrl.searchKeys = [
            'metadata.name',
            'spec.description'
        ];
        ctrl.searchStates = {};
        ctrl.sortOptions = [
            {
                label: $i18next.t('common:NAME', { lng: lng }),
                value: 'metadata.name',
                active: true
            },
            {
                label: $i18next.t('common:STATUS', { lng: lng }),
                value: 'ui.convertedStatus',
                active: false
            },
            {
                label: $i18next.t('common:REPLICAS', { lng: lng }),
                value: 'spec.replicas',
                active: false,
                visible: ConfigService.isDemoMode()
            },
            {
                label: $i18next.t('functions:RUNTIME', { lng: lng }),
                value: 'spec.runtime',
                active: false
            },
            {
                label: $i18next.t('functions:INVOCATION_PER_SEC', { lng: lng }),
                value: 'ui.metrics.invocationPerSec',
                active: false
            },
            {
                label: $i18next.t('common:CPU_CORES', { lng: lng }),
                value: 'ui.metrics[\'cpu.cores\']',
                active: false
            },
            {
                label: $i18next.t('common:MEMORY', { lng: lng }),
                value: 'ui.metrics.size',
                active: false
            },
            {
                label: $i18next.t('functions:INVOCATION', { lng: lng }) + ' #',
                value: 'ui.metrics.count',
                active: false
            },
            {
                label: $i18next.t('common:OWNER', { lng: lng }),
                value: 'metadata.labels[\'iguazio.com/username\']',
                active: false
            }
        ];
        ctrl.sortedColumnName = 'metadata.name';
        ctrl.versionActions = [];
        ctrl.visibleFunctions = [];

        ctrl.$onInit = onInit;
        ctrl.$onDestroy = onDestroy;

        ctrl.getVersions = getVersions;
        ctrl.handleFunctionVersionAction = handleFunctionVersionAction;
        ctrl.isFunctionsListEmpty = isFunctionsListEmpty;
        ctrl.onApplyFilters = onApplyFilters;
        ctrl.onResetFilters = onResetFilters;
        ctrl.onSortOptionsChange = onSortOptionsChange;
        ctrl.onUpdateFiltersCounter = onUpdateFiltersCounter;
        ctrl.openNewFunctionScreen = openNewFunctionScreen;
        ctrl.paginationCallback = paginationCallback;
        ctrl.refreshFunctions = refreshFunctions;
        ctrl.sortTableByColumn = sortTableByColumn;
        ctrl.toggleFilters = toggleFilters;

        ctrl.functionsService = FunctionsService;
        ctrl.getColumnSortingClasses = CommonTableService.getColumnSortingClasses;
        ctrl.getFunctionsTableColSize = TableSizeService.getFunctionsTableColSize;
        ctrl.isDemoMode = ConfigService.isDemoMode;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.isSplashShowed.value = true;

            lodash.defaults(ctrl, { createFunctionWhenEmpty: true });

            initFunctions();
            initPagination();

            // initializes function actions array
            ctrl.functionActions = angular.copy(FunctionsService.initFunctionActions());

            // initializes version actions array
            ctrl.versionActions = angular.copy(FunctionsService.initVersionActions());

            $scope.$on('action-checkbox-all_check-all', onCheckAll);
            $scope.$on('action-checkbox-all_checked-items-count-change', onItemsCountChange);
            $scope.$on('action-checkbox_item-checked', onItemChecked);
            $scope.$on('action-panel_fire-action', onFireAction);

            $transitions.onStart({}, stateChangeStart);
            $transitions.onError({}, stateChangeError);

            updatePanelActions();

            $timeout(function () {
                // update breadcrumbs
                var title = {
                    project: ctrl.project,
                    tab: $i18next.t('common:FUNCTIONS', { lng: lng })
                };

                NuclioHeaderService.updateMainHeader('common:PROJECTS', title, $state.current.name);
            });
        }

        /**
         * Destructor method
         */
        function onDestroy() {
            stopAutoUpdate();
        }

        //
        // Public methods
        //

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
                    return initFunctions()
                        .then(function () {
                            ctrl.isSplashShowed.value = false;
                        });
                }

            });
        }

        /**
         * Checks if functions list is empty
         * @returns {boolean}
         */
        function isFunctionsListEmpty() {
            return lodash.isEmpty(ctrl.functions);
        }

        /**
         * Updates projects/functions list depends on filters value
         */
        function onApplyFilters() {
            $rootScope.$broadcast('search-input_refresh-search');

            $timeout(paginateFunctions);
        }

        /**
         * Handles on reset filters event
         */
        function onResetFilters() {
            $rootScope.$broadcast('search-input_reset');

            ctrl.filtersCounter = 0;
            $timeout(paginateFunctions);
        }

        /**
         * Sorts the table by column name depends on selected option.
         * @param {Object} option - The selected option.
         */
        function onSortOptionsChange(option) {
            ctrl.isReverseSorting = option.desc;
            ctrl.sortedColumnName = option.value;

            sortTable();
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
            $state.go('app.project.create-function');
        }

        /**
         * Change pagination page and size callback
         * @param {number} page - page number
         * @param {number} size - pagination size number
         */
        function paginationCallback(page, size) {
            ctrl.page.number = page;
            ctrl.page.size = size;
            paginateFunctions();
        }

        /**
         * Refreshes function list
         * @returns {Promise}
         */
        function refreshFunctions(autoRefresh) {
            ctrl.isSplashShowed.value = !autoRefresh;

            return ctrl.getFunctions({ id: ctrl.project.metadata.name, enrichApiGateways: true })
                .then(function (functions) {
                    var prevFunctionsCopy = angular.copy(ctrl.functions);
                    ctrl.functions = lodash.map(functions, function (functionFromResponse) {
                        var foundFunction =
                            lodash.find(ctrl.functions, ['metadata.name', functionFromResponse.metadata.name]);
                        var ui = lodash.get(foundFunction, 'ui');
                        functionFromResponse.ui = lodash.defaultTo(ui, functionFromResponse.ui || {});

                        return functionFromResponse;
                    });

                    if (
                        ctrl.createFunctionWhenEmpty &&
                        lodash.isEmpty(ctrl.functions) &&
                        !$stateParams.createCancelled
                    ) {
                        ctrl.isSplashShowed.value = false;
                        openNewFunctionScreen();
                    } else {
                        // TODO: unmock versions data

                        lodash.forEach(ctrl.functions, function (functionItem) {
                            var mockVersions = {
                                name: '$LATEST',
                                invocation: '30'
                            };
                            const foundFunction =
                                    lodash.find(prevFunctionsCopy, ['metadata.name', functionItem.metadata.name]);

                            if (foundFunction && foundFunction.versions) {
                                functionItem.versions = angular.copy(foundFunction.versions);
                            } else {
                                lodash.set(functionItem, 'versions', [mockVersions]);
                            }

                            lodash.set(functionItem, 'spec.version', 1);
                        });
                    }

                    if (!autoRefresh) {
                        updateStatistics();
                    }

                    sortTable(true);
                })
                .catch(function (error) {
                    var defaultMsg = $i18next.t('functions:ERROR_MSG.GET_FUNCTIONS', { lng: lng });

                    return DialogsService.alert(lodash.get(error, 'data.error', defaultMsg));
                })
                .finally(function () {
                    ctrl.isSplashShowed.value = false;
                });
        }

        /**
         * Sorts the table by column.
         * @param {string} columnName - The name of the column to sort by.
         */
        function sortTableByColumn(columnName) {
            // set the sorting order (ascending if selected a different column, or toggle if selected the same column)
            ctrl.isReverseSorting = columnName === ctrl.sortedColumnName ? !ctrl.isReverseSorting : false;

            // save the name of the column to sort by
            ctrl.sortedColumnName = columnName;

            sortTable();
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
         * Hides charts spinners
         */
        function hideSpinners(type) {
            ElementLoadingStatusService.hideSpinnerGroup(lodash.map(ctrl.functions, function (aFunction) {
                return type + '-' + lodash.get(aFunction, 'metadata.name');
            }));
        }

        /**
         * Initializes functions list
         */
        function initFunctions() {
            return ctrl.refreshFunctions()
                .then(function () {
                    startAutoUpdate();
                })
                .catch(function (error) {
                    ctrl.isSplashShowed.value = false;
                    var defaultMessage = $i18next.t('functions:ERROR_MSG.GET_FUNCTIONS', { lng: lng });
                    var errorMessage = lodash.get(error, 'data.error', defaultMessage);

                    return DialogsService.alert(errorMessage).then(function () {
                        $state.go('app.projects');
                    });
                })
                .finally(function () {
                    $timeout(function () {
                        $rootScope.$broadcast('igzWatchWindowResize::resize');
                    });
                });
        }

        /**
         * Init data for pagination
         */
        function initPagination() {
            ctrl.page = {
                number: ctrl.page.number || 0,
                size: 10
            };
        }

        /**
         * Handler on action-panel broadcast
         * @param {Event} event - $broadcast-ed event
         * @param {Object} data - $broadcast-ed data
         */
        function onFireAction(event, data) {
            if (FunctionsService.checkedItem === 'functions' || !ctrl.isDemoMode()) {
                var checkedFunctions = lodash.filter(ctrl.functions, 'ui.checked');

                ctrl.handleFunctionVersionAction(data.action, checkedFunctions);
            } else if (FunctionsService.checkedItem === 'versions') {
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
                FunctionsService.checkedItem = '';
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
                FunctionsService.checkedItem = data.itemType;
            }
        }

        /**
         * Handler on change checked items count
         * @param {Event} event - broadcast event
         * @param {Object} data - broadcast data
         */
        function onItemsCountChange(event, data) {
            if (data.checkedCount === 0) {
                FunctionsService.checkedItem = '';
            }

            updatePanelActions();
        }

        /**
         * Paginates function's list
         * @param {boolean} isRefresh - Checks if function has been called from refreshFunctions.
         */
        function paginateFunctions(isRefresh) {
            let currentFunctions;
            if (ctrl.searchStates.searchInProgress) {
                currentFunctions = lodash.filter(ctrl.originalSortedFunctions, 'ui.isFitQuery');
            } else {
                currentFunctions = ctrl.originalSortedFunctions;
            }

            ctrl.page.total = Math.ceil(lodash.size(currentFunctions) / ctrl.page.size);

            if (ctrl.page.total > 0 && ctrl.page.number >= ctrl.page.total) {
                ctrl.page.number = ctrl.page.total - 1;
            }

            ctrl.visibleFunctions = lodash.slice(currentFunctions,
                                                 (ctrl.page.number * ctrl.page.size),
                                                 (ctrl.page.number * ctrl.page.size) + ctrl.page.size);

            if (!isRefresh) {
                $timeout(function () {
                    hideSpinners(METRICS.FUNCTION_CPU);
                    hideSpinners(METRICS.FUNCTION_MEMORY);
                    hideSpinners(METRICS.FUNCTION_EVENTS);
                });
            }
        }

        /**
         * Sorts table according to the current sort-by column and sorting order (ascending/descending).
         */
        function sortTable(isRefresh) {
            ctrl.originalSortedFunctions =
                lodash.orderBy(ctrl.functions, [ctrl.sortedColumnName], ctrl.isReverseSorting ? ['desc'] : ['asc']);

            paginateFunctions(isRefresh);
        }

        /**
         * Starts auto-update statistics.
         */
        function startAutoUpdate() {
            if (lodash.isNull(updatingFunctionsInterval)) {
                updatingFunctionsInterval = $interval(refreshFunctions.bind(null, true),
                                                      UPDATING_FUNCTIONS_INTERVAL_TIME);
            }

            if (lodash.isNull(updatingStatisticsInterval)) {
                updatingStatisticsInterval = $interval(updateStatistics, UPDATING_STATISTICS_INTERVAL_TIME);
            }
        }

        /**
         * Opens a splash screen on start change state
         */
        function stateChangeStart() {
            ctrl.isSplashShowed.value = true;
        }

        /**
         * Opens a splash screen on error change state
         */
        function stateChangeError() {
            ctrl.isSplashShowed.value = false;
        }

        /**
         * Stops auto-update statistics
         */
        function stopAutoUpdate() {
            if (!lodash.isNull(updatingFunctionsInterval)) {
                $interval.cancel(updatingFunctionsInterval);
                updatingFunctionsInterval = null;
            }

            if (!lodash.isNull(updatingStatisticsInterval)) {
                $interval.cancel(updatingStatisticsInterval);
                updatingStatisticsInterval = null;
            }
        }

        /**
         * Updates actions of action panel according to selected nodes
         */
        function updatePanelActions() {
            if (FunctionsService.checkedItem === 'functions' || !ctrl.isDemoMode()) {
                updatePanelFunctionActions();
            } else if (FunctionsService.checkedItem === 'versions') {
                updatePanelVersionActions();
            }

            /**
             * Updates function actions
             */
            function updatePanelFunctionActions() {
                var checkedRows = lodash.filter(ctrl.functions, 'ui.checked');
                var checkedRowsCount = checkedRows.length;

                if (checkedRowsCount > 0) {

                    // sets visibility status of `duplicate, export, viewConfig` actions
                    // visible if only one function is checked
                    var duplicateAction = lodash.find(ctrl.functionActions, { id: 'duplicate' });
                    var exportAction = lodash.find(ctrl.functionActions, { id: 'export' });
                    var viewConfigAction = lodash.find(ctrl.functionActions, { id: 'viewConfig' });

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
                    var deleteAction = lodash.find(ctrl.functionActions, { id: 'delete' });
                    var isApiGatewayFunction = lodash.some(checkedRows, function (row) {
                        var apiGateways = lodash.get(row, 'status.apiGateways', []);

                        return !lodash.isEmpty(apiGateways);
                    });

                    if (!lodash.isNil(deleteAction) && !isApiGatewayFunction) {
                        var functionName = checkedRows[0].metadata.name;
                        deleteAction.confirm = {
                            message: checkedRowsCount === 1 ?
                                $i18next.t('functions:DELETE_FUNCTION', { lng: lng }) + ' “' + functionName + '”?' :
                                $i18next.t('functions:DELETE_FUNCTIONS_CONFIRM', { lng: lng }),
                            description: checkedRowsCount === 1 ?
                                $i18next.t('functions:DELETE_FUNCTION_DESCRIPTION', { lng: lng }) :
                                null,
                            yesLabel: $i18next.t('common:YES_DELETE', { lng: lng }),
                            noLabel: $i18next.t('common:CANCEL', { lng: lng }),
                            type: 'nuclio_alert'
                        };
                        deleteAction.handler = function (action) {
                            $rootScope.$broadcast('action-panel_fire-action', {
                                action: action.id
                            });
                        }
                    } else if (isApiGatewayFunction) {
                        var message = $i18next.t('functions:ERROR_MSG.DELETE_API_GW_FUNCTIONS', { lng: lng });

                        if (checkedRowsCount === 1) {
                            var apiGatewayName = lodash.get(checkedRows[0], 'status.apiGateways[0]', '');

                            message = $i18next.t('functions:ERROR_MSG.DELETE_API_GW_FUNCTION', {
                                lng: lng,
                                apiGatewayName: apiGatewayName
                            });
                        }

                        deleteAction.confirm = {};
                        deleteAction.handler = function () {
                            DialogsService.alert(message);
                        };
                    }
                }
            }

            /**
             * Updates version actions
             */
            function updatePanelVersionActions() {
                var checkedRows = lodash.chain(ctrl.functions)
                    .map(function (functionItem) {
                        return lodash.filter(functionItem.versions, 'ui.checked');
                    })
                    .flatten()
                    .value();
                var checkedRowsCount = checkedRows.length;

                if (checkedRowsCount > 0) {

                    // sets visibility status of `edit action`
                    // visible if only one version is checked
                    var editAction = lodash.find(ctrl.versionActions, { id: 'edit' });

                    if (!lodash.isNil(editAction)) {
                        editAction.visible = checkedRowsCount === 1;
                    }

                    // sets confirm message for `delete action` depending on count of checked rows
                    var deleteAction = lodash.find(ctrl.versionActions, { id: 'delete' });

                    if (!lodash.isNil(deleteAction)) {
                        deleteAction.confirm.message = checkedRowsCount === 1 ?
                            $i18next.t('functions:DELETE_VERSION', { lng: lng }) + ' “' + checkedRows[0].name + '”?' :
                            $i18next.t('functions:DELETE_VERSIONS_CONFIRM', { lng: lng });
                    }
                }
            }
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
             * Sets error message to the relevant function
             */
            function handleError(type, error) {
                lodash.forEach(ctrl.functions, function (aFunction) {
                    lodash.set(aFunction, 'ui.error.' + type, error.msg);

                    $timeout(function () {
                        $rootScope.$broadcast('element-loading-status_hide-spinner', {
                            name: type + '-' + aFunction.metadata.name
                        });
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
                            });
                        } else if (type === METRICS.FUNCTION_MEMORY) {
                            lodash.merge(aFunction.ui, {
                                metrics: {
                                    size: Number(latestValue),
                                    sizeLineChartData: lodash.map(funcValues, function (dataPoint) {
                                        return [dataPoint[0] * 1000, Number(dataPoint[1])]; // [time, value]
                                    })
                                }
                            });
                        } else { // type === METRICS.FUNCTION_COUNT
                            lodash.merge(aFunction.ui, {
                                metrics: {
                                    count: Number(latestValue),
                                    countLineChartData: lodash.map(funcValues, function (dataPoint) {
                                        return [dataPoint[0] * 1000, Number(dataPoint[1])]; // [time, value]
                                    }),
                                    invocationPerSec:
                                        $filter('scale')(invocationPerSec, Number.isInteger(invocationPerSec) ? 0 : 2)
                                }
                            });
                        }
                    }
                });

                // if the column values have just been updated, and the table is sorted by this column - update sort
                if (type === METRICS.FUNCTION_CPU && ctrl.sortedColumnName === 'ui.metrics[\'cpu.cores\']' ||
                    type === METRICS.FUNCTION_MEMORY && ctrl.sortedColumnName === 'ui.metrics.size' ||
                    type === METRICS.FUNCTION_EVENTS &&
                    lodash.includes(['ui.metrics.invocationPerSec', 'ui.metrics.count'], ctrl.sortedColumnName)) {
                    sortTable();
                }

                $timeout(function () {
                    hideSpinners(type);
                })
            }
        }
    }
}());
