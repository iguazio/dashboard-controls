(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .factory('FunctionsService', FunctionsService);

    function FunctionsService(lodash) {
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
                                pattern: 'string',
                                type: 'input',
                                fieldType: 'input',
                                allowEmpty: false
                            },
                            {
                                name: 'partitions',
                                pattern: 'arrayInt',
                                type: 'input',
                                fieldType: 'input',
                                allowEmpty: false
                            }
                        ]
                    },
                    {
                        id: 'rabbit-mq',
                        name: 'RabbitMQ',
                        url: 'string',
                        attributes: [
                            {
                                name: 'exchangeName',
                                pattern: 'string',
                                type: 'input',
                                fieldType: 'input',
                                allowEmpty: false
                            },
                            {
                                name: 'queueName',
                                pattern: 'string',
                                type: 'input',
                                fieldType: 'input',
                                allowEmpty: false
                            },
                            {
                                name: 'topics',
                                pattern: 'arrayStr',
                                type: 'input',
                                fieldType: 'input',
                                allowEmpty: false
                            }
                        ]
                    },
                    {
                        id: 'nats',
                        name: 'NATS',
                        url: 'string',
                        attributes: [
                            {
                                name: 'topic',
                                pattern: 'string',
                                type: 'input',
                                fieldType: 'input',
                                allowEmpty: false
                            }
                        ]
                    },
                    {
                        id: 'cron',
                        name: 'Cron',
                        attributes: [
                            {
                                name: 'interval',
                                pattern: 'string',
                                type: 'input',
                                fieldType: 'input',
                                allowEmpty: false
                            },
                            {
                                name: 'schedule',
                                pattern: 'string',
                                type: 'input',
                                fieldType: 'input',
                                allowEmpty: false
                            }
                        ]
                    },
                    {
                        id: 'eventhub',
                        name: 'Eventhub',
                        attributes: [
                            {
                                name: 'sharedAccessKeyName',
                                pattern: 'string',
                                type: 'input',
                                fieldType: 'input',
                                allowEmpty: false
                            },
                            {
                                name: 'sharedAccessKeyValue',
                                pattern: 'string',
                                type: 'input',
                                fieldType: 'input',
                                allowEmpty: false
                            },
                            {
                                name: 'namespace',
                                pattern: 'string',
                                type: 'input',
                                fieldType: 'input',
                                allowEmpty: false
                            },
                            {
                                name: 'eventHubName',
                                pattern: 'string',
                                type: 'input',
                                fieldType: 'input',
                                allowEmpty: false
                            },
                            {
                                name: 'consumerGroup',
                                pattern: 'string',
                                type: 'input',
                                fieldType: 'input',
                                allowEmpty: false
                            },
                            {
                                name: 'partitions',
                                pattern: 'arrayInt',
                                type: 'input',
                                fieldType: 'input',
                                allowEmpty: false
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
                                pattern: 'number',
                                type: 'input',
                                fieldType: 'input',
                                allowEmpty: true
                            },
                            {
                                name: 'ingresses',
                                pattern: 'object',
                                type: 'key-value'
                            }
                        ]
                    },
                    {
                        id: 'v3ioStream',
                        name: 'v3io stream',
                        url: 'string',
                        attributes: [
                            {
                                name: 'partitions',
                                pattern: 'arrayInt',
                                type: 'input',
                                fieldType: 'input',
                                allowEmpty: false
                            },
                            {
                                name: 'seekTo',
                                values: [
                                    {
                                        id: 'earliest',
                                        name: 'Earliest',
                                        visible: true
                                    },
                                    {
                                        id: 'latest',
                                        name: 'Latest',
                                        visible: true
                                    }
                                ],
                                pattern: 'string',
                                type: 'dropdown'
                            },
                            {
                                name: 'readBatchSize',
                                pattern: 'number',
                                type: 'number-input',
                                allowEmpty: true,
                                defaultValue: 64
                            },
                            {
                                name: 'pollingIntervalMs',
                                unit: 'ms',
                                pattern: 'number',
                                type: 'number-input',
                                allowEmpty: true,
                                defaultValue: 500
                            }
                        ]
                    },
                    {
                        id: 'kinesis',
                        name: 'Kinesis',
                        attributes: [
                            {
                                name: 'accessKeyID',
                                pattern: 'string',
                                type: 'input',
                                fieldType: 'input',
                                allowEmpty: false
                            },
                            {
                                name: 'secretAccessKey',
                                pattern: 'string',
                                type: 'input',
                                fieldType: 'input',
                                allowEmpty: false
                            },
                            {
                                name: 'regionName',
                                pattern: 'string',
                                type: 'input',
                                fieldType: 'input',
                                allowEmpty: false
                            },
                            {
                                name: 'streamName',
                                pattern: 'string',
                                type: 'input',
                                fieldType: 'input',
                                allowEmpty: false
                            },
                            {
                                name: 'shards',
                                pattern: 'arrayStr',
                                type: 'input',
                                fieldType: 'input',
                                allowEmpty: false
                            }
                        ]
                    }
                ],
                binding: [
                    {
                        id: 'v3io',
                        name: 'v3io',
                        url: 'string',
                        attributes: [
                            {
                                name: 'containerID',
                                pattern: 'string',
                                type: 'input',
                                fieldType: 'input',
                                allowEmpty: false
                            },
                            {
                                name: 'numWorkers',
                                pattern: 'number',
                                type: 'number-input',
                                allowEmpty: true,
                                defaultValue: 8,
                                maxValue: 100
                            },
                            {
                                name: 'username',
                                pattern: 'string',
                                type: 'input',
                                fieldType: 'input',
                                allowEmpty: false
                            },
                            {
                                name: 'password',
                                pattern: 'password',
                                type: 'input',
                                fieldType: 'password',
                                allowEmpty: false
                            }
                        ]
                    },
                    {
                        id: 'eventhub',
                        name: 'Eventhub',
                        attributes: [
                            {
                                name: 'sharedAccessKeyName',
                                pattern: 'string',
                                type: 'input',
                                fieldType: 'input',
                                allowEmpty: false
                            },
                            {
                                name: 'sharedAccessKeyValue',
                                pattern: 'string',
                                type: 'input',
                                fieldType: 'input',
                                allowEmpty: false
                            },
                            {
                                name: 'namespace',
                                pattern: 'string',
                                type: 'input',
                                fieldType: 'input',
                                allowEmpty: false
                            },
                            {
                                name: 'eventHubName',
                                pattern: 'string',
                                type: 'input',
                                fieldType: 'input',
                                allowEmpty: false
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
            var handlers = {
                'golang': 'main:Handler',
                'java': 'Handler',
                'shell': 'main.sh'
            };

            return lodash.get(handlers, runtime, 'main:handler');
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
