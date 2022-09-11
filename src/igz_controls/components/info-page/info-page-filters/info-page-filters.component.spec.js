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
describe('igzInfoPageFilters component:', function () {
    var $componentController;
    var $rootScope;
    var ctrl;

    beforeEach(function () {
        module('iguazio.dashboard-controls');

        inject(function (_$componentController_, _$rootScope_) {
            $componentController = _$componentController_;
            $rootScope = _$rootScope_
        });

        var bindings = {
            changeStateCallback: angular.noop,
            resetFilters: angular.noop,
            applyFilters: angular.noop,
            watchId: 1
        };
        var element = '<igz-info-page-filters></igz-info-page-filters>';

        ctrl = $componentController('igzInfoPageFilters', {$element: element}, bindings);
        ctrl.$onInit();

        $rootScope.$broadcast('info-page-upper-pane_toggle-start-1', true);
    });

    afterEach(function () {
        $componentController = null;
        $rootScope = null;
        ctrl = null;
    });

    describe('initial state:', function () {
        it('should set value from broadcast to ctrl.isUpperPaneShowed', function () {
            expect(ctrl.isUpperPaneShowed).toBeTruthy();
        });

        it('should call ctrl.changeStateCallback', function () {
            var spy = spyOn(ctrl, 'changeStateCallback');
            $rootScope.$broadcast('info-page-pane_toggle-start-1', true);

            expect(spy).toHaveBeenCalled();
        })
    });

    describe('onApplyFilters():', function () {
        it('should call $broadcast and ctrl.applyFilters', function () {
            var broadcastSpy = spyOn($rootScope, '$broadcast');
            var applyFiltersSpy = spyOn(ctrl, 'applyFilters');
            ctrl.onApplyFilters();

            expect(broadcastSpy).toHaveBeenCalled();
            expect(applyFiltersSpy).toHaveBeenCalled();
        })
    });

    describe('onResetFilters():', function () {
        it('should call $broadcast and ctrl.resetFilters', function () {
            var broadcastSpy = spyOn($rootScope, '$broadcast');
            var resetFiltersSpy = spyOn(ctrl, 'resetFilters');
            ctrl.onResetFilters();

            expect(broadcastSpy).toHaveBeenCalled();
            expect(resetFiltersSpy).toHaveBeenCalled();
        })
    });

    describe('isShowFooterButtons():', function () {
        it('should return true if ctrl.resetFilters or ctrl.applyFilters is functions', function () {
            expect(ctrl.isShowFooterButtons()).toBeTruthy();
        })
    })
});
