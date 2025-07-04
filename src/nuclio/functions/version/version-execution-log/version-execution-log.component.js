/*
Copyright 2018 Iguazio Systems Ltd.
Licensed under the Apache License, Version 2.0 (the "License") with
an addition restriction as set forth herein. You may not use this
file except in compliance with the License. You may obtain a copy of
the License at http://www.apache.org/licenses/LICENSE-2.0.
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. See the License for the specific language governing
permissions and limitations under the License.
In addition, you may not use the software for any purposes that are
illegal under applicable law, and the grant of the foregoing license
under the Apache 2.0 license is conditioned upon your compliance with
such restriction.
*/
/* eslint max-statements: ["error", 100] */
(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclVersionExecutionLog', {
            bindings: {
                version: '<',
                isFunctionDeploying: '&'
            },
            templateUrl: 'nuclio/functions/version/version-execution-log/version-execution-log.tpl.html',
            controller: NclVersionExecutionLogController
        });

    function NclVersionExecutionLogController(lodash, moment, $interval, i18next, $i18next, $rootScope, ExecutionLogsDataService,
                                              ExportService, LoginService, PaginationService) {
        var ctrl = this;
        var lng = i18next.language;

        var refreshInterval = null;
        var initialDatePreset = '7d';
        var initialReplicas = [];
        var defaultFilter = {
            name: '',
            message: '',
            level: {
                debug: false,
                info: false,
                warn: false,
                error: false
            }
        };
        var projectName = '';

        ctrl.downloadButtonIsDisabled = false;
        ctrl.isSplashShowed = {
            value: false
        };
        ctrl.logs = {};
        ctrl.replicasList = [];
        ctrl.filter = {};
        ctrl.applyIsDisabled = false;
        ctrl.scrollConfig = {
            axis: 'y',
            theme: 'light',
            advanced: {
                updateOnContentResize: true
            }
        };
        ctrl.datePreset = initialDatePreset;
        ctrl.logsAreDownloading = false;
        ctrl.timeRange = {
            from: null,
            to: null,
            sort: 'desc'
        };
        ctrl.searchStates = {};
        ctrl.selectedReplicas = [];
        ctrl.isFiltersShowed = {
            value: false,
            changeValue: function (newVal) {
                this.value = newVal;
            }
        };
        ctrl.filtersCounter = 0;
        ctrl.filterQuery = '';
        ctrl.refreshRate = {
            value: '10',
            options: [
                {
                    name: $i18next.t('common:EVERY', {lng: lng}) + ' 5 ' + $i18next.t('common:SECONDS', {lng: lng}),
                    value: '5'
                },
                {
                    name: $i18next.t('common:EVERY', {lng: lng}) + ' 10 ' + $i18next.t('common:SECONDS', {lng: lng}),
                    value: '10'
                },
                {
                    name: $i18next.t('common:EVERY', {lng: lng}) + ' 20 ' + $i18next.t('common:SECONDS', {lng: lng}),
                    value: '20'
                },
                {
                    name: $i18next.t('common:EVERY', {lng: lng}) + ' 30 ' + $i18next.t('common:SECONDS', {lng: lng}),
                    value: '30'
                },
                {
                    name: $i18next.t('common:EVERY', {lng: lng}) + ' 1 ' + $i18next.t('common:MINUTE', {lng: lng}),
                    value: '60'
                },
                {
                    name: $i18next.t('common:NO_REFRESH', {lng: lng}),
                    value: 'no'
                },
            ]
        };
        ctrl.customDatePresets = {
            '1d': {
                label: $i18next.t('common:LAST', {lng: lng}) + ' 24 ' + $i18next.t('common:HOURS', {lng: lng}),
                getRange: function () {
                    return {
                        from: moment().subtract(24, 'hours')
                    };
                }
            },
            '2d': {
                label: $i18next.t('common:LAST', {lng: lng}) + ' 48 ' + $i18next.t('common:HOURS', {lng: lng}),
                getRange: function () {
                    return {
                        from: moment().subtract(48, 'hours')
                    };
                }
            },
            '7d': {
                label: $i18next.t('common:LAST', {lng: lng}) + ' 7 ' + $i18next.t('common:DAYS', {lng: lng}),
                getRange: function () {
                    return {
                        from: moment().subtract(7, 'days')
                    };
                }
            },
            '30d': {
                label: $i18next.t('common:LAST', {lng: lng}) + ' 30 ' + $i18next.t('common:DAYS', {lng: lng}),
                getRange: function () {
                    return {
                        from: moment().subtract(30, 'days')
                    };
                }
            }
        };
        ctrl.perPageValues = [
            {
                id: 50,
                name: '50'
            },
            {
                id: 100,
                name: '100'
            },
            {
                id: 200,
                name: '200'
            },
            {
                id: 500,
                name: '500'
            }
        ];

        ctrl.$onInit = onInit;
        ctrl.$onDestroy = onDestroy;

        ctrl.applyFilters = applyFilters;
        ctrl.downloadLogFiles = downloadLogFiles;
        ctrl.onCheckboxChange = onCheckboxChange;
        ctrl.onRefreshRateChange = onRefreshRateChange;
        ctrl.onTimeRangeChange = onTimeRangeChange;
        ctrl.onQueryChanged = onQueryChanged;
        ctrl.refreshLogs = refreshLogs;
        ctrl.resetFilters = resetFilters;
        ctrl.searchWithParams = searchWithParams;
        ctrl.toggleFilters = toggleFilters;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            defaultFilter.name = ctrl.version.metadata.name;
            ctrl.filter = lodash.cloneDeep(defaultFilter);

            projectName = lodash.get(ctrl.version, ['metadata', 'labels', 'nuclio.io/project-name']);

            PaginationService.addPagination(ctrl, 'logs', 'ExecutionLogsDataService', onChangePageCallback, true);

            ctrl.timeRange = getInitialTimeRange();

            ctrl.isSplashShowed.value = true;
            ExecutionLogsDataService.getReplicasList(projectName, ctrl.version.metadata.name, {timeFilter: ctrl.timeRange}).then(function (replicas) {
                ctrl.replicasList = replicas.map(function (replica) {
                    return {
                        label: replica,
                        id: replica,
                        value: replica,
                        checked: true
                    }
                });
                ctrl.selectedReplicas = angular.copy(replicas);
                initialReplicas = replicas;

                applyFilters();
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
         * Run search query again
         */
        function applyFilters() {
            stopAutoUpdate();
            calcActiveFilters();
            searchWithParams(0, ctrl.page.size);
        }

        /**
         * Downloads log to the file
         */
        function downloadLogFiles() {
            stopAutoUpdate();

            ctrl.downloadButtonIsDisabled = true;

            return ExecutionLogsDataService.collectLogs(queryParams())
                .then(function (response) {
                    ExportService.exportLogs(response, ctrl.version.metadata.name);
                }).finally(function () {
                    startAutoUpdate();

                    ctrl.downloadButtonIsDisabled = false;
                });
        }

        /**
         * Triggered when search text was changed
         * @param {string} query - Search query
         * @param {string} field - Search field
         */
        function onQueryChanged(query, field) {
            lodash.set(ctrl.filter, field, query);
        }

        /**
         * Triggered when selected replicas list was changed
         */
        function onCheckboxChange() {
            ctrl.applyIsDisabled = !ctrl.selectedReplicas;
        }

        /**
         * Handles Refresh Rate dropdown change
         * @param {Object} item - new item
         * @param {boolean} isItemChanged - was value changed or not
         * @param {string} field - what field was changed
         */
        function onRefreshRateChange(item, isItemChanged, field) {
            if (isItemChanged) {
                lodash.set(ctrl, field, item.value);

                stopAutoUpdate();
                refreshLogs();
            }
        }

        /**
         * Handles Time Range dropdown change
         * @param {{from: number, to: number}} dateTimeRange - the time range selected in date-time range picker
         * @param {string} preset - the selected preset name, if a preset was selected or an empty string
         */
        function onTimeRangeChange(dateTimeRange, preset) {
            ctrl.datePreset = preset;
            ctrl.timeRange = lodash.mapValues(dateTimeRange, function (range) {
                return new Date(range).toISOString();
            });
            ctrl.timeRange.sort = 'desc';
        }

        /**
         * Refreshes logs and generates replicas list
         */
        function refreshLogs() {
            startAutoUpdate();

            ctrl.isSplashShowed.value = true

            ExecutionLogsDataService.getReplicasList(projectName, ctrl.version.metadata.name, {timeFilter: ctrl.timeRange})
                .then(function (replicas) {
                    ctrl.replicasList = replicas.map(function (replica) {
                        return {
                            label: replica,
                            id: replica,
                            value: replica,
                            checked: true
                        }
                    });

                    initialReplicas = replicas;

                    return ExecutionLogsDataService.logsPaginated(ctrl.page.number, ctrl.page.size, queryParams())
                        .then(function (logs) {
                            if (logs.length > 0) {
                                ctrl.logs = lodash.cloneDeep(logs);
                            }
                        });
                })
                .finally(function () {
                    ctrl.isSplashShowed.value = false;
                });
        }

        /**
         * Reset filters
         */
        function resetFilters() {
            ctrl.applyIsDisabled = false;
            ctrl.timeRange = getInitialTimeRange();
            ctrl.datePreset = initialDatePreset;
            ctrl.selectedReplicas = initialReplicas;

            lodash.merge(ctrl.filter, defaultFilter);
            $rootScope.$broadcast('search-input_reset');

            applyFilters();
        }

        /**
         * Called when user navigates between pages
         * Extend standard `changePage` call with query parameters
         * @param {number} page - new page number to get data from
         * @param {number} perPage - how many items should be present on a page
         */
        function searchWithParams(page, perPage) {
            ctrl.changePage(page, perPage, queryParams());
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
         * Perform auto updating request and extends current data set with new items
         */
        function autoUpdate() {
            // since this function is used for polling - stop polling if user is not logged in
            if (!LoginService.isLoggedIn()) {
                return;
            }

            ExecutionLogsDataService.logsPaginated(ctrl.page.number, ctrl.page.size, queryParams())
                .then(function (logs) {
                    if (logs.length > 0) {
                        ctrl.logs = lodash.cloneDeep(logs);
                        ctrl.page.total = logs['total_pages'];

                        onChangePageCallback();
                    }
                });
        }

        /**
         * Calculates count of active filters
         */
        function calcActiveFilters() {
            var filters = [
                ctrl.datePreset,
                !lodash.isEmpty(ctrl.filter.message),
                ctrl.selectedReplicas,
                !lodash.chain(ctrl.filter.level).values().compact().isEmpty().value()
            ];

            ctrl.activeFilters = lodash.size(lodash.compact(filters));
        }

        /**
         * Updates latest timestamp when new data received and generates replicas list
         */
        function onChangePageCallback() {
            startAutoUpdate();
        }

        /**
         * Generates query params for ordinary request, for example, when page was changed
         * @returns {Object}
         */
        function queryParams() {
            return {
                functionName: ctrl.version.metadata.name,
                projectName,
                filters: {
                    substring: ctrl.filter.message.replace(/[+\-=&|!(){}[\]^"~*?:\\/]/g, '\\$&')
                        .replace(/<|>/g, ''),
                    logLevels: lodash.chain(ctrl.filter.level).pickBy().keys().value(),
                    replicaNames: ctrl.selectedReplicas,
                    timeFilter: ctrl.timeRange
                }
            };
        }

        /**
         * Starts auto update process
         * @param {bool} [force] - used for making first update immediately after refreshInterval is created
         */
        function startAutoUpdate(force) {
            // proceed only if auto update was switched on
            if (ctrl.refreshRate.value !== ctrl.refreshRate.options[5].value) {
                stopAutoUpdate();
                refreshInterval = $interval(autoUpdate, parseInt(ctrl.refreshRate.value) * 1000);

                // call function to refresh data immediately if Force flag is set
                // for pagination, Force is not used, but when date range filter is changed, update should be immediate
                if (angular.isDefined(force) && force) {
                    autoUpdate();
                }
            }
        }

        /**
         * Stops auto update process
         */
        function stopAutoUpdate() {
            // if automatic update was already set, cancel it
            if (!lodash.isNull(refreshInterval)) {
                $interval.cancel(refreshInterval);
                refreshInterval = null;
            }
        }

        /**
         * Provides initial time range
         */
        function getInitialTimeRange() {
            var weekDate = ctrl.customDatePresets['7d'].getRange();

            return {
                from: weekDate.from.toISOString(),
                sort: 'desc'
            };
        }
    }
}());
