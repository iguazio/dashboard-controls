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
        ctrl.windowSizePresets = [];

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
            initWindowSizePresets();
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
                        metricName: '',
                        displayType: 'int',
                        displayName: '',
                        threshold: '',
                        windowSize: '',
                        sourceType: '',
                        ui: {
                            editModeActive: true,
                            isFormValid: false,
                            name: 'scaleMetrics'
                        }
                    });

                    $rootScope.$broadcast('change-state-deploy-button', { component: 'scaleMetrics', isDisabled: true });
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

        /**
         * Initializes data for Auto scale metrics table
         */
        function initScaleMetrics() {
            ctrl.scaleMetrics = lodash.chain(ctrl.version)
                .get('spec.autoScaleMetrics', [])
                .map(function (metric) {
                    return {
                        metricName: metric.metricName,
                        sourceType: metric.sourceType,
                        displayType: metric.displayType,
                        displayName: getName(metric.metricName),
                        threshold: metric.threshold,
                        windowSize: metric.windowSize,
                        ui: {
                            editModeActive: false,
                            isFormValid: metric.threshold > 0,
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

        /**
         * Initializes window size presets for Auto scale metrics table
         */
        function initWindowSizePresets() {
            ctrl.windowSizePresets = lodash.chain(ConfigService)
                .get('nuclio.autoScaleMetrics.windowSizePresets', [])
                .map(function (preset) {
                    return {
                        id: preset,
                        windowSize: preset
                    }
                }).value();
        }

        //
        // Private methods
        //

        /**
         * Generates scale metrics types list
         */
        function generateScaleMetricsTypes() {
            ctrl.supportedAutoScaleMetrics = lodash.chain(ConfigService)
                .get('nuclio.autoScaleMetrics.metricPresets', [])
                .map(function (metric) {
                    return {
                        id: metric.metricName,
                        metricName: metric.metricName,
                        displayName: getName(metric.metricName),
                        displayType: metric.displayType,
                        tooltip: getTooltip(metric.metricName),
                        sourceType: metric.sourceType,
                        disabled: ctrl.scaleMetrics.some(function (aMetric) {
                            return aMetric.metricName === metric.metricName;
                        })
                    }
                }).value();

            updateScaleMetrics();
        }

        /**
         * Returns appropriate name for metrics list.
         * @param {string} metricName
         * @returns {string} name
         */
        function getName(metricName) {
            var name = metricName.replace(/_/g, ' ');

            return name.charAt(0).toUpperCase() + name.slice(1);
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

            return tooltips[metricName] || metricName;
        }

        /**
         * Updates Scale metrics list
         */
        function updateScaleMetrics() {
            var isFormValid = true;
            var newScaleMetrics = [];

            lodash.forEach(ctrl.scaleMetrics, function (metric) {
                if (!metric.ui.isFormValid) {
                    isFormValid = false;
                }

                newScaleMetrics.push({
                    metricName: metric.metricName,
                    sourceType: metric.sourceType,
                    displayType: metric.displayType,
                    windowSize: metric.windowSize,
                    threshold: metric.threshold
                });
            });

            if (ctrl.scaleMetrics.length > 0) {
                FormValidationService.validateAllFields(ctrl.autoScaleMetricsForm);
            }

            $timeout(function () {
                $rootScope.$broadcast('change-state-deploy-button', {
                    component: 'scaleMetrics',
                    isDisabled: !isFormValid || ctrl.autoScaleMetricsForm.$invalid
                });
            });

            lodash.set(ctrl.version, 'spec.autoScaleMetrics', newScaleMetrics);
        }
    }
}());
