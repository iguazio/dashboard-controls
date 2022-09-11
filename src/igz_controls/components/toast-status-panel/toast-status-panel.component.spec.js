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
