(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .factory('FunctionsService', FunctionsService);

    function FunctionsService($i18next, i18next, lodash) {
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
                        id: 'kafka-cluster',
                        name: 'Kafka',
                        attributes: [
                            {
                                name: 'kafka-topics',
                                values: {
                                    topic: {
                                        name: 'topic',
                                        type: 'input',
                                        pattern: 'string'
                                    }
                                }
                            },
                            {
                                name: 'kafka-brokers',
                                values: {
                                    topic: {
                                        name: 'brokers',
                                        type: 'input',
                                        pattern: 'string'
                                    }
                                }
                            },
                            {
                                name: 'consumerGroup',
                                pattern: 'string',
                                type: 'input',
                                fieldType: 'input',
                                allowEmpty: true
                            },
                            {
                                name: 'initialOffset',
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
                                defaultValue: 'latest',
                                pattern: 'string',
                                type: 'dropdown'
                            },
                            {
                                name: 'sasl',
                                values: {
                                    enable: {
                                        name: 'saslEnabled',
                                        type: 'checkbox',
                                        defaultValue: false
                                    },
                                    user: {
                                        name: 'saslUsername',
                                        type: 'input',
                                        defaultValue: ''
                                    },
                                    password: {
                                        name: 'saslPassword',
                                        type: 'input',
                                        defaultValue: ''
                                    }
                                }
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
                                allowEmpty: true,
                                placeholder: 'If empty, a default one will be provided'
                            },
                            {
                                name: 'topics',
                                pattern: 'arrayStr',
                                type: 'input',
                                fieldType: 'input',
                                allowEmpty: true,
                                placeholder: 'Required if Queue Name is empty'
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
                            },
                            {
                                name: 'queueName',
                                pattern: 'string',
                                type: 'input',
                                fieldType: 'input',
                                allowEmpty: true
                            }
                        ]
                    },
                    {
                        id: 'cron',
                        name: 'Cron',
                        attributes: [
                            {
                                name: 'interval',
                                pattern: 'interval',
                                type: 'input',
                                fieldType: 'input',
                                allowEmpty: false,
                                placeholder: 'E.g. 1h, 30m, 10s, 250ms'
                            },
                            {
                                name: 'schedule',
                                pattern: 'string',
                                type: 'input',
                                fieldType: 'input',
                                allowEmpty: false
                            },
                            {
                                name: 'event',
                                values: {
                                    body: {
                                        name: 'body',
                                        defaultValue: ''
                                    },
                                    headers: {
                                        name: 'headers',
                                        defaultValue: {}
                                    }
                                }
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
                        workerAvailabilityTimeoutMilliseconds: {
                            name: 'workerAvailabilityTimeoutMilliseconds',
                            pattern: 'number',
                            type: 'number-input',
                            allowEmpty: false,
                            defaultValue: 0
                        },
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
                        ],
                        annotations: {
                            name: 'annotations',
                            pattern: 'object',
                            type: 'key-value'
                        }
                    },
                    {
                        id: 'v3ioStream',
                        name: 'V3IO stream',
                        url: 'string',
                        username: 'string',
                        password: 'string',
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
                    },
                    {
                        id: 'mqtt',
                        name: 'MQTT',
                        url: 'string',
                        username: 'string',
                        password: 'string',
                        attributes: [
                            {
                                name: 'subscriptions',
                                values: {
                                    topic: {
                                        name: 'topic',
                                        type: 'input',
                                        pattern: 'string'
                                    },
                                    qos: {
                                        name: 'QoS',
                                        type: 'input',
                                        pattern: 'number'
                                    }
                                }
                            }
                        ]
                    }
                ],
                binding: [
                    {
                        id: 'v3io',
                        name: 'V3IO',
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
                ],
                volume: [
                    {
                        id: 'v3io',
                        name: 'V3IO',
                        tooltip: 'A directory in an Iguazio Data Science Platform data container'
                    },
                    {
                        id: 'secret',
                        name: 'Secret',
                        tooltip: $i18next.t('functions:TOOLTIP.SECRET', {lng: i18next.language})
                    },
                    {
                        id: 'configMap',
                        name: 'ConfigMap',
                        tooltip: $i18next.t('functions:TOOLTIP.CONFIG_MAP', {lng: i18next.language})
                    },
                    {
                        id: 'persistentVolumeClaim',
                        name: 'PVC'
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
            var lng = i18next.language;

            return [
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
        }
    }
}());
