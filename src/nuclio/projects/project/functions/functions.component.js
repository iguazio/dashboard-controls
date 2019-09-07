/* eslint max-statements: ["error", 60] */
(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclFunctions', {
            bindings: {
                deleteFunction: '&',
                createFunction: '&',
                getExternalIpAddresses: '&',
                getProject: '&',
                getFunction: '&',
                getFunctions: '&',
                getStatistics: '&',
                onUpdateFunction: '&'
            },
            templateUrl: 'nuclio/projects/project/functions/functions.tpl.html',
            controller: FunctionsController
        });

    function FunctionsController($filter, $interval, $q, $rootScope, $scope, $state, $stateParams, $transitions, $timeout,
                                 $i18next, i18next, lodash, CommonTableService, ConfigService, DialogsService,
                                 ElementLoadingStatusService, NuclioHeaderService) {
        var ctrl = this;
        var lng = i18next.language;
        var title = {}; // breadcrumbs config

        var METRICS = {
            FUNCTION_CPU: 'nuclio_function_cpu',
            FUNCTION_MEMORY: 'nuclio_function_mem',
            FUNCTION_EVENTS: 'nuclio_processor_handled_events_total',
            MAX_CPU_VALUE: 200
        };

        var updatingInterval = null;
        var updatingIntervalTime = 30000;

        ctrl.actions = [];
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
        ctrl.project = {};
        ctrl.searchStates = {};
        ctrl.searchKeys = [
            'metadata.name',
            'spec.description'
        ];
        ctrl.sortOptions = [
            {
                label: $i18next.t('common:NAME', {lng: lng}),
                value: 'metadata.name',
                active: true
            },
            {
                label: $i18next.t('common:DESCRIPTION', {lng: lng}),
                value: 'spec.description',
                active: false
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
        ctrl.sortedColumnName = 'metadata.name';
        ctrl.externalIPAddress = '';

        ctrl.$onInit = onInit;
        ctrl.$onDestroy = onDestroy;

        ctrl.getColumnSortingClasses = CommonTableService.getColumnSortingClasses;

        ctrl.getVersions = getVersions;
        ctrl.handleAction = handleAction;
        ctrl.isDemoMode = ConfigService.isDemoMode;
        ctrl.isFunctionsListEmpty = isFunctionsListEmpty;
        ctrl.onApplyFilters = onApplyFilters;
        ctrl.onSortOptionsChange = onSortOptionsChange;
        ctrl.onResetFilters = onResetFilters;
        ctrl.onUpdateFiltersCounter = onUpdateFiltersCounter;
        ctrl.openNewFunctionScreen = openNewFunctionScreen;
        ctrl.refreshFunctions = refreshFunctions;
        ctrl.sortTableByColumn = sortTableByColumn;
        ctrl.toggleFilters = toggleFilters;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            if (lodash.isEmpty($stateParams.projectId)) {
                $state.go('app.projects');
            } else {
                ctrl.isSplashShowed.value = true;

                ctrl.getProject({id: $stateParams.projectId})
                    .then(function (project) {
                        ctrl.project = project;

                        title.project = ctrl.project;

                        NuclioHeaderService.updateMainHeader('common:PROJECTS', title, $state.current.name);

                        ctrl.getExternalIpAddresses()
                            .then(function (response) {
                                ctrl.externalIPAddress = lodash.get(response, 'externalIPAddresses.addresses[0]', '');
                            })
                            .catch(function () {
                                ctrl.externalIPAddress = '';
                            })
                            .finally(function () {

                                // it is important to render function list only after external IP addresses response is
                                // back, otherwise the "Invocation URL" column might be "N/A" to a function (even if it
                                // is deployed, i.e. `status.httpPort` is a number), because as long as the external IP
                                // address response is not returned, it is empty and is passed to each function row
                                ctrl.refreshFunctions()
                                    .then(startAutoUpdate);
                            });
                    })
                    .catch(function (error) {
                        ctrl.isSplashShowed.value = false;
                        var defaultMsg = $i18next.t('functions:ERROR_MSG.GET_PROJECT', {lng: lng});

                        DialogsService.alert(lodash.get(error, 'data.error', defaultMsg)).then(function () {
                            $state.go('app.projects');
                        });
                    });
            }

            ctrl.actions = initVersionActions();

            $scope.$on('action-panel_fire-action', onFireAction);
            $scope.$on('action-checkbox_item-checked', updatePanelActions);
            $scope.$on('action-checkbox-all_check-all', function () {
                $timeout(updatePanelActions);
            });

            $transitions.onStart({}, stateChangeStart);

            updatePanelActions();
        }

        /**
         * Destroying method
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
         * Checks if functions list is empty
         * @returns {boolean}
         */
        function isFunctionsListEmpty() {
            return lodash.isEmpty(ctrl.functions);
        }

        /**
         * According to given action name calls proper action handler
         * @param {string} actionType - ex. `delete`
         * @param {Array} checkedItems - an array of checked projects
         * @returns {Promise}
         */
        function handleAction(actionType, checkedItems) {
            var promises = [];

            lodash.forEach(checkedItems, function (checkedItem) {
                var actionHandler = checkedItem.ui[actionType];

                if (lodash.isFunction(actionHandler)) {
                    promises.push(actionHandler());
                }
            });

            return $q.all(promises).then(function () {
                ctrl.isSplashShowed.value = false;
            });
        }

        /**
         * Updates functions list depends on filters value
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
         * Navigates to new function screen
         */
        function openNewFunctionScreen() {
            title.function = 'Create function';

            NuclioHeaderService.updateMainHeader('common:PROJECTS', title, $state.current.name);

            $state.go('app.project.create-function');
        }

        /**
         * Refreshes function list
         */
        function refreshFunctions() {
            ctrl.isSplashShowed.value = true;

            return ctrl.getFunctions({id: ctrl.project.metadata.name})
                .then(function (functions) {
                    ctrl.functions = lodash.map(functions, function (functionFromResponse) {
                        var foundFunction = lodash.find(ctrl.functions, ['metadata.name', functionFromResponse.metadata.name]);
                        var ui = lodash.get(foundFunction, 'ui');
                        functionFromResponse.ui = lodash.defaultTo(ui, functionFromResponse.ui);

                        return functionFromResponse;
                    });

                    if (lodash.isEmpty(ctrl.functions) && !$stateParams.createCancelled) {
                        ctrl.isSplashShowed.value = false;

                        $state.go('app.project.create-function');
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
                })
                .then(updateStatistics)
                .catch(function (error) {
                    var defaultMsg = $i18next.t('functions:ERROR_MSG.GET_FUNCTIONS', {lng: lng});

                    DialogsService.alert(lodash.get(error, 'data.error', defaultMsg));
                })
                .finally(function () {
                    ctrl.isSplashShowed.value = false;
                });
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

            ctrl.functions = $filter('orderBy')(ctrl.functions, columnName, ctrl.isReverseSorting);
        }

        /**
         * Opens a splash screen on start change state
         */
        function stateChangeStart() {
            ctrl.isSplashShowed.value = true;
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
         * Actions for Action panel
         * @returns {Object[]} - array of actions
         */
        function initVersionActions() {
            var actions = [
                {
                    label: $i18next.t('common:EDIT', {lng: lng}),
                    id: 'edit',
                    icon: 'igz-icon-edit',
                    active: true
                },
                {
                    label: $i18next.t('common:DELETE', {lng: lng}),
                    id: 'delete',
                    icon: 'igz-icon-trash',
                    active: true,
                    confirm: {
                        message: $i18next.t('functions:DELETE_VERSION_CONFIRM', {lng: lng}),
                        yesLabel: $i18next.t('common:YES_DELETE', {lng: lng}),
                        noLabel: $i18next.t('common:CANCEL', {lng: lng}),
                        type: 'critical_alert'
                    }
                }
            ];

            return actions;
        }

        /**
         * Handler on action-panel broadcast
         * @param {Event} event - $broadcast-ed event
         * @param {Object} data - $broadcast-ed data
         * @param {string} data.action - a name of action
         */
        function onFireAction(event, data) {
            var checkedRows = lodash.chain(ctrl.functions)
                .map(function (functionItem) {
                    return lodash.filter(functionItem.versions, 'ui.checked');
                })
                .flatten()
                .value();

            ctrl.handleAction(data.action, checkedRows);
        }

        /**
         * Starts auto-update statistics.
         */
        function startAutoUpdate() {
            if (lodash.isNull(updatingInterval)) {
                updatingInterval = $interval(updateStatistics, updatingIntervalTime)
            }
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
         * Updates actions of action panel according to selected versions
         */
        function updatePanelActions() {
            var checkedRows = lodash.chain(ctrl.functions)
                .map(function (functionItem) {
                    return lodash.filter(functionItem.versions, 'ui.checked');
                })
                .flatten()
                .value();

            if (checkedRows.length > 0) {

                // sets visibility status of `edit action`
                // visible if only one version is checked
                var editAction = lodash.find(ctrl.actions, {'id': 'edit'});
                if (!lodash.isNil(editAction)) {
                    editAction.visible = checkedRows.length === 1;
                }

                // sets confirm message for `delete action` depending on count of checked rows
                var deleteAction = lodash.find(ctrl.actions, {'id': 'delete'});
                if (!lodash.isNil(deleteAction)) {
                    var message = checkedRows.length === 1 ?
                        $i18next.t('functions:DELETE_VERSION', {lng: lng}) + ' “' + checkedRows[0].name + '”?' :
                        $i18next.t('functions:DELETE_VERSION_CONFIRM', {lng: lng});

                    deleteAction.confirm = {
                        message: message,
                        yesLabel: $i18next.t('common:YES_DELETE', {lng: lng}),
                        noLabel: $i18next.t('common:CANCEL', {lng: lng}),
                        type: 'nuclio_alert'
                    };
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
                    var funcStats = lodash.find(results, function (result) {
                        var functionName = lodash.get(aFunction, 'metadata.name');
                        var metric = lodash.get(result, 'metric', {});
                        var resultName = lodash.defaultTo(metric.function, metric.function_name);
                        return resultName === functionName;
                    });

                    if (lodash.isObject(funcStats)) {
                        if (type === METRICS.FUNCTION_CPU) {
                            lodash.merge(aFunction.ui, {
                                metrics: {
                                    'cpu.idle': 100 - getCpuValue(lodash.last(funcStats.values)[1]),
                                    cpuLineChartData: lodash.map(funcStats.values, function (dataPoint) {
                                        return [dataPoint[0] * 1000, getCpuValue(dataPoint[1])]; // [time, value]
                                    })
                                }
                            })
                        } else if (type === METRICS.FUNCTION_MEMORY) {
                            lodash.merge(aFunction.ui, {
                                metrics: {
                                    size: Number(lodash.last(funcStats.values)[1]),
                                    sizeLineChartData: lodash.map(funcStats.values, function (dataPoint) {
                                        return [dataPoint[0] * 1000, Number(dataPoint[1])]; // [time, value]
                                    })
                                }
                            })
                        } else { // type === METRICS.FUNCTION_COUNT
                            lodash.merge(aFunction.ui, {
                                metrics: {
                                    count: Number(lodash.last(funcStats.values)[1]),
                                    countLineChartData: lodash.map(funcStats.values, function (dataPoint) {
                                        return [dataPoint[0] * 1000, Number(dataPoint[1])]; // [time, value]
                                    })
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
