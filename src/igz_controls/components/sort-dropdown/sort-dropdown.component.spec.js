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
