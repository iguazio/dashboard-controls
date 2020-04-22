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
            isDataRevert: false,
            isFocused: true,
            itemBlurCallback: angular.noop,
            itemFocusCallback: angular.noop,
            updateDataCallback: angular.noop,
            updateDataField: '',
            validationMaxLength: '15',
            validationRules: [{ label: 'everything', pattern: /.*/ }]
        };
        var changes = {
            inputValue: {
                currentValue: 'some input value'
            },
            isFocused: {
                currentValue: true,
                isFirstChange: angular.noop
            }
        };
        var element = '<igz-validating-input-field></igz-validating-input-field>';

        ctrl = $componentController('igzValidatingInputField', {$element: element}, bindings);
        ctrl.$onInit();
        ctrl.$postLink();
        ctrl.$onChanges(changes);
    });

    afterEach(function () {
        $componentController = null;
        $timeout = null;
        ctrl = null;
        defaultInputModelOptions = null;
    });

    describe('$onInit():', function () {
        it('should be rendered with correct data', function () {
            expect(ctrl.inputModelOptions).toEqual(defaultInputModelOptions);
            expect(ctrl.spellcheck).toBeTruthy();
            expect(ctrl.validationRules).toEqual([{ label: 'everything', pattern: /.*/ }]);
        });
    });

    describe('$onChanges():', function () {
        it('should set new value to ctrl.data', function () {
            var changes = {
                inputValue: {
                    currentValue: 'some new value'
                }
            };
            expect(ctrl.data).toEqual('some input value');
            ctrl.$onChanges(changes);
            expect(ctrl.data).toEqual('some new value');
        });

        it('should set isFocused value', function () {
            var changes = {
                isFocused: {
                    currentValue: false,
                    isFirstChange: angular.noop
                }
            };
            expect(ctrl.inputFocused).toEqual(true);
            ctrl.$onChanges(changes);
            expect(ctrl.inputFocused).toEqual(false);
        });
    });

    describe('getRemainingCharactersCount():', function () {
        it('should return difference between input length and `validationMaxLength`', function () {
            ctrl.validationMaxLength = '5';

            ctrl.data = '123';
            expect(ctrl.getRemainingCharactersCount()).toBe('2');

            ctrl.data = '12345';
            expect(ctrl.getRemainingCharactersCount()).toBe('0');

            ctrl.data = '12345678';
            expect(ctrl.getRemainingCharactersCount()).toBe('-3');
        });

        it('should return `null` in case `validationMaxLength` is non-positive or input length is negative', function () {
            ctrl.validationMaxLength = '0';
            expect(ctrl.getRemainingCharactersCount()).toBeNull();

            ctrl.validationMaxLength = '-2';
            expect(ctrl.getRemainingCharactersCount()).toBeNull();
        });
    });

    describe('onFocus():', function () {
        it('should call `ctrl.itemFocusCallback`', function () {
            var spy = spyOn(ctrl, 'itemFocusCallback');

            ctrl.onFocus();

            expect(spy).toHaveBeenCalledWith({ inputName: ctrl.inputName });
        });

        it('should set as touched in case there are some validation rules', function () {
            ctrl.inputToucehd = false;
            ctrl.validationRules = [{}];
            ctrl.onFocus();
            ctrl.inputToucehd = true;
        });
    });

    describe('onBlur():', function () {
        it('should call `ctrl.itemBlurCallback`', function () {
            var spy = spyOn(ctrl, 'itemBlurCallback');
            ctrl.data = 'new value';
            ctrl.isDataRevert = false;

            ctrl.onBlur();

            expect(spy).toHaveBeenCalledWith({inputValue: ctrl.data, inputName: ctrl.inputName});
        });

        it('should prevent input blur and not call `ctrl.onBlur`', function () {
            var spy = spyOn(ctrl, 'itemBlurCallback');
            var event = {
                target: {
                    focus: angular.noop
                }
            };
            ctrl.preventInputBlur = true;

            ctrl.onBlur(event);

            expect(spy).not.toHaveBeenCalled();
            expect(ctrl.inputFocused).toBeTruthy();
            expect(ctrl.preventInputBlur).toBeFalsy();
        });
    });

    describe('onChange():', function () {
        it('should call `ctrl.updateDataCallback` with `ctrl.inputValue`, and `ctrl.updateDataField` if `ctrl.updateDataField` is defined', function () {
            var spy = spyOn(ctrl, 'updateDataCallback');
            ctrl.isDataRevert = false;

            ctrl.onChange();

            expect(spy).toHaveBeenCalledWith({newData: ctrl.inputValue, field: ctrl.updateDataField});
        });

        it('should not call `ctrl.updateDataCallback` if `ctrl.isDataRevert` is `true`', function () {
            var spy = spyOn(ctrl, 'updateDataCallback');
            ctrl.isDataRevert = true;

            ctrl.onChange();

            expect(spy).not.toHaveBeenCalled();
        });
    });

    describe('clearInputField()', function () {
        it('should empty model and call `updateDataCallback`', function () {
            var spy = spyOn(ctrl, 'updateDataCallback');
            ctrl.data = 'new';
            ctrl.clearInputField();
            expect(ctrl.data).toEqual('');
            expect(spy).toHaveBeenCalled();
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

    describe('hasInvalidRule()', function () {
        it('checks if the value invalid regarding validation rules', function () {
            ctrl.validationRules = [{isValid: true}, {isValid: false}];

            expect(ctrl.hasInvalidRule()).toBeTruthy();
        });

        it('checks if the value invalid regarding validation rules', function () {
            ctrl.validationRules = [{isValid: true}, {isValid: true}];

            expect(ctrl.hasInvalidRule()).toBeFalsy();
        });
    });
});
