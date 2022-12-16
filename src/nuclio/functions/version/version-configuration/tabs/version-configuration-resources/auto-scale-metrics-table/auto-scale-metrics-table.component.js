(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclAutoScaleMetricsTable', {
            bindings: {
                isFunctionDeploying: '&',
                version: '<'
            },
            templateUrl: 'nuclio/functions/version/version-configuration/tabs/version-configuration-resources/auto-scale-metrics-table/auto-scale-metrics-table.tpl.html',
            controller: NclAutoScaleMetricsTableController
        });

    function NclAutoScaleMetricsTableController($document, $element, $i18next, $rootScope, $scope, $timeout, lodash,
                                                ConfigService, FormValidationService) {
        var ctrl = this;

        ctrl.scaleMetrics = [];
        ctrl.supportedAutoScaleMetrics = [];

        ctrl.$onInit = onInit;

        ctrl.addNewScaleMetric = addNewScaleMetric;
        ctrl.handleScaleMetricsAction = handleScaleMetricsAction;
        ctrl.onChangeScaleMetricsData = onChangeScaleMetricsData;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            initScaleMetrics();
        }

        //
        // Public methods
        //

        /**
         * Adds new scale metric
         * param {Event} event - native event object
         */
        function addNewScaleMetric(event) {
            if (ctrl.isFunctionDeploying()) {
                return;
            }

            $timeout(function () {
                if (ctrl.scaleMetrics.length < 1 || lodash.last(ctrl.scaleMetrics).ui.isFormValid) {
                    ctrl.scaleMetrics.push({
                        name: '',
                        value: '',
                        type: 'int',
                        ui: {
                            editModeActive: true,
                            isFormValid: false,
                            name: 'scaleMetrics'
                        }
                    });

                    $rootScope.$broadcast('change-state-deploy-button', {component: 'scaleMetrics', isDisabled: true});
                    event.stopPropagation();
                }
            }, 50);
        }

        /**
         * Handler on Scale metrics action type
         * @param {string} actionType
         * @param {number} index - index of the scale metrics in the array
         */
        function handleScaleMetricsAction(actionType, index) {
            if (actionType === 'delete') {
                ctrl.scaleMetrics.splice(index, 1);
                generateScaleMetricsTypes();
            }
        }

        /**
         * Changes scale metrics data
         * @param {Object} scaleMetric
         * @param {number} index
         */
        function onChangeScaleMetricsData(scaleMetric, index) {
            ctrl.scaleMetrics[index] = scaleMetric;

            generateScaleMetricsTypes();
        }

        //
        // Private methods
        //

        /**
         * Generates scale metrics types list
         */
        function generateScaleMetricsTypes() {
            ctrl.supportedAutoScaleMetrics = lodash.chain(ConfigService)
                .get('nuclio.supportedAutoScaleMetrics', [])
                .map(function (metrics) {
                    return {
                        id: metrics.name,
                        name: metrics.name,
                        type: metrics.type,
                        tooltip: getTooltip(metrics.name),
                        disabled: ctrl.scaleMetrics.some(function (aMetric) {
                            return aMetric.name === metrics.name;
                        }),
                        originalKind: metrics.kind
                    }
                }).value();

            updateScaleMetrics();
        }

        /**
         * Returns appropriate tooltip for metrics list.
         * @param {string} metricName
         * @returns {string} tooltip
         */
        function getTooltip(metricName) {
            var tooltips = {
                cpu: 'CPU usage (%)',
                memory: 'Memory usage (%)',
                gpu: 'GPU usage (%)',
                nuclio_processor_stream_high_water_mark_processed_lag: 'Number of buffered events (lag in consumer/processing)',
                nuclio_processor_stream_high_water_mark_committed_lag: 'Number of buffered events that are not committed',
                nuclio_processor_worker_pending_allocation_current: 'Number of events pending worker allocation',
                nuclio_processor_worker_allocation_wait_duration_ms_sum: 'Wait time (ms) for worker allocation (averaged over a 30s window)'
            }

            return tooltips[metricName];
        }

        /**
         * Updates Scale metrics list
         */
        function updateScaleMetrics() {
            var isFormValid = true;
            var newScaleMetrics = [];

            lodash.forEach(ctrl.scaleMetrics, function (metrics) {
                if (!metrics.ui.isFormValid) {
                    isFormValid = false;
                }

                newScaleMetrics.push({
                    name: metrics.name,
                    type: metrics.type,
                    kind: metrics.kind,
                    targetValue: metrics.value
                });
            });

            if (ctrl.scaleMetrics.length > 0) {
                FormValidationService.validateAllFields(ctrl.autoScaleMetricsForm);

                $timeout(function () {
                    $rootScope.$broadcast('change-state-deploy-button', {
                        component: 'scaleMetrics',
                        isDisabled: !isFormValid || ctrl.autoScaleMetricsForm.$invalid
                    });
                });
            }

            lodash.set(ctrl.version, 'spec.autoScaleMetrics', newScaleMetrics);
        }

        /**
         * Initializes data for Auto scale metrics table
         */
        function initScaleMetrics() {
            ctrl.scaleMetrics = lodash.chain(ctrl.version)
                .get('spec.autoScaleMetrics', [])
                .map(function (metric) {
                    return {
                        name: metric.name,
                        value: metric.targetValue,
                        type: metric.type,
                        kind: metric.kind,
                        ui: {
                            editModeActive: false,
                            isFormValid: metric.targetValue > 0,
                            name: 'scaleMetrics'
                        }
                    };
                })
                .value();

            $timeout(function () {
                if (ctrl.autoScaleMetricsForm.$invalid) {
                    ctrl.autoScaleMetricsForm.$setSubmitted();
                    $rootScope.$broadcast('change-state-deploy-button', {component: 'scaleMetrics', isDisabled: true});
                }
            });

            generateScaleMetricsTypes();
        }
    }
}());
