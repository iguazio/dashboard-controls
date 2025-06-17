(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .factory('ExecutionLogsDataService', ExecutionLogsDataService);

    function ExecutionLogsDataService($rootScope, $i18next, $q, i18next, lodash, NuclioRestangular) {
        var lng = i18next.language;

        return {
            collectLogs: collectLogs,
            logsPaginated: logsPaginated,
            getReplicasList: getReplicasList
        };

        //
        // Public methods
        //

        /**
         * Collects all the logs using chunks, and saved them as an array of strings.
         * @param {Object} queryParams - additional parameters
         * @returns {Promise.<Array>} a promise resolving to an array of logs.
         */
        function collectLogs(queryParams) {
            var size = 10000;
            var downloadLogsData = [];
            var MAX_DOWNLOAD_LOGS = 100000;

            return getLogsList(0, size, queryParams).then(function (response) {
                var hits = response.hits.hits;

                if (hits.length > 0) {
                    downloadLogsData = downloadLogsData.concat(prepareLogs(hits));

                    return getNextChunk(lodash.get(lodash.last(hits), 'sort'));
                }
            });

            function getNextChunk(searchAfter) {
                return getLogsList(0, size, Object.assign(queryParams, {searchAfter}))
                    .then(function (response) {
                        var hits = response.hits.hits;

                        if (hits.length > 0 && downloadLogsData.length < MAX_DOWNLOAD_LOGS - size) {
                            downloadLogsData = downloadLogsData.concat(prepareLogs(hits));

                            return getNextChunk(lodash.get(lodash.last(response.hits.hits), 'sort'));
                        } else {
                            if (hits.length > 0) {
                                downloadLogsData = downloadLogsData.concat(prepareLogs(hits));
                            }

                            return downloadLogsData;
                        }
                    }).catch(function (error) {
                        throw error;
                    });
            }

            function prepareLogs(logs) {
                return logs.map(function (logData) {
                    var log = lodash.get(logData, '_source', {});
                    var level = log.level ? '  (' + log.level + ')  ' : '';
                    var name = lodash.get(log, 'kubernetes.pod.name', lodash.get(log, 'name', ''));

                    return log['@timestamp'] + '  ' + name + level +
                        lodash.get(log, 'message', '') + '  ' + JSON.stringify(lodash.get(log, 'more', {}));
                });
            }
        }

        /**
         * Get latest log entries (used for pagination)
         * @param {number} page - current page
         * @param {number} perPage - max items count on a page
         * @param {Object} queryParams - additional parameters
         *     update
         * @returns {Promise} array of log entries
         */
        function logsPaginated(page, perPage, queryParams) {
            return getLogsList(page, perPage, queryParams).then(function (response) {
                // Saved log entry can be found in `_source` property
                // For now all additional data from Elasticsearch is not used, so only entries are returned
                var logs = lodash.map(response.hits.hits, '_source')

                logs.total_logs_count = lodash.get(response, 'hits.total.value', 0);
                logs.total_pages = Math.ceil(lodash.get(response, 'hits.total.value', 0) / perPage);

                return logs;
            })
                .catch(function (error) {
                    return $q.reject(error);
                });
        }

        /**
         * Provides filtered replicas list
         * @param {string} projectId - project name
         * @param {string} funcName - function name
         * @param {Object} queryParams - additional parameters
         *     update
         * @returns {Promise} array of log entries
         */
        function getReplicasList(projectId, funcName, queryParams) {
            var headers = {
                'Cache-Control': 'no-cache',
                'Content-Type': 'application/json',
                'x-nuclio-project-name': projectId
            };
            var requestParams = Object.assign(queryParams, {includeOffline: true});

            if (queryParams.timeFilter) {
                queryParams.timeFilter = {
                    since: queryParams.timeFilter.from,
                    until: queryParams.timeFilter.to,
                    sort: queryParams.timeFilter.sort
                }
            }

            return NuclioRestangular.one('functions', funcName)
                .one('replicas')
                .get(requestParams, headers)
                .then(function (response) {
                    return response.replicas.names.concat(response.offlineReplicas.names);
                })
                .catch(function (error) {
                    var errorMessages = {
                        '400': $i18next.t('common:ERROR_MSG.PAGINATION.400', { lng: lng }),
                        '403': $i18next.t('common:ERROR_MSG.PAGINATION.403', { lng: lng }),
                        '500': $i18next.t('common:ERROR_MSG.ERROR_ON_SERVER_SIDE', { lng: lng }),
                        'default': $i18next.t('common:ERROR_MSG.UNKNOWN_ERROR', { lng: lng })
                    };

                    $rootScope.$broadcast('splash-screen_show-error', {
                        alertText: lodash.get(errorMessages, String(error.status), errorMessages.default) +
                            ' ' + $i18next.t('common:ERROR_MSG.TRY_REFRESHING_THE_PAGE', { lng: lng })
                    });

                    return $q.reject(error);
                });
        }

        //
        // Private methods
        //

        /**
         * Gets the list of logs based on parameters
         * @param {number} page - current page
         * @param {number} perPage - max items count on a page
         * @param {Object} queryParams - additional parameters
         *     update
         * @returns {Promise} array of log entries
         */
        function getLogsList(page, perPage, queryParams) {
            var headers = {
                'Cache-Control': 'no-cache',
                'Content-Type': 'application/json',
                'x-nuclio-project-name': queryParams.projectName
            };

            var sizeParams = {}

            if (queryParams.searchAfter) {
                queryParams.searchAfter[1] = '"' + queryParams.searchAfter[1] + '"';

                sizeParams = {
                    size: perPage,
                    searchAfter: queryParams.searchAfter
                }
            } else {
                sizeParams = {
                    size: perPage,
                    from: page * perPage,
                }
            }

            var filters = lodash.omitBy(Object.assign(sizeParams, queryParams.filters), function (value) {
                return lodash.isObject(value) || lodash.isString(value) ? lodash.isEmpty(value) : false;
            });

            if (filters.timeFilter) {
                filters.timeFilter = {
                    since: filters.timeFilter.from,
                    until: filters.timeFilter.to,
                    sort: filters.timeFilter.sort
                }
            }

            return NuclioRestangular.one('functions', queryParams.functionName)
                .one('proxy-logs')
                .get(filters, headers)
                .catch(function (error) {
                    return $q.reject(error);
                });
        }

    }
}());
