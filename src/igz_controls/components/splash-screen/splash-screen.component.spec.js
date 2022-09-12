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
describe('igzSplashScreen component:', function () {
    var $componentController;
    var $rootScope;
    var $state;
    var ctrl;

    beforeEach(function () {
        module('iguazio.dashboard-controls');

        inject(function (_$componentController_, _$rootScope_, _$state_) {
            $componentController = _$componentController_;
            $rootScope = _$rootScope_;
            $state = _$state_;
        });

        ctrl = $componentController('igzSplashScreen', null);

        ctrl.$onInit();
    });

    afterEach(function () {
        $componentController = null;
        $rootScope = null;
        $state = null;
        ctrl = null;
    });

    describe('refreshPage()', function () {
        it('should send broadcast, and set isLoading to true, isFailedBrowseService to false', function () {
            var reloadSpy = spyOn($state, 'reload');

            ctrl.isLoading = false;
            ctrl.isAlertShowing = true;

            ctrl.refreshPage();

            expect(reloadSpy).toHaveBeenCalled();
            expect(ctrl.isLoading).toBeTruthy();
            expect(ctrl.isAlertShowing).toBeFalsy();
        });
    });
});
