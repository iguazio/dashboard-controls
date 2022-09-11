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
describe('igzActionPanel component:', function () {
    var $componentController;
    var $rootScope;
    var ctrl;

    beforeEach(function () {
        module('iguazio.dashboard-controls');

        inject(function (_$componentController_, _$rootScope_) {
            $componentController = _$componentController_;
            $rootScope = _$rootScope_;
        });
        var bindings = {
            actions: [
                {
                    label: 'Download',
                    id: 'default',
                    icon: 'download',
                    active: true,
                    callback: false,
                    visible: true
                },
                {
                    label: 'Delete',
                    id: 'delete',
                    icon: 'trash',
                    active: true,
                    callback: false,
                    visible: true
                },
                {
                    label: 'Clone',
                    id: 'clone',
                    icon: 'multidoc',
                    active: true,
                    callback: false,
                    visible: true
                },
                {
                    label: 'Snapshot',
                    id: 'snapshot',
                    icon: 'camera',
                    active: true,
                    callback: function () {
                        $rootScope.$broadcast('passed');
                    },
                    visible: true
                },
                {
                    label: 'Properties',
                    id: 'default',
                    icon: 'note',
                    active: true,
                    callback: false,
                    visible: true
                },
                {
                    label: 'Info',
                    id: 'toggleInfoPanel',
                    icon: 'info',
                    active: true,
                    callback: false,
                    visible: true
                }
            ]
        };

        ctrl = $componentController('igzActionPanel', null, bindings);

        ctrl.$onInit();
    });

    afterEach(function () {
        $componentController = null;
        $rootScope = null;
        ctrl = null;
    });

    describe('isActionPanelShown()', function () {
        it('should return true if count of checked item is more than 0', function () {
            $rootScope.$broadcast('action-checkbox-all_checked-items-count-change', {
                checkedCount: 5
            });
            $rootScope.$digest();
            expect(ctrl.isActionPanelShown()).toBeTruthy();
        });

        it('should return false if count of checked item is less than 1', function () {
            $rootScope.$broadcast('action-checkbox-all_checked-items-count-change', {
                checkedCount: 0
            });
            $rootScope.$digest();
            expect(ctrl.isActionPanelShown()).toBeFalsy();
        });
    });
});
