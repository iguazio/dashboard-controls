describe('igzNumberInput component:', function () {
    var $componentController;
    var $rootScope;
    var ctrl;
    var stepSecondServiceObjectives;

    beforeEach(function () {
        module('iguazio.dashboard-controls');

        inject(function (_$componentController_, _$rootScope_) {
            $componentController = _$componentController_;
            $rootScope = _$rootScope_;
        });

        stepSecondServiceObjectives = {
            latencyTargetTimeLimit: 150
        };

        var unitValue = 'ms';
        var secondStepForm = {
            latencyTarget: {
                $setViewValue: angular.noop,
                $render: angular.noop
            }
        };
        var bindings = {
            formObject: secondStepForm,
            inputName: 'latencyTarget',
            isFocused: true,
            currentValue: stepSecondServiceObjectives.latencyTargetTimeLimit,
            placeholder: 'None',
            decimalNumber: 0,
            minValue: 0,
            valueStep: 10,
            suffixUnit: unitValue
        };
        var element = angular.element('<igz-number-input></igz-number-input>');
        spyOn(element, 'find').and.returnValue({focus: angular.noop});

        ctrl = $componentController('igzNumberInput', {$element: element}, bindings);
    });

    afterEach(function () {
        $componentController = null;
        $rootScope = null;
        ctrl = null;
        stepSecondServiceObjectives = null;
    });

    describe('initial state: ', function () {
        it('should be rendered with correct data', function () {
            ctrl.$onInit();

            expect(Number(ctrl.precision)).toBe(0);
            expect(ctrl.placeholder).toBe('None');
        });
    });

    describe('increaseValue(): ', function () {
        it('should increase current value when current value is empty', function () {
            setConfig(4, 10, 1);
            ctrl.increaseValue();
            expect(ctrl.currentValue).toEqual(4);

            setConfig(-8, -2, 1);
            ctrl.increaseValue();
            expect(ctrl.currentValue).toEqual(-2);

            setConfig(-4, 1, 2);
            ctrl.increaseValue();
            expect(ctrl.currentValue).toEqual(1);

            setConfig(2, 10, 3);
            ctrl.increaseValue();
            expect(ctrl.currentValue).toEqual(3);

            setConfig(0, 10, 1);
            ctrl.increaseValue();
            expect(ctrl.currentValue).toEqual(1);

            setConfig(-2, 2, 5);
            ctrl.increaseValue();
            expect(ctrl.currentValue).toEqual(2);

            setConfig(0, 1, 1);
            ctrl.increaseValue();
            expect(ctrl.currentValue).toEqual(1);
        });

        it('should increase current value when current value is settled', function () {
            setConfig(0, 10, 1, -3);
            ctrl.increaseValue();
            expect(ctrl.currentValue).toEqual(0);

            setConfig(4, 10, 1, 14);
            ctrl.increaseValue();
            expect(ctrl.currentValue).toEqual(14);

            setConfig(-4, 3, 2, 2);
            ctrl.increaseValue();
            expect(ctrl.currentValue).toEqual(3);

            setConfig(2, 10, 3, 1);
            ctrl.increaseValue();
            expect(ctrl.currentValue).toEqual(4);

            setConfig(0, 10, 1, 0);
            ctrl.increaseValue();
            expect(ctrl.currentValue).toEqual(1);

            setConfig(-2, 2, 5, -1);
            ctrl.increaseValue();
            expect(ctrl.currentValue).toEqual(2);
        });
    });

    describe('decreaseValue(): ', function () {
        it('should decrease current value when current value is empty', function () {
            setConfig(0, 10, 1);
            ctrl.decreaseValue();
            expect(ctrl.currentValue).toEqual(0);

            setConfig(4, 10, 1);
            ctrl.decreaseValue();
            expect(ctrl.currentValue).toEqual(4);

            setConfig(-8, -2, 1);
            ctrl.decreaseValue();
            expect(ctrl.currentValue).toEqual(-2);

            setConfig(-2, 10, 3);
            ctrl.decreaseValue();
            expect(ctrl.currentValue).toEqual(-2);

            setConfig(-8, -1, 2);
            ctrl.decreaseValue();
            expect(ctrl.currentValue).toEqual(-2);

            setConfig(-2, 2, 1);
            ctrl.decreaseValue();
            expect(ctrl.currentValue).toEqual(-1);

            setConfig(-2, 2, 5);
            ctrl.decreaseValue();
            expect(ctrl.currentValue).toEqual(-2);

            setConfig(-2, 2, 2);
            ctrl.decreaseValue();
            expect(ctrl.currentValue).toEqual(-2);
        });

        it('should decrease current value when current value is settled', function () {
            setConfig(0, 10, 1, -3);
            ctrl.decreaseValue();
            expect(ctrl.currentValue).toEqual(-3);

            setConfig(4, 10, 1, 14);
            ctrl.decreaseValue();
            expect(ctrl.currentValue).toEqual(10);

            setConfig(-4, -1, 2, -3);
            ctrl.decreaseValue();
            expect(ctrl.currentValue).toEqual(-4);

            setConfig(2, 10, 3, 12);
            ctrl.decreaseValue();
            expect(ctrl.currentValue).toEqual(9);

            setConfig(0, 10, 1, 5);
            ctrl.decreaseValue();
            expect(ctrl.currentValue).toEqual(4);

            setConfig(-2, 2, 5, 1);
            ctrl.decreaseValue();
            expect(ctrl.currentValue).toEqual(-2);
        });
    });

    describe('isShownUnit(): ', function () {
        it('should return true', function () {
            var componentScopeUnitValue;
            componentScopeUnitValue = ctrl.isShownUnit(ctrl.suffixUnit);
            expect(componentScopeUnitValue).toBeTruthy();
        });

        it('should return false', function () {
            var componentScopeUnitValue;
            ctrl.suffixUnit = undefined;
            componentScopeUnitValue = ctrl.isShownUnit(ctrl.suffixUnit);
            expect(componentScopeUnitValue).toBeFalsy();
        });
    });

    describe('checkInvalidation(): ', function () {
        beforeEach(function () {
            ctrl.formObject = {
                'input_name': {
                    $setValidity: angular.noop
                }
            };
            ctrl.inputName = 'input_name';
        });

        it('should call isShowFieldInvalidState method', function () {
            spyOn(ctrl, 'isShowFieldInvalidState').and.returnValue(true);

            ctrl.currentValue = '1';
            ctrl.checkInvalidation();

            expect(ctrl.isShowFieldInvalidState).toHaveBeenCalled();
        });

        it('should not call isShowFieldInvalidState method and should return true if ctrl.allowEmptyField is false', function () {
            spyOn(ctrl, 'isShowFieldInvalidState').and.returnValue(true);

            expect(ctrl.isShowFieldInvalidState).not.toHaveBeenCalled();
        });
    });

    function setConfig(min, max, step, cv) {
        ctrl.minValue = min;
        ctrl.maxValue = max;
        ctrl.valueStep = step;
        ctrl.currentValue = cv;

        ctrl.$onInit();
    }
});
