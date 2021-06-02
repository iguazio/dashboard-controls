(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .factory('TableSizeService', TableSizeService);

    function TableSizeService(lodash, ConfigService) {
        var clustersTableColSizes = {
            name: '15',
            status: '10',
            alerts: '7-5',
            nodes: '7',
            sessions: ConfigService.isStagingMode() ? '5' : '6',
            cpu: '17-5',
            size: '10',
            bandwidth: ConfigService.isStagingMode() ? '7' : '9',
            io: ConfigService.isStagingMode() ? '7' : '9',
            latency: ConfigService.isStagingMode() ? '7' : '9',
            scannedItems: ConfigService.isStagingMode() ? '7' : null,
            emptyBlock: '58'
        };
        var containersTableColSizes = {
            name: {
                production: '28',
                demo: '12',
                staging: '25'
            },
            usedCapacity: {
                production: '28',
                demo: '20',
                staging: '25'
            },
            bandwidth: {
                production: '15',
                demo: '12',
                staging: '12-5'
            },
            iops: {
                production: '15',
                demo: '10',
                staging: '12-5'
            },
            latency: {
                production: '14',
                demo: '11',
                staging: '12-5'
            },
            scannedItems: {
                production: null,
                demo: '10',
                staging: '12-5'
            }
        };
        var eventsTableColSizes = {
            time: {
                'event-log': {
                    default: '25',
                    demo: '17-5'
                },
                'communication': {
                    default: '25',
                    demo: '17-5'
                },
                'audit': {
                    default: '20',
                    demo: '20'
                }
            },
            severity: {
                'event-log': {
                    default: '2-5',
                    demo: '2-5'
                },
                'communication': {
                    default: '2-5',
                    demo: '2-5'
                },
                'audit': {
                    default: '5',
                    demo: '5'
                }
            },
            kind: {
                'event-log': {
                    default: '25',
                    demo: '16'
                },
                'communication': {
                    default: '25',
                    demo: '16'
                },
                'audit': {
                    default: '20',
                    demo: '20'
                }
            },
            classification: {
                'event-log': {
                    default: '12-5',
                    demo: '10'
                },
                'communication': {
                    default: '12-5',
                    demo: '10'
                },
                'audit': {
                    default: '20',
                    demo: '20'
                }
            },
            source: {
                'event-log': {
                    default: '14',
                    demo: '14'
                },
                'communication': {
                    default: '14',
                    demo: '14'
                }
            },
            tags: {
                'event-log': {
                    default: '12-5',
                    demo: '12-5'
                },
                'communication': {
                    default: '12-5',
                    demo: '12-5'
                }
            },
            objects: {
                'event-log': {
                    default: '12-5',
                    demo: '12-5'
                },
                'communication': {
                    default: '12-5',
                    demo: '12-5'
                }
            },
            description: {
                'event-log': {
                    default: '35',
                    demo: '15'
                },
                'communication': {
                    default: '35',
                    demo: '15'
                },
                'audit': {
                    default: '35',
                    demo: '35'
                }
            }
        };
        var functionsTableColSizes = {
            headerName: {
                default: '10',
                demo: '10'
            },
            rowName: {
                default: '10',
                demo: '10'
            },
            status: {
                default: '7-5',
                demo: '7-5'
            },
            replicas: {
                default: '5',
                demo: '5'
            },
            owner: {
                default: '7-5',
                demo: '7-5'
            },
            runtime: {
                default: '7-5',
                demo: '7-5'
            },
            invocationUrl: {
                default: '12-5',
                demo: '10'
            },
            invocationPerSec: {
                default: '10',
                demo: '7-5'
            },
            cpuCores: {
                default: '15',
                demo: '15'
            },
            metricsSize: {
                default: '15',
                demo: '15'
            },
            metricsCount: {
                default: '15',
                demo: '15'
            }
        };

        return {
            getClustersTableColSize: getClustersTableColSize,
            getContainersTableColSize: getContainersTableColSize,
            getEventsTableColSize: getEventsTableColSize,
            getFunctionsTableColSize: getFunctionsTableColSize
        };

        //
        // Public methods
        //

        /**
         * Gets the size of clusters table column
         * @param {string} column - name of the column
         * @returns {string} column class
         */
        function getClustersTableColSize(column) {
            return 'igz-col-' + lodash.get(clustersTableColSizes, column);
        }

        /**
         * Gets the size of containers table column
         * @param {string} column - name of the column
         * @returns {string} column class
         */
        function getContainersTableColSize(column) {
            var columnSizes = lodash.get(containersTableColSizes, column);
            var columnSize = '';

            if (ConfigService.isDemoMode()) {
                columnSize = lodash.get(columnSizes, 'demo');
            } else if (ConfigService.isStagingMode()) {
                columnSize = lodash.get(columnSizes, 'staging');
            } else {
                columnSize = lodash.get(columnSizes, 'production');
            }

            return 'igz-col-' + columnSize;
        }

        /**
         * Gets the size of events table column
         * @param {string} column - name of the column
         * @param {string} tabName - name of the tab
         * @returns {string} css class
         */
        function getEventsTableColSize(column, tabName) {
            return 'igz-col-' + lodash.get(eventsTableColSizes, [column, tabName, (ConfigService.isDemoMode() ? 'demo' : 'default')]);
        }

        /**
         * Gets the size of functions table column
         * @param {string} column - name of the column
         * @returns {string} css class
         */
        function getFunctionsTableColSize(column) {
            return 'igz-col-' + lodash.get(functionsTableColSizes, [column, (ConfigService.isDemoMode() ? 'demo' : 'default')]);
        }

    }
}());
