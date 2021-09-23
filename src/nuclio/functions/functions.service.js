(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .factory('FunctionsService', FunctionsService);

    function FunctionsService($i18next, i18next, lodash, ngDialog, ConfigService, DialogsService) {
        var self = {
            checkedItem: '',
            getClassesList: getClassesList,
            getHandler: getHandler,
            getDisplayStatus: getDisplayStatus,
            getSteadyStates: getSteadyStates,
            initFunctionActions: initFunctionActions,
            initVersionActions: initVersionActions,
            isFunctionDeploying: isFunctionDeploying,
            isKubePlatform: isKubePlatform,
            openDeployDeletedFunctionDialog: openDeployDeletedFunctionDialog,
            openFunctionConflictDialog: openFunctionConflictDialog,
            openVersionDeleteDialog: openVersionDeleteDialog,
            openVersionOverwriteDialog: openVersionOverwriteDialog
        };

        return self;

        //
        // Public methods
        //

        /**
         * Returns classes list by type.
         * @param {string} type - Determines which class list to return (e.g. `'volume'`, `'trigger'`).
         * @param {Object} [additionalData] - May include additional data for populating the list.
         * @returns {Object[]} - array of classes
         */
        function getClassesList(type, additionalData) {
            var lng = i18next.language;
            var defaultFunctionConfig = lodash.get(ConfigService, 'nuclio.defaultFunctionConfig.attributes', {});
            var classesList = {
                trigger: [
                    {
                        id: 'kafka-cluster',
                        name: 'Kafka',
                        tooltip: 'Kafka',
                        tooltipOriginal: 'Kafka',
                        tooltipPlacement: 'right',
                        fields: [
                            {
                                name: 'kafka-topics',
                                path: 'attributes.topics',
                                values: {
                                    topic: {
                                        name: 'topic',
                                        type: 'input'
                                    }
                                }
                            },
                            {
                                name: 'kafka-brokers',
                                path: 'attributes.brokers',
                                values: {
                                    topic: {
                                        name: 'brokers',
                                        type: 'input'
                                    }
                                }
                            },
                            {
                                name: 'saslUsername',
                                label: $i18next.t('functions:SASL_USERNAME', { lng: lng }),
                                type: 'input',
                                path: 'attributes.sasl.user',
                                allowEmpty: true,
                                defaultValue: ''
                            },
                            {
                                name: 'saslPassword',
                                label: $i18next.t('functions:SASL_PASSWORD', { lng: lng }),
                                type: 'input',
                                fieldType: 'password',
                                path: 'attributes.sasl.password',
                                allowEmpty: true,
                                defaultValue: '',
                                autocomplete: 'new-password'
                            },
                            {
                                name: 'consumerGroup',
                                label: $i18next.t('functions:CONSUMER_GROUP_NAME', { lng: lng }),
                                type: 'input',
                                fieldType: 'input',
                                path: 'attributes.consumerGroup',
                                placeholder:
                                    $i18next.t('functions:PLACEHOLDER.ENTER_CONSUMER_GROUP_NAME', { lng: lng }),
                                allowEmpty: false
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
                                path: 'attributes.initialOffset',
                                type: 'dropdown'
                            },
                            {
                                name: 'workerAllocationMode',
                                values: [
                                    {
                                        id: 'pool',
                                        name: 'Pool',
                                        visible: true
                                    },
                                    {
                                        id: 'static',
                                        name: 'Static',
                                        visible: true
                                    }
                                ],
                                isAdvanced: true,
                                defaultValue: 'pool',
                                path: 'attributes.workerAllocationMode',
                                type: 'dropdown'
                            },
                            {
                                name: 'maxWorkers',
                                type: 'number-input',
                                allowEmpty: true,
                                min: 1,
                                max: 100000,
                                defaultValue: 1
                            },
                            {
                                name: 'sessionTimeout',
                                pattern: 'interval',
                                type: 'input',
                                fieldType: 'input',
                                path: 'attributes.sessionTimeout',
                                isAdvanced: true,
                                allowEmpty: true,
                                placeholder: $i18next.t('functions:PLACEHOLDER.ENTER_DURATION', { lng: lng }),
                                defaultValue: '10s'
                            },
                            {
                                name: 'heartbeatInterval',
                                pattern: 'interval',
                                type: 'input',
                                fieldType: 'input',
                                path: 'attributes.heartbeatInterval',
                                isAdvanced: true,
                                allowEmpty: true,
                                placeholder: $i18next.t('functions:PLACEHOLDER.ENTER_DURATION', { lng: lng }),
                                defaultValue: '3s'
                            },
                            {
                                name: 'fetchDefault',
                                label: $i18next.t('functions:BYTES_TO_FETCH_DEFAULT', { lng: lng }),
                                type: 'number-input',
                                path: 'attributes.fetchDefault',
                                isAdvanced: true,
                                allowEmpty: true,
                                unit: $i18next.t('common:BYTES', { lng: lng }),
                                min: 1,
                                max: 67108864, // 64 * 1024 * 1024 bytes = 64 MiB
                                defaultValue: 1048576
                            },
                            {
                                name: 'rebalanceTimeout',
                                label: $i18next.t('functions:REBALANCE_TIMEOUT', { lng: lng }),
                                pattern: 'interval',
                                type: 'input',
                                fieldType: 'input',
                                path: 'attributes.rebalanceTimeout',
                                isAdvanced: true,
                                allowEmpty: true,
                                placeholder: $i18next.t('functions:PLACEHOLDER.ENTER_DURATION', { lng: lng }),
                                defaultValue: '60s'
                            },
                            {
                                name: 'maxWaitHandlerDuringRebalance',
                                label: $i18next.t('functions:REBALANCING_GRACE_PERIOD', { lng: lng }),
                                pattern: 'interval',
                                type: 'input',
                                fieldType: 'input',
                                path: 'attributes.maxWaitHandlerDuringRebalance',
                                isAdvanced: true,
                                allowEmpty: true,
                                placeholder: $i18next.t('functions:PLACEHOLDER.ENTER_DURATION', { lng: lng }),
                                defaultValue: '5s'
                            },
                            {
                                name: 'workerAllocatorName',
                                type: 'input',
                                fieldType: 'input',
                                isAdvanced: true,
                                allowEmpty: true
                            }
                        ]
                    },
                    {
                        id: 'rabbit-mq',
                        name: 'RabbitMQ',
                        description: $i18next.t('common:TECH_PREVIEW', { lng: lng }),
                        tooltip: 'RabbitMQ',
                        tooltipOriginal: 'RabbitMQ',
                        tooltipPlacement: 'right',
                        fields: [
                            {
                                name: 'url',
                                label: 'URL',
                                type: 'input',
                                fieldType: 'input',
                                allowEmpty: false
                            },
                            {
                                name: 'exchangeName',
                                type: 'input',
                                fieldType: 'input',
                                path: 'attributes.exchangeName',
                                allowEmpty: false
                            },
                            {
                                name: 'queueName',
                                type: 'input',
                                fieldType: 'input',
                                path: 'attributes.queueName',
                                allowEmpty: true,
                                placeholder:
                                    $i18next.t('functions:PLACEHOLDER.DEFAULT_PROVIDED_WHEN_EMPTY', { lng: lng })
                            },
                            {
                                name: 'topics',
                                pattern: 'arrayStr',
                                type: 'input',
                                fieldType: 'input',
                                path: 'attributes.topics',
                                allowEmpty: true,
                                placeholder:
                                    $i18next.t('functions:PLACEHOLDER.REQUIRED_IF_QUEUE_NAME_IS_EMPTY', { lng: lng })
                            },
                            {
                                name: 'workerAllocatorName',
                                type: 'input',
                                fieldType: 'input',
                                isAdvanced: true,
                                allowEmpty: true
                            }
                        ]
                    },
                    {
                        id: 'nats',
                        name: 'NATS',
                        description: $i18next.t('common:TECH_PREVIEW', { lng: lng }),
                        tooltip: 'NATS',
                        tooltipOriginal: 'NATS',
                        tooltipPlacement: 'right',
                        fields: [
                            {
                                name: 'url',
                                label: 'URL',
                                type: 'input',
                                fieldType: 'input',
                                allowEmpty: false
                            },
                            {
                                name: 'topic',
                                type: 'input',
                                fieldType: 'input',
                                path: 'attributes.topic',
                                allowEmpty: false
                            },
                            {
                                name: 'queueName',
                                type: 'input',
                                fieldType: 'input',
                                path: 'attributes.queueName',
                                allowEmpty: true
                            },
                            {
                                name: 'workerAllocatorName',
                                type: 'input',
                                fieldType: 'input',
                                isAdvanced: true,
                                allowEmpty: true
                            }
                        ]
                    },
                    {
                        id: 'cron',
                        name: 'Cron',
                        tooltip: 'Cron',
                        tooltipOriginal: 'Cron',
                        tooltipPlacement: 'right',
                        fields: [
                            {
                                name: 'maxWorkers',
                                type: 'number-input',
                                allowEmpty: true,
                                min: 1,
                                max: 100000,
                                defaultValue: 1,
                                visible: !self.isKubePlatform()
                            },
                            {
                                name: 'workerAvailabilityTimeoutMilliseconds',
                                type: 'number-input',
                                allowEmpty: true,
                                min: 1,
                                placeholder: $i18next.t('common:DEFAULT', { lng: lng }),
                                moreInfoDescription:
                                    $i18next.t('functions:WORKER_AVAILABILITY_TIMEOUT_MILLISECONDS_DESCRIPTION', {
                                        lng: lng,
                                        default: lodash.get(defaultFunctionConfig,
                                                            'spec.triggers.cron.workerAvailabilityTimeoutMilliseconds',
                                                            '')
                                    }),
                                visible: !self.isKubePlatform()
                            },
                            {
                                name: 'interval',
                                pattern: 'cronInterval',
                                type: 'input',
                                fieldType: 'input',
                                path: 'attributes.interval',
                                allowEmpty: true,
                                placeholder: $i18next.t('functions:PLACEHOLDER.ENTER_DURATION', { lng: lng })
                            },
                            {
                                name: 'schedule',
                                moreInfoDescription:
                                    $i18next.t('functions:TOOLTIP.INTERVAL_SCHEDULE_ONLY_ONE', { lng: lng }),
                                moreInfoIconType: 'info',
                                moreInfoOpen: false,
                                type: 'input',
                                fieldType: 'schedule',
                                path: 'attributes.schedule',
                                allowEmpty: false
                            },
                            {
                                name: 'eventBody',
                                type: 'input',
                                fieldType: 'input',
                                path: 'attributes.event.body',
                                allowEmpty: true
                            },
                            {
                                name: 'eventHeaders',
                                defaultValue: {}
                            },
                            {
                                name: 'workerAllocatorName',
                                type: 'input',
                                fieldType: 'input',
                                isAdvanced: !self.isKubePlatform(),
                                allowEmpty: true,
                                visible: !self.isKubePlatform()
                            }
                        ]
                    },
                    {
                        id: 'eventhub',
                        name: 'Azure Event Hubs',
                        description: $i18next.t('common:TECH_PREVIEW', { lng: lng }),
                        tooltip: 'Azure Event Hubs',
                        tooltipOriginal: 'Azure Event Hubs',
                        tooltipPlacement: 'right',
                        fields: [
                            {
                                name: 'sharedAccessKeyName',
                                type: 'input',
                                fieldType: 'input',
                                path: 'attributes.sharedAccessKeyName',
                                allowEmpty: false
                            },
                            {
                                name: 'sharedAccessKeyValue',
                                type: 'input',
                                fieldType: 'input',
                                path: 'attributes.sharedAccessKeyValue',
                                allowEmpty: false
                            },
                            {
                                name: 'namespace',
                                type: 'input',
                                fieldType: 'input',
                                path: 'attributes.namespace',
                                allowEmpty: false
                            },
                            {
                                name: 'eventHubName',
                                type: 'input',
                                fieldType: 'input',
                                path: 'attributes.eventHubName',
                                allowEmpty: false
                            },
                            {
                                name: 'consumerGroup',
                                label: $i18next.t('functions:CONSUMER_GROUP_NAME', { lng: lng }),
                                type: 'input',
                                fieldType: 'input',
                                path: 'attributes.consumerGroup',
                                placeholder:
                                    $i18next.t('functions:PLACEHOLDER.ENTER_CONSUMER_GROUP_NAME', { lng: lng }),
                                allowEmpty: false
                            },
                            {
                                name: 'partitions',
                                type: 'arrayInt',
                                path: 'attributes.partitions',
                                placeholder:
                                    $i18next.t('common:PLACEHOLDER.COMMA_DELIMITED_LIST_OF_NUMBERS', { lng: lng }),
                                allowEmpty: false
                            },
                            {
                                name: 'workerAllocatorName',
                                type: 'input',
                                fieldType: 'input',
                                isAdvanced: true,
                                allowEmpty: true
                            }
                        ]
                    },
                    {
                        id: 'http',
                        name: 'HTTP',
                        tooltip: 'HTTP',
                        tooltipOriginal: 'HTTP',
                        tooltipPlacement: 'right',
                        fields: [
                            {
                                name: 'maxWorkers',
                                type: 'number-input',
                                allowEmpty: true,
                                min: 1,
                                max: 100000,
                                defaultValue: 1
                            },
                            {
                                name: 'workerAvailabilityTimeoutMilliseconds',
                                type: 'number-input',
                                allowEmpty: true,
                                min: 1,
                                placeholder: $i18next.t('common:DEFAULT', { lng: lng }),
                                moreInfoDescription:
                                    $i18next.t('functions:WORKER_AVAILABILITY_TIMEOUT_MILLISECONDS_DESCRIPTION', {
                                        lng: lng,
                                        default: lodash.get(defaultFunctionConfig,
                                                            'spec.triggers.http.workerAvailabilityTimeoutMilliseconds',
                                                            '')
                                    })
                            },
                            {
                                name: 'port',
                                pattern: 'number',
                                type: 'input',
                                fieldType: 'input',
                                path: 'attributes.port',
                                allowEmpty: true
                            },
                            {
                                name: 'ingresses',
                                type: 'key-value',
                                path: 'attributes.ingresses'
                            },
                            {
                                name: 'workerAllocatorName',
                                type: 'input',
                                fieldType: 'input',
                                isAdvanced: true,
                                allowEmpty: true
                            },
                            {
                                name: 'serviceType',
                                values: [
                                    {
                                        id: 'ClusterIP',
                                        name: 'Cluster IP',
                                        visible: true
                                    },
                                    {
                                        id: 'NodePort',
                                        name: 'Node Port',
                                        visible: true
                                    }
                                ],
                                path: 'attributes.serviceType',
                                type: 'dropdown',
                                allowEmpty: true,
                                isAdvanced: true,
                                visible: self.isKubePlatform()
                            },
                            {
                                name: 'annotations',
                                type: 'key-value'
                            }
                        ]
                    },
                    {
                        id: 'v3ioStream',
                        name: 'V3IO stream',
                        tooltip: 'V3IO stream',
                        tooltipOriginal: 'V3IO stream',
                        tooltipPlacement: 'right',
                        fields: [
                            {
                                name: 'containerName',
                                type: 'dropdown',
                                enableTyping: true,
                                path: 'attributes.containerName',
                                values: lodash.get(additionalData, 'containers', []),
                                defaultValue: lodash.get(additionalData, 'containers[0].id', ''),
                                placeholder: $i18next.t('common:PLACEHOLDER.SELECT_OR_ENTER', { lng: lng }),
                                moreInfoDescription:
                                    $i18next.t('functions:TOOLTIP.V3IO_STREAM_CONTAINER', { lng: lng }),
                                moreInfoHtml: true,
                                allowEmpty: false
                            },
                            {
                                name: 'url',
                                label: $i18next.t('common:URL', { lng: lng }),
                                type: 'input',
                                fieldType: 'input',
                                defaultValue: lodash.get(
                                    ConfigService,
                                    'nuclio.defaultFunctionConfig.attributes.spec.triggers.v3ioStream.url',
                                    ''
                                ),
                                placeholder: $i18next.t('common:PLACEHOLDER.ENTER_URL', { lng: lng }),
                                moreInfoDescription: $i18next.t('functions:TOOLTIP.V3IO_STREAM_URL', { lng: lng }),
                                moreInfoHtml: true,
                                isAdvanced: !lodash.isEmpty(lodash.get(additionalData, 'containers')),
                                allowEmpty: false
                            },
                            {
                                name: 'password',
                                label: $i18next.t('functions:ACCESS_KEY', { lng: lng }),
                                type: 'input',
                                fieldType: 'password',
                                path: 'password',
                                placeholder: $i18next.t('functions:PLACEHOLDER.ENTER_ACCESS_KEY', { lng: lng }),
                                allowEmpty: false,
                                autocomplete: 'new-password'
                            },
                            {
                                name: 'streamPath',
                                type: 'input',
                                fieldType: 'input',
                                path: 'attributes.streamPath',
                                allowEmpty: false
                            },
                            {
                                name: 'consumerGroup',
                                label: $i18next.t('functions:CONSUMER_GROUP_NAME', { lng: lng }),
                                type: 'input',
                                fieldType: 'input',
                                path: 'attributes.consumerGroup',
                                pattern: 'v3ioConsumerGroupName',
                                placeholder:
                                    $i18next.t('functions:PLACEHOLDER.ENTER_CONSUMER_GROUP_NAME', { lng: lng }),
                                allowEmpty: false
                            },
                            {
                                name: 'seekTo',
                                label: $i18next.t('functions:INITIAL_OFFSET', { lng: lng }),
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
                                path: 'attributes.seekTo',
                                type: 'dropdown'
                            },
                            {
                                name: 'workerAllocationMode',
                                values: [
                                    {
                                        id: 'pool',
                                        name: 'Pool',
                                        visible: true
                                    },
                                    {
                                        id: 'static',
                                        name: 'Static',
                                        visible: true
                                    }
                                ],
                                defaultValue: 'pool',
                                path: 'attributes.workerAllocationMode',
                                type: 'dropdown',
                                isAdvanced: true
                            },
                            {
                                name: 'maxWorkers',
                                type: 'number-input',
                                allowEmpty: true,
                                min: 1,
                                max: 100000,
                                defaultValue: 1
                            },
                            {
                                name: 'readBatchSize',
                                type: 'number-input',
                                path: 'attributes.readBatchSize',
                                isAdvanced: true,
                                allowEmpty: true,
                                unit: $i18next.t('common:BYTES', { lng: lng }),
                                min: 1,
                                max: 16384, // 16 * 1024 = 16 KiB
                                defaultValue: 64
                            },
                            {
                                name: 'pollingIntervalMs',
                                label: $i18next.t('functions:POLLING_INTERVAL', { lng: lng }),
                                unit: 'ms',
                                type: 'number-input',
                                path: 'attributes.pollingIntervalMs',
                                isAdvanced: true,
                                allowEmpty: true,
                                defaultValue: 500
                            },
                            {
                                name: 'sessionTimeout',
                                pattern: 'interval',
                                type: 'input',
                                fieldType: 'input',
                                path: 'attributes.sessionTimeout',
                                isAdvanced: true,
                                allowEmpty: true,
                                placeholder: $i18next.t('functions:PLACEHOLDER.ENTER_DURATION', { lng: lng }),
                                defaultValue: '10s'
                            },
                            {
                                name: 'heartbeatInterval',
                                pattern: 'interval',
                                type: 'input',
                                fieldType: 'input',
                                path: 'attributes.heartbeatInterval',
                                isAdvanced: true,
                                allowEmpty: true,
                                placeholder: $i18next.t('functions:PLACEHOLDER.ENTER_DURATION', { lng: lng }),
                                defaultValue: '3s'
                            },
                            {
                                name: 'sequenceNumberCommitInterval',
                                pattern: 'interval',
                                type: 'input',
                                fieldType: 'input',
                                path: 'attributes.sequenceNumberCommitInterval',
                                isAdvanced: true,
                                allowEmpty: true,
                                placeholder: $i18next.t('functions:PLACEHOLDER.ENTER_DURATION', { lng: lng }),
                                defaultValue: '1s'
                            },
                            {
                                name: 'workerAllocatorName',
                                type: 'input',
                                fieldType: 'input',
                                isAdvanced: true,
                                allowEmpty: true
                            }
                        ]
                    },
                    {
                        id: 'kinesis',
                        name: 'Kinesis',
                        description: $i18next.t('common:TECH_PREVIEW', { lng: lng }),
                        tooltip: 'Kinesis',
                        tooltipOriginal: 'Kinesis',
                        tooltipPlacement: 'right',
                        fields: [
                            {
                                name: 'accessKeyID',
                                label: $i18next.t('functions:ACCESS_KEY_ID', { lng: lng }),
                                type: 'input',
                                fieldType: 'input',
                                path: 'attributes.accessKeyID',
                                placeholder: $i18next.t('functions:PLACEHOLDER.ENTER_ACCESS_KEY_ID', { lng: lng }),
                                allowEmpty: false
                            },
                            {
                                name: 'secretAccessKey',
                                type: 'input',
                                fieldType: 'input',
                                path: 'attributes.secretAccessKey',
                                allowEmpty: false
                            },
                            {
                                name: 'regionName',
                                type: 'input',
                                fieldType: 'input',
                                path: 'attributes.regionName',
                                allowEmpty: false
                            },
                            {
                                name: 'streamName',
                                type: 'input',
                                fieldType: 'input',
                                path: 'attributes.streamName',
                                allowEmpty: false
                            },
                            {
                                name: 'shards',
                                pattern: 'arrayStr',
                                type: 'input',
                                fieldType: 'input',
                                path: 'attributes.shards',
                                placeholder:
                                    $i18next.t('common:PLACEHOLDER.COMMA_DELIMITED_LIST_OF_STRINGS', { lng: lng }),
                                allowEmpty: false
                            },
                            {
                                name: 'workerAllocatorName',
                                type: 'input',
                                fieldType: 'input',
                                isAdvanced: true,
                                allowEmpty: true
                            },
                            {
                                name: 'url',
                                label: 'URL',
                                type: 'input',
                                fieldType: 'input',
                                isAdvanced: true,
                                allowEmpty: true
                            }
                        ]
                    },
                    {
                        id: 'mqtt',
                        name: 'MQTT',
                        description: $i18next.t('common:TECH_PREVIEW', { lng: lng }),
                        tooltip: 'MQTT',
                        tooltipOriginal: 'MQTT',
                        tooltipPlacement: 'right',
                        fields: [
                            {
                                name: 'url',
                                label: 'URL',
                                type: 'input',
                                fieldType: 'input',
                                allowEmpty: false
                            },
                            {
                                name: 'username',
                                type: 'input',
                                fieldType: 'input',
                                allowEmpty: true
                            },
                            {
                                name: 'password',
                                type: 'input',
                                fieldType: 'password',
                                allowEmpty: true,
                                autocomplete: 'new-password'
                            },
                            {
                                name: 'subscriptions',
                                values: {
                                    topic: {
                                        name: 'topic',
                                        type: 'input'
                                    },
                                    qos: {
                                        name: 'QoS',
                                        type: 'input',
                                        pattern: 'number'
                                    }
                                }
                            },
                            {
                                name: 'workerAllocatorName',
                                type: 'input',
                                fieldType: 'input',
                                isAdvanced: true,
                                allowEmpty: true
                            }
                        ]
                    }
                ],
                volume: self.isKubePlatform() ? [
                    {
                        id: 'v3io',
                        name: $i18next.t('functions:V3IO', { lng: lng }),
                        tooltip: $i18next.t('functions:TOOLTIP.V3IO', { lng: lng }),
                        moreInfoDescription: $i18next.t('functions:TOOLTIP.V3IO', { lng: lng })
                    },
                    {
                        id: 'secret',
                        name: $i18next.t('functions:SECRET', { lng: lng }),
                        tooltip: $i18next.t('functions:TOOLTIP.SECRET.HEAD', { lng: lng }) + ' ' +
                            $i18next.t('functions:TOOLTIP.SECRET.REST', { lng: lng }),
                        moreInfoDescription: 'A <a class="link" target="_blank" ' +
                            'href="https://kubernetes.io/docs/concepts/configuration/secret/">' +
                            $i18next.t('functions:TOOLTIP.SECRET.HEAD', { lng: lng }) + '</a> ' +
                            $i18next.t('functions:TOOLTIP.SECRET.REST', { lng: lng })
                    },
                    {
                        id: 'configMap',
                        name: $i18next.t('functions:CONFIGMAP', { lng: lng }),
                        tooltip: $i18next.t('functions:TOOLTIP.CONFIG_MAP.HEAD', { lng: lng }) + ' ' +
                            $i18next.t('functions:TOOLTIP.CONFIG_MAP.REST', { lng: lng }),
                        moreInfoDescription: 'A <a class="link" target="_blank" ' +
                            'href="https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-configmap/">' +
                            $i18next.t('functions:TOOLTIP.CONFIG_MAP.HEAD', { lng: lng }) + '</a> ' +
                            $i18next.t('functions:TOOLTIP.CONFIG_MAP.REST', { lng: lng })
                    },
                    {
                        id: 'persistentVolumeClaim',
                        name: $i18next.t('functions:PVC', { lng: lng })
                    }
                ] : [
                    {
                        id: 'hostPath',
                        name: $i18next.t('functions:HOST_PATH', { lng: lng })
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
         * Returns the status of the function for display.
         * @param {Object} aFunction - The function.
         * @returns {string} the status of the function for display.
         */
        function getDisplayStatus(aFunction) {
            var state = lodash.get(aFunction, 'status.state');
            var disabled = lodash.get(aFunction, 'spec.disable', false);

            var stateToMessageKey = {
                ready: disabled ? 'common:STANDBY' : 'common:RUNNING',
                error: 'common:ERROR',
                unhealthy: 'common:UNHEALTHY',
                imported: 'common:IMPORTED',
                scaledToZero: 'common:SCALED_TO_ZERO'
            };

            // in case there is no state - it means the function is not yet deployed
            var messageKey = lodash.isEmpty(state) ? 'functions:NOT_YET_DEPLOYED' :

                // default to building state in case the state is not any of the well-defined ones above
                lodash.defaultTo(stateToMessageKey[state], 'common:BUILDING');

            return $i18next.t(messageKey, { lng: i18next.lng });
        }

        /**
         * Returns a list of all steady function states.
         * @returns {Array.<string>} a list of all steady function states.
         */
        function getSteadyStates() {
            return ['ready', 'error', 'unhealthy', 'imported', 'scaledToZero'];
        }

        /**
         * Function actions
         * @returns {Object[]} - array of actions
         */
        function initFunctionActions() {
            var lng = i18next.language;

            return [
                {
                    label: $i18next.t('common:DELETE', { lng: lng }),
                    id: 'delete',
                    icon: 'igz-icon-trash',
                    active: true,
                    confirm: {}
                },
                {
                    label: $i18next.t('common:DUPLICATE', { lng: lng }),
                    id: 'duplicate',
                    icon: 'igz-icon-duplicate',
                    active: true
                },
                {
                    label: $i18next.t('common:EXPORT', { lng: lng }),
                    id: 'export',
                    icon: 'igz-icon-export-yml',
                    active: true
                },
                {
                    label: $i18next.t('functions:VIEW_YAML', { lng: lng }),
                    id: 'viewConfig',
                    icon: 'igz-icon-view-file',
                    active: true
                }
            ];
        }

        /**
         * Version actions
         * @returns {Object[]} - array of actions
         */
        function initVersionActions() {
            var lng = i18next.language;

            return [
                {
                    label: $i18next.t('common:EDIT', { lng: lng }),
                    id: 'edit',
                    icon: 'igz-icon-edit',
                    active: true
                },
                {
                    label: $i18next.t('common:DELETE', { lng: lng }),
                    id: 'delete',
                    icon: 'igz-icon-trash',
                    active: true,
                    confirm: {
                        message: $i18next.t('functions:DELETE_VERSIONS_CONFIRM', { lng: lng }),
                        yesLabel: $i18next.t('common:YES_DELETE', { lng: lng }),
                        noLabel: $i18next.t('common:CANCEL', { lng: lng }),
                        type: 'nuclio_alert'
                    }
                }
            ];
        }

        /**
         * Tests whether the function is currently deploying (meaning not in a steady state).
         * @param {Object} aFunction - The function to test.
         * @returns {boolean} `true` if the function is deploying, or `false` otherwise.
         */
        function isFunctionDeploying(aFunction) {
            var state = lodash.get(aFunction, 'status.state');
            return !lodash.includes(self.getSteadyStates(), state);
        }

        /**
         * Tests whether Nuclio runs on Kubernetes platform.
         * @returns {boolean} `true` in case Nuclio runs on Kubernetes platform, or `false` otherwise.
         */
        function isKubePlatform() {
            return lodash.get(ConfigService, 'nuclio.platformKind') === 'kube';
        }

        /**
         * Opens either the dialog with the error alert or the dialog with possibility to override the existing function
         * @param {Object} project
         * @param {Object} newFunction
         * @param {Object} existingFunction
         */
        function openFunctionConflictDialog(project, newFunction, existingFunction) {
            var lng = i18next.language;
            var existingFunctionProjectName = lodash.get(existingFunction,
                                                         ['metadata', 'labels', 'nuclio.io/project-name']);
            var currentProjectName = lodash.get(project, 'metadata.name');

            if (self.isKubePlatform() && existingFunctionProjectName !== currentProjectName) {
                DialogsService.alert($i18next.t('functions:FUNCTION_NAME_IS_USED_WARNING', { lng: lng }));
            } else {
                ngDialog.open({
                    template: '<ncl-override-function-dialog data-close-dialog="closeThisDialog(status)"' +
                        'data-project="ngDialogData.project" data-new-function="ngDialogData.newFunction"' +
                        'data-existing-function="ngDialogData.existingFunction"></ncl-override-function-dialog>',
                    plain: true,
                    data: {
                        project: project,
                        newFunction: newFunction,
                        existingFunction: existingFunction
                    },
                    className: 'ngdialog-theme-nuclio'
                });
            }
        }

        /**
         * Opens dialog with `Go to functions` button and `Deploy function from scratch` button
         * @returns {Promise}
         */
        function openDeployDeletedFunctionDialog(version, deploy) {
            ngDialog.open({
                template: '<ncl-deploy-deleted-function-dialog data-close-dialog="closeThisDialog()"' +
                    'data-version="ngDialogData.version" data-deploy="ngDialogData.deploy()"></ncl-deploy-deleted-function-dialog>',
                plain: true,
                data: {
                    version: version,
                    deploy: deploy
                },
                className: 'ngdialog-theme-nuclio'
            });
        }

        /**
         * Show pop-up with cancel button and overwrite function button
         * @returns {Promise}
         */
        function openVersionOverwriteDialog() {
            var lng = i18next.language;
            var message = $i18next.t('functions:OVERWRITE_FUNCTION_MESSAGE', { lng: lng });
            var cancelButtonCaption = $i18next.t('common:CANCEL', { lng: lng });
            var overrideButtonCaption = $i18next.t('common:OVERWRITE', { lng: lng });

            return ngDialog.openConfirm({
                template: '<div class="title">' + message + '</div>' +
                    '<div class="close-button igz-icon-close" data-ng-click="closeThisDialog()"></div>' +
                    '<div class="buttons">' +
                    '<button class="igz-button-just-text" data-ng-click="closeThisDialog()" >' +
                    cancelButtonCaption + '</button>' +
                    '<button class="igz-button-primary" data-ng-click="confirm(allowOverwrite)">' +
                    overrideButtonCaption + '</button></div>',
                plain: true,
                className: 'ngdialog-theme-iguazio alert-dialog function-deploy-stale'
            });
        }

        /**
         * Show pop-up with cancel button and delete function button
         * @returns {Promise}
         */
        function openVersionDeleteDialog() {
            var lng = i18next.language;
            var message = $i18next.t('functions:DELETE_FUNCTION_MESSAGE', { lng: lng });
            var cancelButtonCaption = $i18next.t('common:CANCEL', { lng: lng });
            var overrideButtonCaption = $i18next.t('common:DELETE', { lng: lng });

            return ngDialog.openConfirm({
                template: '<div class="title">' + message + '</div>' +
                    '<div class="close-button igz-icon-close" data-ng-click="closeThisDialog()"></div>' +
                    '<div class="buttons">' +
                    '<button class="igz-button-just-text" data-ng-click="closeThisDialog()" >' +
                    cancelButtonCaption + '</button>' +
                    '<button class="igz-button-remove" data-ng-click="confirm(allowDelete)">' +
                    overrideButtonCaption + '</button></div>',
                plain: true,
                className: 'ngdialog-theme-iguazio alert-dialog function-delete-stale'
            });
        }
    }
}());
