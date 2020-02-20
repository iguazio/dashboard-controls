describe('igzValidatingInputField component:', function () {
    var $componentController;
    var $timeout;
    var ctrl;
    var defaultInputModelOptions;

    beforeEach(function () {
        module('iguazio.dashboard-controls');

        inject(function (_$componentController_, _$timeout_) {
            $componentController = _$componentController_;
            $timeout = _$timeout_;
        });

        defaultInputModelOptions = {
            updateOn: 'default blur',
            debounce: {
                'default': 250,
                '*': 0
            },
            allowInvalid: true
        };

        var formObject = {
            attributeName: {
                $viewValue: 'some value',
                $setValidity: angular.noop,
                $setTouched: angular.noop
            }
        };
        var bindings = {
            formObject: formObject,
            inputModelOptions: {},
            inputName: 'attributeName',
            inputValue: 'some input value',
            itemBlurCallback: angular.noop,
            itemFocusCallback: angular.noop,
            isDataRevert: 'true',
            isFocused: 'true',
            updateDataCallback: angular.noop,
            updateDataField: angular.noop,
            validationMaxLength: '15'
        };
        var element = '<igz-validating-input-field></igz-validating-input-field>';

        ctrl = $componentController('igzValidatingInputField', {$element: element}, bindings);
        ctrl.$onInit();
    });

    afterEach(function () {
        $componentController = null;
        $timeout = null;
        ctrl = null;
        defaultInputModelOptions = null;
    });

    describe('initial state:', function () {
        it('should be rendered with correct data', function () {
            expect(ctrl.inputModelOptions).toEqual(defaultInputModelOptions);
            expect(ctrl.inputFocused).toBeTruthy();
            expect(ctrl.spellcheck).toBeTruthy();
            expect(ctrl.data).toBe(ctrl.inputValue)
        });
    });

    describe('$onChanges():', function () {
        it('should set new value to ctrl.data', function () {
            var changes = {
                inputValue: {
                    currentValue: 'some new value',
                    isFirstChange: function () {
                        return false;
                    }
                }
            };
            ctrl.$onChanges(changes);

            expect(ctrl.data).toEqual(changes.inputValue.currentValue);
        })
    });

    describe('getRemainingSymbolsCounter():', function () {
        it('should return difference between $viewValue length and validationMaxLength', function () {
            expect(ctrl.getRemainingSymbolsCounter()).toBe('5')
        })
    });

    describe('focusInput():', function () {
        it('should call ctrl.itemFocusCallback', function () {
            var spy = spyOn(ctrl, 'itemFocusCallback');

            ctrl.validationRules = [
                {
                    label: 'Alphanumeric characters (a–z, A–Z, 0–9)',
                    pattern: /^[a-zA-Z0-9]*$/,
                    isValid: true
                }
            ];

            ctrl.focusInput();

            expect(spy).toHaveBeenCalled();
            expect(ctrl.inputIsTouched).toBeTruthy();
        });
    });

    describe('unfocusInput():', function () {
        it('should call `ctrl.itemBlurCallback` with ctrl.inputValue', function () {
            var spy = spyOn(ctrl, 'itemBlurCallback');
            ctrl.data = 'new value';

            ctrl.unfocusInput();
            $timeout.flush();

            expect(spy).toHaveBeenCalledWith({inputValue: ctrl.inputValue, inputName: ctrl.inputName});
            expect(ctrl.isValidationPopUpShown).toBeFalsy();
        });

        it('should prevent input blur and not call `ctrl.itemBlurCallback`', function () {
            var spy = spyOn(ctrl, 'itemBlurCallback');
            var event = {
                target: {
                    focus: angular.noop
                }
            };
            ctrl.preventInputBlur = true;

            ctrl.unfocusInput(event);

            expect(spy).not.toHaveBeenCalled();
            expect(ctrl.preventInputBlur).toBeFalsy();
        });
    });

    describe('updateInputValue():', function () {
        it('should set ctrl.inputValue if ctrl.data is defined', function () {
            ctrl.updateInputValue();

            expect(ctrl.inputValue).toBe(ctrl.data)
        });

        it('should call ctrl.updateDataCallback with ctrl.inputValue, and ctrl.updateDataField if ctrl.updateDataField' +
            'is defined', function () {
            var spy = spyOn(ctrl, 'updateDataCallback');
            ctrl.updateInputValue();

            expect(spy).toHaveBeenCalledWith({newData: ctrl.inputValue, field: ctrl.updateDataField})
        });

        it('should validate ctrl.inputValue if ctrl.validationRules is defined', function () {
            ctrl.validationRules = [{
                name: 'test',
                pattern: /[\d]/
            }];

            ctrl.updateInputValue();

            expect(ctrl.validationRules[0].isValid).toBeFalsy();
        });
    });

    describe('clearInputField()', function () {
        it('should empty search field after call clearInputField()', function () {
            ctrl.data = 'new';
            ctrl.clearInputField();
            expect(ctrl.data).toEqual('');
        });
    });

    describe('isCounterVisible()', function () {
        it('should check visibility for symbols counter', function () {
            expect(ctrl.isCounterVisible()).toBeTruthy();

            ctrl.isDisabled = true;
            expect(ctrl.isCounterVisible()).toBeFalsy();

            ctrl.isDisabled = false;
            ctrl.onlyValidCharacters = true;
            expect(ctrl.isCounterVisible()).toBeFalsy();

            ctrl.onlyValidCharacters = false;
            ctrl.hideCounter = true;
            expect(ctrl.isCounterVisible()).toBeFalsy();

            ctrl.hideCounter = false;
            expect(ctrl.isCounterVisible()).toBeTruthy();
        });
    });

    describe('isValueInvalid()', function () {
        it('checks if the value invalid regarding validation rules', function () {
            ctrl.validationRules = [{isValid: true}, {isValid: false}];

            expect(ctrl.isValueInvalid()).toBeTruthy();
        });

        it('checks if the value invalid regarding validation rules', function () {
            ctrl.validationRules = [{isValid: true}, {isValid: true}];

            expect(ctrl.isValueInvalid()).toBeFalsy();
        });
    });
});
