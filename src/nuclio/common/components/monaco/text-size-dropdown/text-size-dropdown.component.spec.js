describe('nclTextSizeDropdown component:', function () {
    var $componentController;
    var ctrl;

    beforeEach(function () {
        module('iguazio.dashboard-controls');

        inject(function (_$componentController_) {
            $componentController = _$componentController_;
        });

        ctrl = $componentController('nclTextSizeDropdown', null);
    });

    afterEach(function () {
        $componentController = null;
        ctrl = null;
    });

    describe('changeTextSize():', function () {
        it('should set new value in ctrl.selectedTextSize', function () {
            ctrl.selectedTextSize = '16px';

            ctrl.changeTextSize('20px');

            expect(ctrl.selectedTextSize).toEqual('20px');
        });
    });
});
