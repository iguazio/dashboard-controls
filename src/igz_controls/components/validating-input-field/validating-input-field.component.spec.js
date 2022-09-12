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
describe('igzValidatingInputField component:', function () {
    var $componentController;
    var $rootScope;
    var $timeout;
    var ctrl;
    var defaultInputModelOptions;

    beforeEach(function () {
        module('iguazio.dashboard-controls');

        inject(function (_$componentController_, _$rootScope_, _$timeout_) {
            $componentController = _$componentController_;
            $rootScope = _$rootScope_;
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

        var bindings = {
            inputName: 'attributeName',
            itemBlurCallback: angular.noop,
            itemFocusCallback: angular.noop,
            updateDataCallback: angular.noop,
            validationMaxLength: '15'
        };
        var changes = {
            inputValue: {
                currentValue: 'some input value'
            },
            isFocused: {
                currentValue: true,
                isFirstChange: angular.noop
            },
            validationRules: {
                currentValue: [],
                isFirstChange: angular.noop
            }
        };
        var element = angular.element('<igz-validating-input-field></igz-validating-input-field>');

        // mocking `ngModel` of the HTML <input> element with `field` CSS class inside the component's template
        element.find = function () {
            return {
                focus: angular.noop,
                controller: function () {
                    return {
                        $commitViewValue: angular.noop,
                        $invalid: false,
                        $validate: angular.noop,
                        $validators: []
                    };
                }
            };
        };

        ctrl = $componentController('igzValidatingInputField', { $element: element }, bindings);
        ctrl.$onInit();
        ctrl.$postLink();
        $rootScope.$apply();
        ctrl.$onChanges(changes);
    });

    afterEach(function () {
        $componentController = null;
        $rootScope = null;
        $timeout = null;
        ctrl = null;
        defaultInputModelOptions = null;
    });

    describe('$onInit(): ', function () {
        it('should be rendered with correct data', function () {
            expect(ctrl.inputModelOptions).toEqual(defaultInputModelOptions);
            expect(ctrl.spellcheck).toBeTruthy();
            expect(ctrl.updateDataField).toEqual('attributeName');
            expect(ctrl.bordersModeClass).toEqual('borders-always');
            expect(ctrl.fieldType).toEqual('input');
        });
    });

    describe('$onChanges(): ', function () {
        it('should set `ctrl.data` to new `inputValue` and default to `\'\'`', function () {
            var changes = {
                inputValue: {
                    currentValue: 'some new value'
                }
            };
            expect(ctrl.data).toEqual('some input value');
            ctrl.$onChanges(changes);
            expect(ctrl.data).toEqual('some new value');

            delete changes.inputValue.currentValue;
            ctrl.$onChanges(changes);
            expect(ctrl.data).toEqual('');
        });

        it('should set `ctrl.inputFocused` to new `isFocused` and default to `false`', function () {
            var changes = {
                isFocused: {
                    currentValue: false,
                    isFirstChange: angular.noop
                }
            };
            expect(ctrl.inputFocused).toEqual(true);
            ctrl.$onChanges(changes);
            expect(ctrl.inputFocused).toEqual(false);

            delete changes.isFocused.currentValue;
            ctrl.$onChanges(changes);
            expect(ctrl.inputFocused).toBeFalsy();
        });

        it('should set `ctrl.validationRules` to new `validationRules` and default to `[]`', function () {
            var newRules = [
                { name: 'name1', label: 'label1', pattern: /pattern1/ },
                { name: 'name2', label: 'label2', pattern: /pattern2/ }
            ];
            var changes = {
                validationRules: {
                    currentValue: newRules,
                    isFirstChange: angular.noop
                }
            };
            expect(ctrl.validationRules).toEqual([]);
            ctrl.$onChanges(changes);
            expect(ctrl.validationRules).toEqual(angular.copy(newRules));

            delete changes.validationRules.currentValue;
            ctrl.$onChanges(changes);
            expect(ctrl.validationRules).toEqual([]);
        });
    });

    describe('getRemainingCharactersCount(): ', function () {
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

    describe('onFocus(): ', function () {
        it('should set `ctrl.inputFocused` to true', function () {
            ctrl.inputFocused = false;
            ctrl.onFocus();
            ctrl.inputFocused = true;
        });

        it('should call `ctrl.itemFocusCallback`', function () {
            var spy = spyOn(ctrl, 'itemFocusCallback');
            var event = {};
            ctrl.data = 'abc';

            ctrl.onFocus(event);

            expect(spy).toHaveBeenCalledWith({ event: event, inputValue: 'abc', inputName: ctrl.inputName });
        });

        it('should set as touched in case there are some validation rules', function () {
            ctrl.inputToucehd = false;
            ctrl.validationRules = [{}];
            ctrl.onFocus();
            ctrl.inputToucehd = true;
        });
    });

    describe('onBlur(): ', function () {
        it('should call `ctrl.itemBlurCallback`', function () {
            var spy = spyOn(ctrl, 'itemBlurCallback');
            var event = {};
            ctrl.data = 'new value';
            ctrl.isDataRevert = false;

            ctrl.onBlur(event);

            expect(spy).toHaveBeenCalledWith({ event: event, inputValue: ctrl.data, inputName: ctrl.inputName});
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

        it('should call `ctrl.updateDataCallback` with `ctrl.data`, and `ctrl.updateDataField` in case `ctrl.isDataRevert` is true and model is valid', function () {
            var spy = spyOn(ctrl, 'updateDataCallback');
            ctrl.preventInputBlur = false;
            ctrl.isDataRevert = true;
            ctrl.data = 'abc';
            ctrl.updateDataField = '123';

            ctrl.onBlur();

            expect(spy).toHaveBeenCalledWith({ newData: 'abc', field: '123' });
        });
    });

    describe('onChange(): ', function () {
        it('should call `ctrl.updateDataCallback` with `ctrl.data`, and `ctrl.updateDataField`', function () {
            var spy = spyOn(ctrl, 'updateDataCallback');
            ctrl.isDataRevert = false;
            ctrl.data = 'abc';
            ctrl.updateDataField = '123';

            ctrl.onChange();

            expect(spy).toHaveBeenCalledWith({ newData: 'abc', field: '123' });
        });

        it('should not call `ctrl.updateDataCallback` if `ctrl.isDataRevert` is `true`', function () {
            var spy = spyOn(ctrl, 'updateDataCallback');
            ctrl.isDataRevert = true;

            ctrl.onChange();

            expect(spy).not.toHaveBeenCalled();
        });
    });

    describe('clearInputField(): ', function () {
        it('should empty model and call `updateDataCallback`', function () {
            var spy = spyOn(ctrl, 'updateDataCallback');
            ctrl.data = 'new';
            ctrl.clearInputField();
            expect(ctrl.data).toEqual('');
            expect(spy).toHaveBeenCalled();
        });
    });

    describe('isCounterVisible(): ', function () {
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

    describe('hasInvalidRule(): ', function () {
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
