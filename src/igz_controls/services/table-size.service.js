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
                production: '25',
                demo: '20',
                staging: '25'
            },
            profile: {
                production: '',
                demo: '10',
                staging: ''
            },
            usedCapacity: {
                production: '25',
                demo: '20',
                staging: '25'
            },
            bandwidth: {
                production: '12-5',
                demo: '10',
                staging: '12-5'
            },
            iops: {
                production: '12-5',
                demo: '10',
                staging: '12-5'
            },
            latency: {
                production: '12-5',
                demo: '10',
                staging: '12-5'
            },
            scannedItems: {
                production: '12-5',
                demo: '10',
                staging: '12-5'
            },
            cost: {
                production: '',
                demo: '10',
                staging: ''
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
                default: '20',
                demo: '15'
            },
            rowName: {
                default: '20',
                demo: '15'
            },
            status: {
                default: '10',
                demo: '10'
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
            invocationPerSec: {
                default: '5',
                demo: '5'
            },
            cpuCores: {
                default: '12-5',
                demo: '12-5'
            },
            metricsSize: {
                default: '12-5',
                demo: '12-5'
            },
            gpuCores: {
                default: '12-5',
                demo: '12-5'
            },
            metricsCount: {
                default: '12-5',
                demo: '12-5'
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
