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
describe('igzActionsPanes component:', function () {
    var $componentController;
    var $rootScope;
    var ConfigService;
    var ctrl;
    var closeInfoPane;
    var infoPaneToggleMethod;

    beforeEach(function () {
        module('iguazio.dashboard-controls');

        inject(function (_$componentController_, _$rootScope_, _ConfigService_) {
            $componentController = _$componentController_;
            $rootScope = _$rootScope_;
            ConfigService = _ConfigService_;
        });

        closeInfoPane = function () {
            return 'close-info-pane';
        };

        infoPaneToggleMethod = function () {
            return 'close-info-pane';
        };

        var bindings = {
            showFilterIcon: 'true',
            closeInfoPane: closeInfoPane,
            infoPaneToggleMethod: infoPaneToggleMethod,
            filtersToggleMethod: angular.noop
        };

        ctrl = $componentController('igzActionsPanes', null, bindings);
    });

    afterEach(function () {
        $componentController = null;
        $rootScope = null;
        ConfigService = null;
        ctrl = null;
        closeInfoPane = null;
        infoPaneToggleMethod = null;
    });

    describe('onInit(): ', function () {
        it('should set ctrl.callToggleMethod to ctrl.closeInfoPane if it exists', function () {
            ctrl.$onInit();

            expect(ctrl.callToggleMethod).toEqual(closeInfoPane);
        });

        it('should set ctrl.callToggleMethod to ctrl.infoPaneToggleMethod if it does\'t exist', function () {
            ctrl.closeInfoPane = 'not a function';

            ctrl.$onInit();

            expect(ctrl.callToggleMethod).toEqual(infoPaneToggleMethod);
        });
    });

    describe('ctrl.isShowFilterActionIcon(): ', function () {
        it('should return true if filter toggle method exists and if ctrl.showFilterIcon is true', function () {
            ctrl.isShowFilterActionIcon();

            expect(ctrl.isShowFilterActionIcon()).toBeTruthy();
        });

        it('should return true if filter toggle method exists and if ctrl.showFilterIcon is false and is demo mode (is not demo - return false)', function () {
            ctrl.showFilterIcon = 'false';

            ctrl.isShowFilterActionIcon();

            if (ConfigService.isDemoMode()) {
                expect(ctrl.isShowFilterActionIcon()).toBeTruthy();
            } else {
                expect(ctrl.isShowFilterActionIcon()).toBeFalsy();
            }
        });

        it('should return false if filter toggle method does\'t exist', function () {
            ctrl.filtersToggleMethod = 'not a function';

            ctrl.isShowFilterActionIcon();

            expect(ctrl.isShowFilterActionIcon()).toBeFalsy();
        });
    });
});
