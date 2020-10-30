describe('igzToastStatusPanel component:', function () {
    var $componentController;
    var $rootScope;
    var $timeout;
    var ctrl;

    beforeEach(function () {
        module('iguazio.dashboard-controls');

        inject(function (_$componentController_, _$rootScope_, _$timeout_) {
            $componentController = _$componentController_;
            $rootScope = _$rootScope_;
            $timeout = _$timeout_;
        });

        var element = angular.element('<igz-toast-status-panel></igz-toast-status-panel>');
        var bindings = {
            panelMessages: {
                'in-progress': 'Process in progress',
                'succeeded': 'Process finished successfully',
                'failed': 'Process failed'
            },
            panelStatus: null
        };

        ctrl = $componentController('igzToastStatusPanel', {$element: element}, bindings);
    });

    afterEach(function () {
        $componentController = null;
        $rootScope = null;
        $timeout = null;
        ctrl = null;
    });

    describe('getState():', function () {
        it('should return current state', function () {
            var state = ctrl.getState();
            expect(state).toBeFalsy();

            ctrl.panelState = 'in-progress';

            state = ctrl.getState();
            expect(state).toBe('in-progress');
        });
    });

    describe('getStateMessage():', function () {
        it('should return status matched to given state', function () {
            var status = ctrl.getStateMessage('in-progress');
            expect(status).toEqual('Process in progress');

            status = ctrl.getStateMessage('succeeded');
            expect(status).toEqual('Process finished successfully');

            status = ctrl.getStateMessage('failed');
            expect(status).toEqual('Process failed');
        });
    });

    describe('closeToastPanel(): ', function () {
        it('should show apply result and send `igzWatchWindowResize::resize` broadcast', function () {
            spyOn($rootScope, '$broadcast').and.callThrough();

            ctrl.closeToastPanel();

            expect(ctrl.isToastPanelShown).toBeFalsy();

            $timeout.flush();

            expect($rootScope.$broadcast).toHaveBeenCalledWith('igzWatchWindowResize::resize');
        });
    });
});
