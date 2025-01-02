(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .factory('ControlPanelLogsDataService', ControlPanelLogsDataService);

    function ControlPanelLogsDataService($q, lodash, ElasticsearchService, ElasticSearchDataService) {
        return {
            collectLogs: collectLogs,
            entriesPaginated: search,
            logsPaginated: logsWidthReplicas
        };

        //
        // Public methods
        //

        /**
         * Get latest log entries with replicas
         * @param {number} page - current page
         * @param {number} perPage - max items count on a page
         * @param {Object} queryParams - additional parameters
         * @param {string} queryParams.query - search query text
         * @param {string} queryParams.timeFrame - selected time period to show results for
         * @param {string} [queryParams.lastEntryTimestamp] - time stamp of the last item in a list, used with auto
         *     update
         * @returns {Promise} array of log entries
         */
        function logsWidthReplicas(page, perPage, queryParams) {
            return search(page, perPage, queryParams, true)
        }

        /**
         * Get latest log entries
         * @param {number} page - current page
         * @param {number} perPage - max items count on a page
         * @param {Object} queryParams - additional parameters
         * @param {string} queryParams.query - search query text
         * @param {string} queryParams.timeFrame - selected time period to show results for
         * @param {string} [queryParams.lastEntryTimestamp] - time stamp of the last item in a list, used with auto
         * @param {boolean} withReplicas - determines if replicas should be requested
         *     update
         * @returns {Promise} array of log entries
         */
        function search(page, perPage, queryParams, withReplicas) {
            // if Search is called in scope of autoupdate, only new entries should be shown
            // so `lastEntryTimestamp` variable is used
            var searchFrom = queryParams.lastEntryTimestamp;
            var searchTo = 'now';
            // but if there was no items in the list, use timeFrameParam

            if (!searchFrom) {
                if (queryParams.timeFrame) {
                    searchFrom = 'now-' + queryParams.timeFrame;
                } else {
                    searchFrom = lodash.get(queryParams, 'customTimeFrame.from', '1970-01-01T00:00:00Z');
                    searchTo = lodash.get(queryParams, 'customTimeFrame.to', 'now');
                }
            }

            var config = {
                index: 'filebeat*',
                body: {
                    query: {
                        bool: {
                            must: [
                                {
                                    range: {
                                        '@timestamp': {
                                            gte: searchFrom,
                                            lte: searchTo
                                        }
                                    }
                                }
                            ]
                        }
                    },
                    sort: [
                        {
                            '@timestamp': 'desc'
                        }
                    ]
                }
            };

            if (withReplicas) {
                config.body.aggs = {
                    'distinct_pod_names': {
                        terms: {
                            field: 'kubernetes.pod.name',
                            size: 100000
                        }
                    }
                };
            }

            // If query text was set, add proper items to config
            if (!lodash.isEmpty(queryParams.query)) {
                config.body.query.bool.must.push({
                    query_string: {
                        query: queryParams.query,
                        analyze_wildcard: true,
                        default_field: '*'
                    }
                });
            }

            // Add perPage only if user navigates from page to page
            // Pagination should not be used in auto update
            if (!lodash.isNull(perPage)) {
                lodash.defaults(config, {
                    size: perPage,
                    from: page * perPage
                });
            }

            if (queryParams.trackTotalHits) {
                config.track_total_hits = true;
            }

            return ElasticsearchService.search(config)
                .then(function (response) {
                    // Saved log entry can be found in `_source` property
                    // For now all additional data from Elasticsearch is not used, so only entries are returned
                    var logs = lodash.map(response.hits.hits, '_source');
                    var replicas = lodash.get(response, 'aggregations.distinct_pod_names.buckets', []).map(function (replica) {
                        return replica.key;
                    });

                    // Total records count is received from Elasticsearch,
                    // but Paginator expects pages count, so we need to calculate it
                    logs.total_logs_count = lodash.get(response, 'hits.total.value', 0);
                    logs.total_pages = Math.ceil(lodash.get(response, 'hits.total.value', 0) / perPage);

                    if (withReplicas) {
                        logs.replicas = replicas;
                    }

                    return logs;
                })
                .catch(function (err) {
                    console.log(err);

                    return $q.reject(err);
                });
        }

        /**
         * Collects all the logs using chunks, and saved them as an array of strings.
         * @returns {Promise.<Array.<Object>>} a promise resolving to an array of logs.
         */
        function collectLogs(query) {
            var keepAlive = '5m';
            var size = 10000;
            var downloadLogsData = [];
            var createPitConfig = {
                index: 'filebeat*',
                keepAlive: keepAlive
            };

            return ElasticSearchDataService.createPit(createPitConfig).then(function (pitId) {
                return getNextPitLogs(pitId, null);
            });

            function getNextPitLogs(pitId, searchAfter) {
                return ElasticSearchDataService.getNextPitLogs(size, query, keepAlive, pitId, searchAfter).then(function (response) {
                    var hits = response.hits.hits;

                    if (hits.length > 0) {
                        var lastHit = lodash.last(hits);

                        downloadLogsData = downloadLogsData.concat(prepareLogs(hits));

                        return getNextPitLogs(response.pit_id, lastHit.sort)
                    } else {
                        return downloadLogsData;
                    }
                }).catch(function (error) {
                    throw error;
                });
            }

            function prepareLogs(logs) {
                return logs.map(function (logData) {
                    var log = lodash.get(logData, '_source', {});

                    return log['@timestamp'] + '  ' + log.name + '  (' + log.level + ')  ' +
                        lodash.get(log, 'message', '') + '  ' + JSON.stringify(lodash.get(log, 'more', {}));
                });
            }
        }

        /**
         * Mocks the real search function without the need for a running Elasticsearch service, for development
         * purposes.
         * @returns {Promise.<Array.<Object>>} a promise resolving to an array of mocked log entries.
         */
        function searchMocked(page, perPage, queryParams, withReplicas) {
            var mock = {
                levels: [
                    'debug',
                    'INFO',
                    'warn',
                    'WARNING',
                    'ERROR'
                ],
                names: [
                    'docker-registry-s1b0j6wn6s-gl3bp',
                    'framesd-jgx8uftz60',
                    'grafana-tffz8965jk-vw08z',
                    'jupyter-3ie700eg7l-ukz5g',
                    'nuclio-1k5fvxzp32',
                    'webapi-nq74spt3zw'
                ]
            };

            var logs = Array.from({ length: perPage }, function () {
                return lodash.omit({
                    '@timestamp': new Date(),
                    name: lodash.sample(mock.names),
                    level: lodash.sample(mock.levels),
                    message: 'message message message message message message message message',
                    more: 'more more more more more more more more more more more more'
                }, lodash.sample([false, true]) ? 'more' : '');
            });
            const replicas = ['nuclio-dashboard-f9f78c6dd-8scqs',
                'nuclio-controller-54fc6d9cbf-lfhln',
                'nuclio-mm-app-project-n-v1-serving-3-544ccc46b-qjlpk',
                'nuclio-mm-non-v3io-project2-serving-func0-cccf69fb9-rfvs5',
                'nuclio-fraud-demo-2-normal-user-transaction-fraud-6fc949f956zrf',
                'nuclio-llm-monitoring-intro-llm-monit-7dcd4cfcb5-tc4dq',
                'nuclio-mm-ilan-project-agg-app-cfc597969-6xkw5',
                'nuclio-mm-app-project-n-v222-model-monitoring-controller-5gbfqf',
                'nuclio-mm-ilan-project-const-app-65f7749cdf-gzfvl',
                'nuclio-mm-app-project-model-monitoring-controller-845b685cx2gvf',
                'nuclio-mm-app-project-n-v1-model-monitoring-controller-b7bv9wwq',
                'nuclio-mm-app-project-v1-model-monitoring-controller-bf8b6vgm8s',
                'nuclio-tutorial-normal-user-model-monitoring-controller-6c4gfcv'
            ];

            logs.total_pages = 30000 / perPage;
            logs.total_logs_count = 30000;

            if (withReplicas) {
                logs.replicas = replicas;
            }

            // console.info(queryParams);

            return $q.when(logs);
        }
    }
}());
