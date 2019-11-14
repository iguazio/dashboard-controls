describe('igzSortDropdown component:', function () {
    var $componentController;
    var ctrl;

    beforeEach(function () {
        module('iguazio.dashboard-controls');

        inject(function (_$componentController_) {
            $componentController = _$componentController_;
        });

        var bindings = {
            sortOptions: [{
                label: 'Name',
                value: 'metadata.name',
                active: true
            }, {
                label: 'Project',
                value: 'ui.project.metadata.name',
                visible: false,
                active: true
            }],
            updateDataCallback: angular.noop
        };

        ctrl = $componentController('igzSortDropdown', null, bindings);
    });

    afterEach(function () {
        $componentController = null;
        ctrl = null;
    });

    describe('onInit():', function () {
        it('should run `setValuesVisibility` function', function () {
            spyOn(ctrl, 'setValuesVisibility');

            ctrl.$onInit();

            expect(ctrl.setValuesVisibility).toHaveBeenCalled();
        });
    });

    describe('getItemClass():', function () {
        it('should return "active-item" if passed predicate is equal "true"', function () {
            expect(ctrl.getItemClass(true)).toEqual('active-item');
        });

        it('should return empty string if passed predicate is equal "false"', function () {
            expect(ctrl.getItemClass(false)).toEqual('');
        });
    });

    describe('setValuesVisibility():', function () {
        it('should set `visible` property for all array items into true if it is not already defined', function () {
            ctrl.setValuesVisibility();

            expect(ctrl.sortOptions[0].visible).toBeTruthy();
            expect(ctrl.sortOptions[1].visible).toBeFalsy();
        });
    });

    describe('toggleSortingOrder():', function () {
        it('should call "updateDataCallback" with passed predicate', function () {
            var spy = spyOn(ctrl, 'updateDataCallback');
            var option = {
                value: 'some value'
            };

            ctrl.toggleSortingOrder(option);

            expect(spy).toHaveBeenCalledWith(option);
        });
    });
});
