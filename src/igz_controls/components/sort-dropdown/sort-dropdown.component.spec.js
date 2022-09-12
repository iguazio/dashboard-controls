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
describe('igzSortDropdown component:', function () {
    var $componentController;
    var ctrl;
    var lodash;

    beforeEach(function () {
        module('iguazio.dashboard-controls');

        inject(function (_$componentController_, _lodash_) {
            $componentController = _$componentController_;
            lodash = _lodash_;
        });

        var bindings = {
            sortOptions: [
                {
                    label: 'Name'
                },
                {
                    active: true,
                    desc: true,
                    label: 'Age',
                    value: 'age',
                    visible: false
                },
                {
                    active: false,
                    label: 'Address',
                    value: 'address'
                }
            ],
            reverseSorting: true,
            onSortChange: angular.noop
        };

        ctrl = $componentController('igzSortDropdown', null, bindings);
    });

    afterEach(function () {
        $componentController = null;
        ctrl = null;
        lodash = null;
    });

    describe('$onInit(): ', function () {
        it('should start dropdown menu as closed', function () {
            ctrl.isOpen = false;

            ctrl.$onInit();

            expect(ctrl.isOpen).toBeFalsy();
        });
    });

    describe('$onChanges(): ', function () {
        it('should set default values in case `sortOptions` is changed', function () {
            spyOn(lodash, 'uniqueId').and.returnValue('uniqueValue');

            ctrl.$onChanges({ sortOptions: [] });

            expect(ctrl.sortOptions).toEqual([
                {
                    active: false,
                    desc: false,
                    label: 'Name',
                    value: 'uniqueValue',
                    visible: true
                },
                {
                    active: true,
                    desc: true,
                    label: 'Age',
                    value: 'age',
                    visible: false
                },
                {
                    active: false,
                    desc: false,
                    label: 'Address',
                    value: 'address',
                    visible: true
                }
            ]);
        });

        it('should set the new selected option according to new value of `selectedOption` in case it changed', function () {
            ctrl.$onChanges({
                selectedOption: {
                    currentValue: 'address'
                }
            });

            expect(ctrl.sortOptions).toEqual([
                {
                    active: false, // set to false
                    desc: true,    // according to ctrl.reverseSorting
                    label: 'Name'
                },
                {
                    active: false, // set to false
                    desc: true,    // according to ctrl.reverseSorting
                    label: 'Age',
                    value: 'age',
                    visible: false
                },
                {
                    active: true, // set to true
                    desc: true,   // according to ctrl.reverseSorting
                    label: 'Address',
                    value: 'address'
                }
            ]);
        });

        it('should set the selected option\'s sorting order according to `reverseSorting` in case it changed', function () {
            ctrl.$onChanges({
                reverseSorting: {
                    currentValue: false
                }
            });

            expect(ctrl.sortOptions[1].desc).toBeFalsy();
        });

        describe('handleOptionClick(): ', function () {
            it('should toggle sorting order in case the same selected option is re-selected', function () {
                ctrl.handleOptionClick(ctrl.sortOptions[1]);

                expect(ctrl.sortOptions[1].desc).toBeFalsy();
            });

            it('should deselect currently-selected option in case a different option is selected', function () {
                ctrl.handleOptionClick(ctrl.sortOptions[0]);

                expect(ctrl.sortOptions[0].active).toBeTruthy();
                expect(ctrl.sortOptions[1].desc).toBeFalsy();
                expect(ctrl.sortOptions[1].active).toBeFalsy();
            });

            it('should invoke `onSortChange` with the provided option as `option` property of passed object', function () {
                spyOn(ctrl, 'onSortChange');

                ctrl.handleOptionClick(ctrl.sortOptions[2]);

                expect(ctrl.onSortChange).toHaveBeenCalledWith({ option: ctrl.sortOptions[2] });
            });
        });
    });
});
