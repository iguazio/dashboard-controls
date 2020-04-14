describe('igzMultipleCheckboxes component: ', function () {
    var $compile;
    var $rootScope;
    var ctrl;
    var externalScope;
    var lodash;

    beforeEach(function () {

        // load needed modules
        module('iguazio.dashboard-controls');

        // load needed services
        inject(function (_$compile_, _$rootScope_, _lodash_) {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
            lodash = _lodash_;
        });

        var bindings = {
            ngModel: ['value1', 'value3'],
            options: [
                {
                    label: 'Label 1',
                    value: 'value1'
                },
                {
                    label: 'Label 2',
                    value: 'value2'
                },
                {
                    label: 'Label 3',
                    value: 'value3'
                },
                {
                    label: 'Label 4',
                    value: 'value4'
                }

            ],
            baseId: 'baseId',
            labelPath: 'label',
            valuePath: 'value',
            disabled: false
        };

        externalScope = angular.extend($rootScope.$new(), bindings);
        var element = '<igz-multiple-checkboxes data-ng-model="ngModel" ' +
                                               'data-options="options" ' +
                                               'data-label-path="{{labelPath}}" ' +
                                               'data-value-path="{{valuePath}}" ' +
                                               'data-base-id="{{baseId}}" ' +
                                               'data-disabled="disabled" ' +
                                               'required></igz-multiple-checkboxes>';
        var compiledElement = $compile(element)(externalScope);
        externalScope.$digest();

        ctrl = compiledElement.controller('igzMultipleCheckboxes');
    });

    afterEach(function () {
        $compile = null;
        $rootScope = null;
        ctrl = null;
        externalScope = null;
        lodash = null;
    });

    describe('$onInit(): ', function () {
        it('should set "ctrl.disabled" to the provided value', function () {
            externalScope.disabled = true;
            externalScope.$digest();
            expect(ctrl.disabled).toEqual(true);

            externalScope.disabled = false;
            externalScope.$digest();
            expect(ctrl.disabled).toEqual(false);
        });

        it('should set "ctrl.disabled" of "false" when not provided', function () {
            delete externalScope.disabled;
            expect(ctrl.disabled).toEqual(false);
        });
    });

    describe('ngModelCtrl.$isEmpty: ', function () {
        it('should turn on "required" error when array is empty', function () {
            externalScope.ngModel = [];
            externalScope.$digest();
            expect(ctrl.ngModelCtrl.$error.required).toBeTruthy();
        });

        it('should turn on "required" error when array is not empty', function () {
            externalScope.ngModel = ['value1'];
            externalScope.$digest();
            expect(ctrl.ngModelCtrl.$error.required).toBeFalsy();
        });
    });

    describe('ctrl.$onChanges: ', function () {
        describe('set "id" attribute for options: ', function () {
            it('should set option id as concatenation of the provided base id and the per-option id, if both "base-id" binding and per-option id are provided', function () {
                externalScope.baseId = 'newBaseId_';
                lodash.forEach(externalScope.options, function (value, index) {
                    value.id = 'myId' + index;
                });
                externalScope.$digest();
                expect(ctrl.optionList[1].id).toEqual('newBaseId_myId1');
            });

            it('should set option id as concatenation of the provided base id and the option index, if "base-id" binding is provided but per-option id is not', function () {
                externalScope.baseId = 'newBaseId_';
                externalScope.$digest();
                expect(ctrl.optionList[1].id).toEqual('newBaseId_1');
            });

            it('should set option id as concatenation of the _default_ base id and the per-option id, if "base-id" binding is not provided but per-option id is', function () {
                delete externalScope.baseId;
                lodash.forEach(externalScope.options, function (value, index) {
                    value.id = 'myId' + index;
                });
                externalScope.$digest();
                expect(ctrl.optionList[1].id).toEqual('myId1');
            });

            it('should set option id as concatenation of the _default_ base id and the option index, if both "base-id" binding and per-option id are not provided', function () {
                delete externalScope.baseId;
                externalScope.$digest();
                expect(lodash.startsWith(ctrl.optionList[1].id, 'igz_multiple_checkboxes_')).toBeTruthy();
                expect(lodash.endsWith(ctrl.optionList[1].id, '_1')).toBeTruthy();
            });
        });

        it('should construct internal "optionList" property according to provided "options" binding, and call "$render"', function () {
            var spy = spyOn(ctrl.ngModelCtrl, '$render').and.callThrough();
            var result = [
                {
                    id: 'baseId0',
                    label: 'Label 1',
                    value: 'value1',
                    checked: true,
                    disabled: false,
                    tooltipText: undefined,
                    enableTooltip: false,
                    filtered: undefined,
                    visibility: true
                },
                {
                    id: 'baseId1',
                    label: 'Label A',
                    value: 'valueA',
                    checked: false,
                    disabled: true,
                    tooltipText: undefined,
                    enableTooltip: false,
                    filtered: undefined,
                    visibility: true
                },
                {
                    id: 'baseId2',
                    label: 'Label B',
                    value: 'valueB',
                    checked: false,
                    disabled: false,
                    tooltipText: undefined,
                    enableTooltip: false,
                    filtered: undefined,
                    visibility: true
                }
            ];
            externalScope.options = [
                {
                    label: 'Label 1',
                    value: 'value1'
                },
                {
                    label: 'Label A',
                    value: 'valueA',
                    disabled: true
                },
                {
                    label: 'Label B',
                    value: 'valueB',
                    disabled: false
                }
            ];

            externalScope.$digest();

            expect(ctrl.optionList).toEqual(result);
            expect(spy).toHaveBeenCalled();
        });

        it('should use default label path (=\'label\') and value path (=\'value\') in case they are either not provided, are empty or are pointing to undefined path in option object', function () {
            var result = [
                {
                    id: 'baseId0',
                    label: 'Label 1',
                    value: 'value1',
                    checked: true,
                    disabled: false,
                    tooltipText: undefined,
                    enableTooltip: false,
                    filtered: undefined,
                    visibility: true
                },
                {
                    id: 'baseId1',
                    label: 'Label A',
                    value: 'valueA',
                    checked: false,
                    disabled: false,
                    tooltipText: undefined,
                    enableTooltip: false,
                    filtered: undefined,
                    visibility: true
                },
                {
                    id: 'baseId2',
                    label: 'Label B',
                    value: 'valueB',
                    checked: false,
                    disabled: false,
                    tooltipText: undefined,
                    enableTooltip: false,
                    filtered: undefined,
                    visibility: true
                }
            ];
            externalScope.options = [
                {
                    label: 'Label 1',
                    value: 'value1'
                },
                {
                    label: 'Label A',
                    value: 'valueA'
                },
                {
                    label: 'Label B',
                    value: 'valueB'
                }
            ];
            externalScope.labelPath = 'non.existent.path';
            externalScope.valuePath = 'non.existent.path';
            externalScope.$digest();
            expect(ctrl.optionList).toEqual(result);

            externalScope.labelPath = '';
            externalScope.valuePath = '';
            externalScope.$digest();
            expect(ctrl.optionList).toEqual(result);

            delete externalScope.labelPath;
            delete externalScope.valuePath;
            externalScope.$digest();
            expect(ctrl.optionList).toEqual(result);
        });

        it('should use "labelPath" and "valuePath" bindings to properly extract values and labels from "options" binding', function () {
            var result = [
                {
                    id: 'baseId0',
                    label: 'Label 1',
                    value: 'value1',
                    checked: true,
                    disabled: false,
                    tooltipText: undefined,
                    enableTooltip: false,
                    filtered: undefined,
                    visibility: true
                },
                {
                    id: 'baseId1',
                    label: 'Label A',
                    value: 'valueA',
                    checked: false,
                    disabled: false,
                    tooltipText: undefined,
                    enableTooltip: false,
                    filtered: undefined,
                    visibility: true
                },
                {
                    id: 'baseId2',
                    label: 'Label B',
                    value: 'valueB',
                    checked: false,
                    disabled: false,
                    tooltipText: undefined,
                    enableTooltip: false,
                    filtered: undefined,
                    visibility: true
                }
            ];
            angular.extend(externalScope, {
                options: [
                    {
                        attr: {
                            value: 'value1'
                        },
                        ui: {
                            label: 'Label 1'
                        }
                    },
                    {
                        attr: {
                            value: 'valueA'
                        },
                        ui: {
                            label: 'Label A'
                        }
                    },
                    {
                        attr: {
                            value: 'valueB'
                        },
                        ui: {
                            label: 'Label B'
                        }
                    }
                ],
                valuePath: 'attr.value',
                labelPath: 'ui.label'
            });

            externalScope.$digest();

            expect(ctrl.optionList).toEqual(result);
        });
    });

    describe('ngModelCtrl.$render: ', function () {
        it('on model change: should update the state (checked/unchecked) of the checkboxes in the internal option list and call "updateViewValue()"', function () {
            var spy = spyOn(ctrl, 'updateViewValue');
            var result = [
                {
                    id: 'baseId0',
                    label: 'Label 1',
                    value: 'value1',
                    checked: false,
                    disabled: false,
                    tooltipText: undefined,
                    enableTooltip: false,
                    filtered: undefined,
                    visibility: true
                },
                {
                    id: 'baseId1',
                    label: 'Label 2',
                    value: 'value2',
                    checked: true,
                    disabled: false,
                    tooltipText: undefined,
                    enableTooltip: false,
                    filtered: undefined,
                    visibility: true
                },
                {
                    id: 'baseId2',
                    label: 'Label 3',
                    value: 'value3',
                    checked: false,
                    disabled: false,
                    tooltipText: undefined,
                    enableTooltip: false,
                    filtered: undefined,
                    visibility: true
                },
                {
                    id: 'baseId3',
                    label: 'Label 4',
                    value: 'value4',
                    checked: false,
                    disabled: false,
                    tooltipText: undefined,
                    enableTooltip: false,
                    filtered: undefined,
                    visibility: true
                }

            ];
            externalScope.ngModel = ['value2'];
            externalScope.$digest();

            expect(ctrl.optionList).toEqual(result);
            // expect(spy).toHaveBeenCalled();
        });
    });

    describe('ctrl.updateViewValue(): ', function () {
        it('should set view-value with values of checked options, and model-value should be updated accordingly', function () {
            var spy = spyOn(ctrl.ngModelCtrl, '$setViewValue').and.callThrough();
            ctrl.updateViewValue();
            expect(ctrl.ngModelCtrl.$viewValue).toEqual(['value1', 'value3']);
            expect(spy).toHaveBeenCalledWith(['value1', 'value3'], 'change');
            expect(ctrl.ngModelCtrl.$modelValue).toEqual(['value1', 'value3']);

            // emulate user interaction
            ctrl.optionList = [
                {
                    label: 'Label 1',
                    value: 'value1',
                    checked: false
                },
                {
                    label: 'Label 2',
                    value: 'value2',
                    checked: true
                },
                {
                    label: 'Label 3',
                    value: 'value3',
                    checked: false
                },
                {
                    label: 'Label 4',
                    value: 'value4',
                    checked: false
                }
            ];
            ctrl.updateViewValue();
            expect(ctrl.ngModelCtrl.$viewValue).toEqual(['value2']);
            expect(spy).toHaveBeenCalledWith(['value2'], 'change');
            expect(ctrl.ngModelCtrl.$modelValue).toEqual(['value2']);
        });
    });

    // Should revisit this
    xdescribe('General: ', function () {
        it('should filter out string values in model that do not match the "value" property of any option, on model change', function () {
            externalScope.ngModel = ['value1', 'non-existent'];
            externalScope.$digest();
            expect(ctrl.ngModelCtrl.$viewValue).toEqual(['value1']);
            expect(ctrl.ngModelCtrl.$modelValue).toEqual(['value1']);
        });
    });
});
