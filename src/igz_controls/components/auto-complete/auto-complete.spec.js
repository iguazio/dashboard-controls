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
describe('igzAutoComplete component: ', function () {
    var $componentController;
    var $rootScope;
    var $q;
    var ctrl;
    var mockData;

    beforeEach(function () {
        module('iguazio.dashboard-controls');

        inject(function (_$rootScope_, _$componentController_, _$q_) {
            $rootScope = _$rootScope_;
            $componentController = _$componentController_;
            $q = _$q_;
        });

        var filterBy = [
            {
                label: 'First name',
                attribute: 'first_name'
            },
            {
                label: 'Last name',
                attribute: 'last_name'
            }
        ];
        var inputName = 'inputName';

        mockData = {
            suggestions: [{
                value: {
                    type: 'user',
                    id: '77b6fd2e-be70-477c-8226-7991757c0d79',
                    attr: {
                        email: 'dori.dorinyus@iguazio.com',
                        first_name: 'Dori',
                        last_name: 'Dorinyus',
                        username: 'security_admin'
                    }
                },
                label: 'Dori Dorinyus (security_admin)',
                additionalInfo: '<dori.dorinyus@iguazio.com>'
            }],
            more: false
        };

        var bindings = {
            filterBy: filterBy,
            formObject: {},
            inputName: inputName,
            onEmptyData: angular.noop,
            onRequestSuggestions: angular.noop,
            onSuggestionSelected: angular.noop
        };
        bindings.formObject[inputName] = {
            $setValidity: angular.noop
        };

        var element = '<igz-auto-complete></igz-auto-complete>';

        ctrl = $componentController('igzAutoComplete', {$element: element}, bindings);
    });

    afterEach(function () {
        $componentController = null;
        $rootScope = null;
        $q = null;
        ctrl = null;
        mockData = null;
    });

    describe('$onInit(): ', function () {
        it ('should prepare filters for dropdown', function () {
            var filters = [
                {
                    id: 'first_name',
                    name: 'First name'
                },
                {
                    id: 'last_name',
                    name: 'Last name'
                }
            ];
            var selectedFilter = {
                id: 'first_name',
                name: 'First name'
            };

            ctrl.$onInit();

            expect(ctrl.filters).toEqual(filters);
            expect(ctrl.selectedFilter).toEqual(selectedFilter);
        });
    });

    describe('handleInputChange(): ', function () {
        it('should pass in `ctrl.onRequestSuggestions` relevant filter and get values for autocomplete\'s dropdown, in case the input is none-empty', function () {
            spyOn(ctrl, 'onRequestSuggestions').and.returnValue($q.when(mockData));

            ctrl.handleInputChange('D');
            $rootScope.$digest();

            expect(ctrl.suggestions).toEqual(mockData.suggestions);
            expect(ctrl.isMoreLabelShown).toEqual(mockData.more);
            expect(ctrl.isSuggestionsShown).toBeTruthy();
        });

        it('should call `ctrl.onEmptyData` in case the input is empty', function () {
            spyOn(ctrl, 'onRequestSuggestions');
            spyOn(ctrl, 'onEmptyData');

            ctrl.handleInputChange('');
            $rootScope.$digest();

            expect(ctrl.onRequestSuggestions).not.toHaveBeenCalled();
            expect(ctrl.onEmptyData).toHaveBeenCalled();
        });
    });

    describe('handleFilterChange(): ', function () {
        it('should set new filter', function () {
            var filter = {
                id: 'last_name',
                name: 'Last name'
            };

            ctrl.handleFilterChange(filter, true);

            expect(ctrl.selectedFilter).toEqual(filter);
        });
    });

    describe('handleSuggestionClick(): ', function () {
        it('should pass autocomplete\'s dropdown selected field data in `ctrl.onSuggestionSelected` callback', function () {
            var spy = spyOn(ctrl, 'onSuggestionSelected').and.callFake(angular.noop);

            ctrl.handleSuggestionClick(mockData.suggestions[0].value);

            expect(spy).toHaveBeenCalledWith({value: mockData.suggestions[0].value, inputName: ctrl.inputName});
            expect(ctrl.isSuggestionsShown).toBeFalsy();
        });
    });
});
