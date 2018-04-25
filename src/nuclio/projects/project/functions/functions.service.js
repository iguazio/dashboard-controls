(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .factory('FunctionsService', FunctionsService);

    function FunctionsService($stateParams) {
        return {
            getClassesList: getClassesList,
            getHandler: getHandler,
            initVersionActions: initVersionActions
        };

        //
        // Public methods
        //

        /**
         * Returns classes list by type
         * @returns {Object[]} - array of classes
         */
        function getClassesList(type) {
            var classesList = {
                trigger: [
                    {
                        id: 'kafka',
                        name: 'Kafka',
                        url: 'string',
                        attributes: [
                            {
                                name: 'topic',
                                pattern: 'string'
                            },
                            {
                                name: 'partitions',
                                pattern: 'arrayInt'
                            }
                        ]
                    },
                    {
                        id: 'rabbit_mq',
                        name: 'RabbitMQ',
                        url: 'string',
                        attributes: [
                            {
                                name: 'exchangeName',
                                pattern: 'string'
                            },
                            {
                                name: 'queueName',
                                pattern: 'string'
                            },
                            {
                                name: 'topics',
                                pattern: 'arrayStr'
                            }
                        ]
                    },
                    {
                        id: 'nats',
                        name: 'Nats',
                        url: 'string',
                        attributes: [
                            {
                                name: 'topic',
                                pattern: 'string'
                            }
                        ]
                    },
                    {
                        id: 'cron',
                        name: 'Cron',
                        attributes: [
                            {
                                name: 'interval',
                                pattern: 'string'
                            },
                            {
                                name: 'schedule',
                                pattern: 'string'
                            }
                        ]
                    },
                    {
                        id: 'eventhub',
                        name: 'Eventhub',
                        attributes: [
                            {
                                name: 'sharedAccessKeyName',
                                pattern: 'string'
                            },
                            {
                                name: 'sharedAccessKeyValue',
                                pattern: 'string'
                            },
                            {
                                name: 'namespace',
                                pattern: 'string'
                            },
                            {
                                name: 'eventHubName',
                                pattern: 'string'
                            },
                            {
                                name: 'consumerGroup',
                                pattern: 'string'
                            },
                            {
                                name: 'partitions',
                                pattern: 'arrayInt'
                            }
                        ]
                    },
                    {
                        id: 'http',
                        name: 'HTTP',
                        maxWorkers: 'number',
                        attributes: [
                            {
                                name: 'port',
                                pattern: 'number'
                            }
                        ]
                    },
                    {
                        id: 'kinesis',
                        name: 'Kinesis',
                        attributes: [
                            {
                                name: 'accessKeyID',
                                pattern: 'string'
                            },
                            {
                                name: 'secretAccessKey',
                                pattern: 'string'
                            },
                            {
                                name: 'regionName',
                                pattern: 'string'
                            },
                            {
                                name: 'streamName',
                                pattern: 'string'
                            },
                            {
                                name: 'shards',
                                pattern: 'string'
                            }
                        ]
                    }
                ],
                binding: [
                    {
                        id: 'v3io',
                        name: 'V3io',
                        url: 'string',
                        attributes: [
                            {
                                name: 'secret',
                                pattern: 'string'
                            }
                        ]
                    }
                ]
            };

            return classesList[type];
        }

        /**
         * Returns the appropriate handler regarding runtime
         * @param {string} runtime
         * @returns {string} handler
         */
        function getHandler(runtime) {
            return runtime === 'golang' ? 'main:Handler' : runtime === 'java' ? 'Handler' : 'main:handler';
        }

        /**
         * Actions for Action panel
         * @returns {Object[]} - array of actions
         */
        function initVersionActions() {
            var actions = [
                {
                    label: 'Edit',
                    id: 'edit',
                    icon: 'igz-icon-edit',
                    active: true
                },
                {
                    label: 'Delete',
                    id: 'delete',
                    icon: 'igz-icon-trash',
                    active: true,
                    confirm: {
                        message: 'Are you sure you want to delete selected version?',
                        yesLabel: 'Yes, Delete',
                        noLabel: 'Cancel',
                        type: 'critical_alert'
                    }
                }
            ];

            return actions;
        }
    }
}());
