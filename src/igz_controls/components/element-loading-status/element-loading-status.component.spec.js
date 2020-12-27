describe('igzElementLoadingStatus component:', function () {
    var $componentController;
    var $event;
    var $state;
    var ctrl;

    beforeEach(function () {
        module('iguazio.dashboard-controls');

        inject(function (_$componentController_, _$state_) {
            $componentController = _$componentController_;
            $state = _$state_;
        });

        $event = {
            stopPropagation: angular.noop
        };

        var element = '<igz-loading-status></igz-loading-status>';

        ctrl = $componentController('igzElementLoadingStatus', {$element: element}, null);
        ctrl.$onInit();
    });

    afterEach(function () {
        $componentController = null;
        $event = null;
        $state = null;
        ctrl = null;
    });

    describe('$onChanges(): ', function () {
        it('should be rendered with correct data', function () {
            ctrl.$onChanges();
            expect(ctrl.loadingStatusSize).toEqual('default');
        });
    });

    describe('checkSize():', function () {
        it('should check if ctrl.loadingStatusSize to equal passing argument', function () {
            ctrl.$onChanges();
            expect(ctrl.checkSize('default')).toBeTruthy();
        })
    });

    describe('refreshPage():', function () {
        it('should call event.stopPropagation and $state.go', function () {
            var eventSpy = spyOn($event, 'stopPropagation');
            var stateSpy = spyOn($state, 'go');
            ctrl.refreshPage($event);

            expect(eventSpy).toHaveBeenCalled();
            expect(stateSpy).toHaveBeenCalled();
        })
    });
});
