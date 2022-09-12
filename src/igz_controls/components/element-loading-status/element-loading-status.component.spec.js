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
