(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .factory('FunctionsService', FunctionsService);

    function FunctionsService($timeout, lodash, YAML) {
        return {
            exportFunction: exportFunction,
            getClassesList: getClassesList,
            getHandler: getHandler,
            initVersionActions: initVersionActions
        };

        //
        // Public methods
        //

        function exportFunction(version) {
            var versionYaml = {
                metadata: lodash.omit(version.metadata, 'namespace'),
                spec: lodash.omit(version.spec, ['build.noBaseImagesPull', 'loggerSinks'])
            };

            var parsedVersion = YAML.stringify(versionYaml, Infinity, 2);

            parsedVersion = getValidYaml(parsedVersion);

            var blob = new Blob([parsedVersion], {
                type: 'application/json'
            });

            downloadExportedFunction(blob, version);
        }

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
                        name: 'v3io stream',
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
                ],
                volume: [
                    {
                        id: 'v3io',
                        name: 'v3io'
                    },
                    {
                        id: 'hostPath',
                        name: 'Host path'
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
            return [
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
        }

        //
        // Private methods
        //

        /**
         * Creates artificial link and starts downloading of exported function.
         * Downloaded .yaml file will be saved in user's default folder for downloads.
         * @param {string} data - exported function config parsed to YAML
         */
        function downloadExportedFunction(data, version) {
            var url = URL.createObjectURL(data);
            var link = document.createElement('a');

            link.href = url;
            link.download = version.metadata.name + '.yaml';
            document.body.appendChild(link);

            $timeout(function () {
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            });
        }

        /**
         * Returns valid YAML string.
         * First RegExp deletes all excess lines in YAML string created by issue in yaml.js package.
         * It is necessary to generate valid YAML.
         * Example:
         * -
         *   name: name
         *   value: value
         * -
         *   name: name
         *   value: value
         * Will transform in:
         * - name: name
         *   value: value
         * - name: name
         *   value: value
         * Second and Third RegExp replaces all single quotes on double quotes.
         * Example:
         * 'key': 'value' -> "key": "value"
         * Fourth RegExp replaces all pairs of single quotes on one single quote.
         * It needs because property name or property value is a sting which contains single quote
         * will parsed by yaml.js package in string with pair of single quotes.
         * Example:
         * "ke'y": "val'ue"
         * After will parse will be -> "ke''y": "val''ue"
         * This RegExp will transform it to normal view -> "ke'y": "val'ue"
         * @param {string} data - incoming YAML-string
         * @returns {string}
         */
        function getValidYaml(data) {
            return data.replace(/(\s+\-)\s*\n\s+/g, '$1 ')
                .replace(/'(.+)'(:)/g, '\"$1\"$2')
                .replace(/(:\s)'(.+)'/g, '$1\"$2\"')
                .replace(/'{2}/g, '\'');
        }
    }
}());
