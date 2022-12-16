describe('nclAutoScaleMetricsInput component:', function () {
    var $componentController;
    var $rootScope;
    var $scope;
    var DialogsService;
    var ctrl;
    var document;

    beforeEach(function () {
        module('iguazio.dashboard-controls');

        inject(function (_$componentController_, _$rootScope_, _$document_, _DialogsService_) {
            $componentController = _$componentController_;
            $rootScope = _$rootScope_;
            document = _$document_;
            DialogsService = _DialogsService_;
        });

        var element = '<ncl-auto-scale-metrics-input></ncl-auto-scale-metrics-input>';
        var bindings = {
            rowData: {
                name: 'gpu',
                value: 23,
                type: 'int',
                kind: 'Resource',
                ui: {
                    editModeActive: false
                }
            },
            actionHandlerCallback: angular.noop,
            itemIndex: 1,
            changeDataCallback: angular.noop
        };

        $scope = $rootScope.$new();
        ctrl = $componentController('nclAutoScaleMetricsInput', {$element: element, $scope: $scope}, bindings);

        ctrl.autoScaleMetricForm = {
            $valid: true,
            $setPristine: angular.noop,
            $getControls: function () {
                return [
                    {
                        $setDirty: angular.noop,
                        $validate: angular.noop
                    }
                ]
            }
        };

        ctrl.$onInit();
    });

    afterEach(function () {
        $componentController = null;
        $rootScope = null;
        DialogsService = null;
        ctrl = null;
        document = null;
        $scope = null;
    });

    describe('onInit(): ', function () {
        it('should set ctrl.editMode to false', function () {
            expect(ctrl.editMode).toBeFalsy();
        });

        it('should set ctrl.metricData', function () {
            expect(ctrl.metricData).toEqual({
                name: 'gpu',
                value: 23,
                type: 'int',
                kind: 'Resource',
                ui: {
                    editModeActive: false
                }
            });
        });

        it('should set ctrl.isDisabled to false', function () {
            expect(ctrl.isDisabled).toBeFalsy();
        });

        it('should init ctrl.sliderConfig', function () {
            expect(ctrl.sliderConfig).toEqual({
                value: 23,
                valueLabel: 23,
                pow: 0,
                unitLabel: '%',
                labelHelpIcon: false,
                options: {
                    disabled: false,
                    floor: 1,
                    id: 'scaleMetrics',
                    ceil: 100,
                    step: 1,
                    showSelectionBar: true
                }
            });
        });
    });

    describe('onDestroy():', function () {
        it('should remove handler', function () {
            spyOn(document, 'off');

            ctrl.$onDestroy();

            expect(document.off).toHaveBeenCalledTimes(2);
        });
    });

    describe('postLink():', function () {
        it('should add handler and call $setPristine method', function () {
            spyOn(ctrl.autoScaleMetricForm, '$setPristine');
            spyOn(document, 'on');

            ctrl.$postLink();

            expect(document.on).toHaveBeenCalled();
            expect(ctrl.autoScaleMetricForm.$setPristine).toHaveBeenCalled();
        });
    });

    describe('getSelectedItem(): ', function () {
        it('should return selectedItem', function () {
            expect(ctrl.getSelectedItem()).toEqual({
                name: 'gpu',
                value: 23,
                type: 'int',
                kind: 'Resource',
                ui: {
                    editModeActive: false
                }
            });
        });

        it('should return "" if item isn`t selected', function () {
            ctrl.metricData.name = "";

            expect(ctrl.getSelectedItem()).toEqual("");
        });
    });

    describe('onClickAction(): ', function () {
        it('should show confirm dialog, call actionHandlerCallback and set ctrl.editMode to false if action.confirm is not empty', function () {
            var action = {
                label: 'delete',
                id: 'delete',
                icon: 'igz-icon-trash',
                active: true,
                confirm: {
                    message: 'message',
                    yesLabel: 'yes',
                    noLabel: 'cancel',
                    type: 'critical_alert'
                }
            };

            spyOn(ctrl, 'actionHandlerCallback');

            ctrl.onClickAction(action)

            spyOn(DialogsService, 'confirm').and.callFake(function () {
                expect(ctrl.actionHandlerCallback).toHaveBeenCalledWith({
                    actionType: 'delete',
                    index: ctrl.itemIndex
                });
            });

            expect(ctrl.editMode).toBeFalsy();
        });

        it('should call actionHandlerCallback and set ctrl.editMode to false if action.confirm is empty', function () {
            var action = {
                label: 'delete',
                id: 'delete',
                icon: 'igz-icon-trash',
                active: true
            };

            spyOn(ctrl, 'actionHandlerCallback');
            spyOn(DialogsService, 'confirm').and.callThrough();

            ctrl.onClickAction(action)

            expect(DialogsService.confirm).not.toHaveBeenCalled();
            expect(ctrl.actionHandlerCallback).toHaveBeenCalledWith({
                actionType: 'delete',
                index: ctrl.itemIndex
            });
            expect(ctrl.editMode).toBeFalsy();
        });
    });

    describe('onEditInput()', function () {
        it('should set editMode as true, and add handler', function () {
            spyOn(document, 'on');

            ctrl.onEditInput();

            expect(ctrl.editMode).toBeTruthy();
            expect(document.on).toHaveBeenCalledTimes(2);
        });
    });

    describe('handleMetricChange(): ', function () {
        it('should change ctrl.metricData and ctrl.sliderConfig if type has changed', function () {
            ctrl.handleMetricChange({
                type: 'percentage',
                name: 'nuclio_name',
                originalKind: 'resources'
            });

            expect(ctrl.metricData).toEqual({
                kind: 'resources',
                name: 'nuclio_name',
                value: 1,
                type: 'percentage',
                ui: {
                    editModeActive: false
                }
            });
            expect(ctrl.sliderConfig).toEqual({
                value: 1,
                valueLabel: 1,
                pow: 0,
                unitLabel: '%',
                labelHelpIcon: false,
                options: {
                    disabled: false,
                    floor: 1,
                    id: 'scaleMetrics',
                    ceil: 100,
                    step: 1,
                    showSelectionBar: true
                }
            });
        });

        it('should change ctrl.metricData and ctrl.sliderConfig if type has not changed', function () {
            ctrl.handleMetricChange({
                type: 'int',
                name: 'nuclio_name',
                originalKind: 'resources'
            });

            expect(ctrl.metricData).toEqual({
                kind: 'resources',
                name: 'nuclio_name',
                value: 23,
                type: 'int',
                ui: {
                    editModeActive: false
                }
            });
        });
    });

    describe('inputValueCallback(): ', function () {
        it('should change value in ctrl.metricsData and call saveChanges method, where should change ctrl.metricData,' +
            'ctrl.editMode and remove handler (if ctrl.autoScaleMetricForm is valid)', function () {
            ctrl.autoScaleMetricForm.$valid = true;

            spyOn($scope, '$evalAsync').and.callThrough();
            spyOn(document, 'off');
            spyOn(ctrl, 'changeDataCallback');

            ctrl.inputValueCallback(30, 'value');
            $scope.$digest();

            expect(ctrl.metricData.value).toEqual(30);
            expect(ctrl.metricData.ui.editModeActive).toBeFalsy();
            expect(ctrl.metricData.ui.isFormValid).toBeTruthy();
            expect(ctrl.editMode).toBeFalsy();
            expect(document.off).toHaveBeenCalledTimes(2);
            expect(ctrl.changeDataCallback).toHaveBeenCalledWith({
                newData: {
                    name: 'gpu',
                    value: 30,
                    type: 'int',
                    kind: 'Resource',
                    ui: {
                        editModeActive: false,
                        isFormValid: true
                    }
                },
                index: 1
            });
        });

        it('should change value in ctrl.metricsData and call saveChanges method, where should change ctrl.metricData,' +
            '(if ctrl.autoScaleMetricForm is not valid)', function () {
            ctrl.autoScaleMetricForm.$valid = false;

            spyOn($scope, '$evalAsync').and.callThrough();
            spyOn(document, 'off');
            spyOn(ctrl, 'changeDataCallback');

            ctrl.inputValueCallback(30, 'value');
            $scope.$digest();

            expect(ctrl.metricData.value).toEqual(30);
            expect(ctrl.metricData.ui.editModeActive).toBeTruthy();
            expect(ctrl.metricData.ui.isFormValid).toBeFalsy();
            expect(document.off).not.toHaveBeenCalled();
            expect(ctrl.changeDataCallback).toHaveBeenCalledWith({
                newData: {
                    name: 'gpu',
                    value: 30,
                    type: 'int',
                    kind: 'Resource',
                    ui: {
                        editModeActive: true,
                        isFormValid: false
                    }
                },
                index: 1
            });
        });
    });

    describe('sliderInputCallback(): ', function () {
        it('should change value in ctrl.metricsData', function () {
            ctrl.sliderInputCallback(30, 'value');

            expect(ctrl.metricData.value).toEqual(30);
        });

        it('should change value in ctrl.metricsData if newValue is null', function () {
            ctrl.sliderInputCallback(null, 'value');

            expect(ctrl.metricData.value).toEqual(100);
        });
    });
});