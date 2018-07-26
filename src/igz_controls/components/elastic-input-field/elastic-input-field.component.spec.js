describe('igzElasticInputField component:', function () {
    var $componentController;
    var ctrl;
    var getComponentController;

    beforeEach(function () {
        module('iguazio.dashboard-controls');

        inject(function (_$componentController_) {
            $componentController = _$componentController_;
        });

        getComponentController = function getComponentController(bindings) {
            return $componentController('igzElasticInputField', null, bindings);
        };

        var bindings = {
            onBlur: angular.noop,
            onChange: angular.noop
        };

        ctrl = getComponentController(bindings);
        ctrl.$onInit();
    });

    afterEach(function () {
        $componentController = null;
        ctrl = null;
        getComponentController = null;
    });

    describe('$onInit(): ', function () {
        it('should set "ctrl.readOnly" to the provided value', function () {
            ctrl = getComponentController({ readOnly: true });
            ctrl.$onInit();
            expect(ctrl.readOnly).toEqual(true);

            ctrl = getComponentController({ readOnly: false });
            ctrl.$onInit();
            expect(ctrl.readOnly).toEqual(false);
        });

        it('should set "ctrl.readOnly" of "false" when not provided', function () {
            expect(ctrl.readOnly).toEqual(false);
        });
    });

    describe('onDataChange(): ', function () {
        it('onChange() function should be called with params', function () {
            ctrl.model = 'input model';
            var spy = spyOn(ctrl, 'onChange');
            ctrl.onDataChange();

            expect(spy).toHaveBeenCalledWith({item: 'input model'});
        });
    });
});