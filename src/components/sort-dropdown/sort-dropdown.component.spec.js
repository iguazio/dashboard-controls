describe('igzSortDropdown component:', function () {
    var $componentController;
    var ctrl;

    beforeEach(function () {
        module('iguazio.dashboard-controls');

        inject(function (_$componentController_) {
            $componentController = _$componentController_;
        });

        var bindings = {
            updateDataCallback: angular.noop
        };

        ctrl = $componentController('igzSortDropdown', null, bindings);
    });

    afterEach(function () {
        $componentController = null;
        ctrl = null;
    });

    describe('getItemClass():', function () {
        it('should return "active-item" if passed predicate is equal "true"', function () {
            expect(ctrl.getItemClass(true)).toEqual('active-item');
        });

        it('should return empty string if passed predicate is equal "false"', function () {
            expect(ctrl.getItemClass(false)).toEqual('');
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