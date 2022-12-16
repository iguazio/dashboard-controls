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

        inject(function (_$componentController_, _$rootScope_,  _$timeout_, _lodash_, _ConfigService_, _DialogsService_,
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
                            name: 'gpu',
                            targetValue: 23,
                            type: 'percentage',
                            kind: 'Resource'
                        },
                        {
                            name: 'cpu',
                            targetValue: 32,
                            type: 'int',
                            kind: 'Resource'
                        },
                        {
                            name: 'nuclio_name',
                            targetValue: 323,
                            type: 'int',
                            kind: 'Resource'
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

        lodash.set(ConfigService, 'nuclio.supportedAutoScaleMetrics', [
            {
                name: 'cpu',
                kind: 'Resource',
                type: 'percentage'
            },
            {
                name: 'memory',
                kind: 'Resource',
                type: 'percentage'
            }
        ]);

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
                    name: 'gpu',
                    value: 23,
                    type: 'percentage',
                    kind: 'Resource',
                    ui: {
                        editModeActive: false,
                        isFormValid: true,
                        name: 'scaleMetrics'
                    }
                },
                {
                    name: 'cpu',
                    value: 32,
                    type: 'int',
                    kind: 'Resource',
                    ui: {
                        editModeActive: false,
                        isFormValid: true,
                        name: 'scaleMetrics'
                    }
                },
                {
                    name: 'nuclio_name',
                    value: 323,
                    type: 'int',
                    kind: 'Resource',
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
                    name: 'gpu',
                    value: 23,
                    type: 'percentage',
                    kind: 'Resource',
                    ui: {
                        editModeActive: false,
                        isFormValid: true,
                        name: 'scaleMetrics'
                    }
                },
                {
                    name: 'cpu',
                    value: 32,
                    type: 'int',
                    kind: 'Resource',
                    ui: {
                        editModeActive: false,
                        isFormValid: true,
                        name: 'scaleMetrics'
                    }
                },
                {
                    name: 'nuclio_name',
                    value: 323,
                    type: 'int',
                    kind: 'Resource',
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
                    name: 'cpu',
                    type: 'percentage',
                    tooltip: 'CPU usage (%)',
                    disabled: true,
                    originalKind: 'Resource'
                },
                {
                    id: 'memory',
                    name: 'memory',
                    type: 'percentage',
                    tooltip: 'Memory usage (%)',
                    disabled: false,
                    originalKind: 'Resource'
                }
            ]);
        });

        it('should validate form if ctrl.scaleMetrics.length > 0', function () {
            ctrl.scaleMetrics = [
                {
                    name: 'gpu',
                    value: 23,
                    type: 'percentage',
                    kind: 'Resource',
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
                    name: 'gpu',
                    targetValue: 23,
                    type: 'percentage',
                    kind: 'Resource'
                },
                {
                    name: 'cpu',
                    targetValue: 32,
                    type: 'int',
                    kind: 'Resource'
                },
                {
                    name: 'nuclio_name',
                    targetValue: 323,
                    type: 'int',
                    kind: 'Resource'
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
                    name: 'gpu',
                    value: 23,
                    type: 'percentage',
                    kind: 'Resource',
                    ui: {
                        editModeActive: false,
                        isFormValid: true,
                        name: 'scaleMetrics'
                    }
                },
                {
                    name: 'cpu',
                    value: 32,
                    type: 'int',
                    kind: 'Resource',
                    ui: {
                        editModeActive: false,
                        isFormValid: true,
                        name: 'scaleMetrics'
                    }
                },
                {
                    name: 'nuclio_name',
                    value: 323,
                    type: 'int',
                    kind: 'Resource',
                    ui: {
                        editModeActive: false,
                        isFormValid: true,
                        name: 'scaleMetrics'
                    }
                },
                {
                    name: '',
                    value: '',
                    type: 'int',
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
                    name: 'gpu',
                    value: 23,
                    type: 'percentage',
                    kind: 'Resource',
                    ui: {
                        editModeActive: false,
                        isFormValid: true,
                        name: 'scaleMetrics'
                    }
                },
                {
                    name: 'cpu',
                    value: 32,
                    type: 'int',
                    kind: 'Resource',
                    ui: {
                        editModeActive: false,
                        isFormValid: true,
                        name: 'scaleMetrics'
                    }
                },
                {
                    name: 'nuclio_name',
                    value: 323,
                    type: 'int',
                    kind: 'Resource',
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
                    name: 'gpu',
                    value: 23,
                    type: 'percentage',
                    kind: 'Resource',
                    ui: {
                        editModeActive: false,
                        isFormValid: true,
                        name: 'scaleMetrics'
                    }
                },
                {
                    name: 'cpu',
                    value: 32,
                    type: 'int',
                    kind: 'Resource',
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
                    name: 'cpu',
                    type: 'percentage',
                    tooltip: 'CPU usage (%)',
                    disabled: true,
                    originalKind: 'Resource'
                },
                {
                    id: 'memory',
                    name: 'memory',
                    type: 'percentage',
                    tooltip: 'Memory usage (%)',
                    disabled: false,
                    originalKind: 'Resource'
                }
            ]);
        })
    });

    describe('onChangeScaleMetricsData()', function () {
        it('should edit metric with provided index and change supportedAutoScaleMetrics disabled fields', function () {
            var newMetric = {
                name: 'memory',
                value: 52,
                type: 'int',
                kind: 'Resource',
                ui: {
                    editModeActive: false,
                    isFormValid: true,
                    name: 'scaleMetrics'
                }
            };
            ctrl.onChangeScaleMetricsData(newMetric, 1);

            expect(ctrl.scaleMetrics).toEqual([
                {
                    name: 'gpu',
                    value: 23,
                    type: 'percentage',
                    kind: 'Resource',
                    ui: {
                        editModeActive: false,
                        isFormValid: true,
                        name: 'scaleMetrics'
                    }
                },
                {
                    name: 'memory',
                    value: 52,
                    type: 'int',
                    kind: 'Resource',
                    ui: {
                        editModeActive: false,
                        isFormValid: true,
                        name: 'scaleMetrics'
                    }
                },
                {
                    name: 'nuclio_name',
                    value: 323,
                    type: 'int',
                    kind: 'Resource',
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
                    name: 'cpu',
                    type: 'percentage',
                    tooltip: 'CPU usage (%)',
                    disabled: false,
                    originalKind: 'Resource'
                },
                {
                    id: 'memory',
                    name: 'memory',
                    type: 'percentage',
                    tooltip: 'Memory usage (%)',
                    disabled: true,
                    originalKind: 'Resource'
                }
            ]);
        })
    });
});