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
describe('nclAutoScaleMetricsTable component:', function () {
    var $componentController;
    var $event;
    var $rootScope;
    var $timeout;
    var ConfigService;
    var DialogsService;
    var FormValidationService;
    var ctrl;
    var lodash;

    beforeEach(function () {
        module('iguazio.dashboard-controls');

        inject(function (_$componentController_, _$rootScope_, _$timeout_, _lodash_, _ConfigService_, _DialogsService_,
                         _FormValidationService_) {
            $componentController = _$componentController_;
            $rootScope = _$rootScope_;
            $timeout = _$timeout_;
            lodash = _lodash_;
            ConfigService = _ConfigService_;
            FormValidationService = _FormValidationService_;
            DialogsService = _DialogsService_;
        });

        var element = '<ncl-auto-scale-metrics-table></ncl-auto-scale-metrics-table>';
        var bindings = {
            version: {
                spec: {
                    autoScaleMetrics: [
                        {
                            metricName: 'gpu',
                            threshold: 23,
                            displayType: 'percentage',
                            sourceType: 'Resource',
                            windowSize: '2m'
                        },
                        {
                            metricName: 'cpu',
                            threshold: 32,
                            displayType: 'int',
                            sourceType: 'Resource',
                            windowSize: '1m'
                        },
                        {
                            metricName: 'nuclio_name',
                            threshold: 323,
                            displayType: 'int',
                            sourceType: 'Resource',
                            windowSize: '2m'
                        }
                    ]
                }
            },
            isFunctionDeploying: function () {
                return false;
            }
        }
        ctrl = $componentController('nclAutoScaleMetricsTable', {$element: element}, bindings);

        ctrl.autoScaleMetricsForm = {
            name: {
                $setValidity: angular.noop
            },
            $valid: false,
            $invalid: false,
            $setSubmitted: function () {
                ctrl.autoScaleMetricsForm.$submitted = true;
            },
            $submitted: false
        };

        $event = {
            stopPropagation: angular.noop
        };

        lodash.set(ConfigService, 'nuclio.autoScaleMetrics', {
            metricPresets: [
                {
                    metricName: 'cpu',
                    sourceType: 'Resource',
                    displayType: 'percentage'
                },
                {
                    metricName: 'memory',
                    sourceType: 'Resource',
                    displayType: 'percentage'
                }
            ],
            windowSizePresets: [
                '1m',
                '2m'
            ]
        });

        ctrl.$onInit();
    });

    afterEach(function () {
        $componentController = null;
        $event = null;
        $rootScope = null;
        $timeout = null;
        ConfigService = null;
        DialogsService = null;
        FormValidationService = null;
        ctrl = null;
        lodash = null;
    });

    describe('onInit(): ', function () {
        it('should init ctrl.scaleMetrics list, and if form is invalid send broadcast and submit it', function () {
            ctrl.autoScaleMetricsForm.$invalid = true;

            spyOn(ctrl.autoScaleMetricsForm, '$setSubmitted').and.callThrough();
            spyOn($rootScope, '$broadcast').and.callThrough();

            $timeout.flush();

            expect(ctrl.scaleMetrics).toEqual([
                {
                    metricName: 'gpu',
                    threshold: 23,
                    displayType: 'percentage',
                    sourceType: 'Resource',
                    windowSize: '2m',
                    ui: {
                        editModeActive: false,
                        isFormValid: true,
                        name: 'scaleMetrics'
                    }
                },
                {
                    metricName: 'cpu',
                    threshold: 32,
                    displayType: 'int',
                    sourceType: 'Resource',
                    windowSize: '1m',
                    ui: {
                        editModeActive: false,
                        isFormValid: true,
                        name: 'scaleMetrics'
                    }
                },
                {
                    metricName: 'nuclio_name',
                    threshold: 323,
                    displayType: 'int',
                    sourceType: 'Resource',
                    windowSize: '2m',
                    ui: {
                        editModeActive: false,
                        isFormValid: true,
                        name: 'scaleMetrics'
                    }
                }
            ]);
            expect(ctrl.autoScaleMetricsForm.$setSubmitted).toHaveBeenCalled();
            expect($rootScope.$broadcast).toHaveBeenCalledWith('change-state-deploy-button', {
                component: 'scaleMetrics',
                isDisabled: true
            });
        });

        it('should init ctrl.scaleMetrics list, and if form is valid don`t send broadcast and don`t submit it', function () {
            ctrl.autoScaleMetricsForm.$invalid = false;

            spyOn(ctrl.autoScaleMetricsForm, '$setSubmitted').and.callThrough();
            spyOn($rootScope, '$broadcast').and.callThrough();

            $timeout.flush();

            expect(ctrl.scaleMetrics).toEqual([
                {
                    metricName: 'gpu',
                    threshold: 23,
                    displayType: 'percentage',
                    sourceType: 'Resource',
                    windowSize: '2m',
                    ui: {
                        editModeActive: false,
                        isFormValid: true,
                        name: 'scaleMetrics'
                    }
                },
                {
                    metricName: 'cpu',
                    threshold: 32,
                    displayType: 'int',
                    sourceType: 'Resource',
                    windowSize: '1m',
                    ui: {
                        editModeActive: false,
                        isFormValid: true,
                        name: 'scaleMetrics'
                    }
                },
                {
                    metricName: 'nuclio_name',
                    threshold: 323,
                    displayType: 'int',
                    sourceType: 'Resource',
                    windowSize: '2m',
                    ui: {
                        editModeActive: false,
                        isFormValid: true,
                        name: 'scaleMetrics'
                    }
                }
            ]);
            expect(ctrl.autoScaleMetricsForm.$setSubmitted).not.toHaveBeenCalled();
            expect($rootScope.$broadcast).not.toHaveBeenCalledWith('change-state-deploy-button', {
                component: 'scaleMetrics',
                isDisabled: true
            });
        });

        it('should init ctrl.supportedAutoScaleMetrics list and set as disabled if metric is already used', function () {
            expect(ctrl.supportedAutoScaleMetrics).toEqual([
                {
                    id: 'cpu',
                    metricName: 'cpu',
                    displayType: 'percentage',
                    tooltip: 'CPU usage (%)',
                    sourceType: 'Resource',
                    disabled: true
                },
                {
                    id: 'memory',
                    metricName: 'memory',
                    displayType: 'percentage',
                    tooltip: 'Memory usage (%)',
                    sourceType: 'Resource',
                    disabled: false
                }
            ]);
        });

        it('should init ctrl.windowSizePresets list', function () {
            expect(ctrl.windowSizePresets).toEqual([
                {
                    id: '1m',
                    windowSize: '1m'
                },
                {
                    id: '2m',
                    windowSize: '2m'
                }
            ]);
        });

        it('should validate form if ctrl.scaleMetrics.length > 0', function () {
            ctrl.scaleMetrics = [
                {
                    metricName: 'gpu',
                    threshold: 23,
                    displayType: 'percentage',
                    sourceType: 'Resource',
                    ui: {
                        editModeActive: false,
                        isFormValid: false,
                        name: 'scaleMetrics'
                    }
                }
            ];

            spyOn(FormValidationService, 'validateAllFields').and.callThrough();

            expect(FormValidationService.validateAllFields).not.toHaveBeenCalled();
        });

        it('should set "autoScaleMetrics" to ctrl.version', function () {
            expect(ctrl.version.spec.autoScaleMetrics).toEqual([
                {
                    metricName: 'gpu',
                    threshold: 23,
                    displayType: 'percentage',
                    sourceType: 'Resource',
                    windowSize: '2m'
                },
                {
                    metricName: 'cpu',
                    threshold: 32,
                    displayType: 'int',
                    sourceType: 'Resource',
                    windowSize: '1m'
                },
                {
                    metricName: 'nuclio_name',
                    threshold: 323,
                    displayType: 'int',
                    sourceType: 'Resource',
                    windowSize: '2m'
                }
            ]);
        });
    });

    describe('addNewScaleMetric()', function () {
        it('should add new scale metric if function is not deploying', function () {
            ctrl.addNewScaleMetric($event);
            $timeout.flush();

            expect(ctrl.scaleMetrics).toEqual([
                {
                    metricName: 'gpu',
                    threshold: 23,
                    displayType: 'percentage',
                    sourceType: 'Resource',
                    windowSize: '2m',
                    ui: {
                        editModeActive: false,
                        isFormValid: true,
                        name: 'scaleMetrics'
                    }
                },
                {
                    metricName: 'cpu',
                    threshold: 32,
                    displayType: 'int',
                    sourceType: 'Resource',
                    windowSize: '1m',
                    ui: {
                        editModeActive: false,
                        isFormValid: true,
                        name: 'scaleMetrics'
                    }
                },
                {
                    metricName: 'nuclio_name',
                    threshold: 323,
                    displayType: 'int',
                    sourceType: 'Resource',
                    windowSize: '2m',
                    ui: {
                        editModeActive: false,
                        isFormValid: true,
                        name: 'scaleMetrics'
                    }
                },
                {
                    metricName: '',
                    displayType: 'int',
                    threshold: '',
                    windowSize: '',
                    sourceType: '',
                    ui: {
                        editModeActive: true,
                        isFormValid: false,
                        name: 'scaleMetrics'
                    }
                }
            ]);
        });

        it('should not add new metric if function is deploying', function () {
            ctrl.isFunctionDeploying = function () {
                return true;
            };
            ctrl.addNewScaleMetric($event);

            expect(ctrl.scaleMetrics).toEqual([
                {
                    metricName: 'gpu',
                    threshold: 23,
                    displayType: 'percentage',
                    sourceType: 'Resource',
                    windowSize: '2m',
                    ui: {
                        editModeActive: false,
                        isFormValid: true,
                        name: 'scaleMetrics'
                    }
                },
                {
                    metricName: 'cpu',
                    threshold: 32,
                    displayType: 'int',
                    sourceType: 'Resource',
                    windowSize: '1m',
                    ui: {
                        editModeActive: false,
                        isFormValid: true,
                        name: 'scaleMetrics'
                    }
                },
                {
                    metricName: 'nuclio_name',
                    threshold: 323,
                    displayType: 'int',
                    sourceType: 'Resource',
                    windowSize: '2m',
                    ui: {
                        editModeActive: false,
                        isFormValid: true,
                        name: 'scaleMetrics'
                    }
                }
            ]);
        });
    });

    describe('handleScaleMetricsAction()', function () {
        it('should delete metric with provided index and set disabled as false if supportedAutoScaleMetric is not already used', function () {
            ctrl.handleScaleMetricsAction('delete', 2);

            expect(ctrl.scaleMetrics).toEqual([
                {
                    metricName: 'gpu',
                    threshold: 23,
                    displayType: 'percentage',
                    sourceType: 'Resource',
                    windowSize: '2m',
                    ui: {
                        editModeActive: false,
                        isFormValid: true,
                        name: 'scaleMetrics'
                    }
                },
                {
                    metricName: 'cpu',
                    threshold: 32,
                    displayType: 'int',
                    sourceType: 'Resource',
                    windowSize: '1m',
                    ui: {
                        editModeActive: false,
                        isFormValid: true,
                        name: 'scaleMetrics'
                    }
                }
            ]);
            expect(ctrl.supportedAutoScaleMetrics).toEqual([
                {
                    id: 'cpu',
                    metricName: 'cpu',
                    displayType: 'percentage',
                    tooltip: 'CPU usage (%)',
                    sourceType: 'Resource',
                    disabled: true
                },
                {
                    id: 'memory',
                    metricName: 'memory',
                    displayType: 'percentage',
                    tooltip: 'Memory usage (%)',
                    sourceType: 'Resource',
                    disabled: false
                }
            ]);
        })
    });

    describe('onChangeScaleMetricsData()', function () {
        it('should edit metric with provided index and change supportedAutoScaleMetrics disabled fields', function () {
            var newMetric = {
                metricName: 'memory',
                threshold: 52,
                displayType: 'int',
                sourceType: 'Resource',
                windowSize: '3m',
                ui: {
                    editModeActive: false,
                    isFormValid: true,
                    name: 'scaleMetrics'
                }
            };
            ctrl.onChangeScaleMetricsData(newMetric, 1);

            expect(ctrl.scaleMetrics).toEqual([
                {
                    metricName: 'gpu',
                    threshold: 23,
                    displayType: 'percentage',
                    sourceType: 'Resource',
                    windowSize: '2m',
                    ui: {
                        editModeActive: false,
                        isFormValid: true,
                        name: 'scaleMetrics'
                    }
                },
                {
                    metricName: 'memory',
                    threshold: 52,
                    displayType: 'int',
                    sourceType: 'Resource',
                    windowSize: '3m',
                    ui: {
                        editModeActive: false,
                        isFormValid: true,
                        name: 'scaleMetrics'
                    }
                },
                {
                    metricName: 'nuclio_name',
                    threshold: 323,
                    displayType: 'int',
                    sourceType: 'Resource',
                    windowSize: '2m',
                    ui: {
                        editModeActive: false,
                        isFormValid: true,
                        name: 'scaleMetrics'
                    }
                }
            ]);
            expect(ctrl.supportedAutoScaleMetrics).toEqual([
                {
                    id: 'cpu',
                    metricName: 'cpu',
                    displayType: 'percentage',
                    tooltip: 'CPU usage (%)',
                    sourceType: 'Resource',
                    disabled: false
                },
                {
                    id: 'memory',
                    metricName: 'memory',
                    displayType: 'percentage',
                    tooltip: 'Memory usage (%)',
                    sourceType: 'Resource',
                    disabled: true
                }
            ]);
        })
    });
});
