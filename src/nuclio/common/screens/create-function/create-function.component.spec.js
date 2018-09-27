describe('nclCreateFunction Component:', function () {
    var $componentController;
    var ctrl;

    beforeEach(function () {
        module('iguazio.dashboard-controls');

        inject(function (_$componentController_) {
            $componentController = _$componentController_;
        });

        ctrl = $componentController('nclCreateFunction', {$element: {}});
    });

    afterEach(function () {
        $componentController = null;
        ctrl = null;
    });

    describe('isTypeSelected():', function () {
        it('should return true if "functionType" is equal to "selectedFunctionType"', function () {
            expect(ctrl.isTypeSelected('from_scratch')).toBeFalsy();
        });

        it('should return false if "functionType" is not equal to "selectedFunctionType"', function () {
            expect(ctrl.isTypeSelected('from_template')).toBeTruthy();
        });
    });
});