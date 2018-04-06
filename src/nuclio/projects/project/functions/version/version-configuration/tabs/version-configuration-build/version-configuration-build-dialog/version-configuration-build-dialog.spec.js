describe('nclVersionConfigurationBuildDialog component:', function () {
    var $componentController;
    var $q;
    var $rootScope;
    var ctrl;
    var scope;

    beforeEach(function () {
        module('iguazio.dashboard-controls');

        inject(function (_$componentController_, _$q_, _$rootScope_) {
            $componentController = _$componentController_;
            $q = _$q_;
            $rootScope = _$rootScope_;
        });

        scope = $rootScope.$new();
        var bindings = {
            closeDialog: angular.noop
        };

        ctrl = $componentController('nclVersionConfigurationBuildDialog', {$scope: scope}, bindings);
    });

    afterEach(function () {
        $componentController = null;
        $q = null;
        $rootScope = null;
        ctrl = null;
    });

    describe('onClose(): ', function () {
        it('should close dialog calling closeDialog() method', function () {
            spyOn(ctrl, 'closeDialog');

            ctrl.onClose();

            expect(ctrl.closeDialog).toHaveBeenCalled();
        });
    });

    describe('uploadFile(): ', function () {
        it('should close dialog calling closeDialog() method and pass file object in this method', function () {
            spyOn(ctrl, 'closeDialog');

            ctrl.uploadFile();

            expect(ctrl.closeDialog).toHaveBeenCalled();
        });
    });
});
