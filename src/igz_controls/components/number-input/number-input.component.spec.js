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
        it('should increase current value', function () {
            expect(ctrl.currentValue).toEqual(stepSecondServiceObjectives.latencyTargetTimeLimit);
            ctrl.increaseValue();
            expect(Number(ctrl.currentValue)).toEqual(160);
            ctrl.increaseValue();
            ctrl.increaseValue();
            ctrl.increaseValue();
            expect(Number(ctrl.currentValue)).toEqual(190);
        });
    });

    describe('decreaseValue(): ', function () {
        it('should decrease current value', function () {
            expect(ctrl.currentValue).toEqual(stepSecondServiceObjectives.latencyTargetTimeLimit);
            ctrl.decreaseValue();
            expect(Number(ctrl.currentValue)).toEqual(140);
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
});