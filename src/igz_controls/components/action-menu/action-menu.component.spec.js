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
describe('igzActionMenu component:', function () {
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
            ],
            onFireAction: function () {
            }
        };
        var element = '<igz-action-menu></igz-action-menu>';

        ctrl = $componentController('igzActionMenu', {$element: element}, bindings);
    });

    afterEach(function () {
        $componentController = null;
        $rootScope = null;
        ctrl = null;
    });

    describe('toggleMenu()', function () {
        it('should change value of boolean variable isMenuShown', function () {
            var event = {
                stopPropagation: angular.noop
            };
            expect(ctrl.isMenuShown).toBeFalsy();
            ctrl.toggleMenu(event);
            expect(ctrl.isMenuShown).toBeTruthy();
        });
    });

    describe('showDetails(): ', function () {
        it('should call ctrl.onClickShortcut()', function () {
            ctrl.onClickShortcut = angular.noop;
            var event = {
                preventDefault: angular.noop,
                stopPropagation: angular.noop
            };
            spyOn(ctrl, 'onClickShortcut');

            ctrl.showDetails(event, 'state');

            expect(ctrl.onClickShortcut).toHaveBeenCalled();
        });
    });

    describe('isVisible(): ', function () {
        it('should return true if there are action menu items', function () {
            expect(ctrl.isVisible()).toBeTruthy();
        });

        it('should return false if there is no action menu items', function () {
            ctrl.actions = null;
            expect(ctrl.isVisible()).toBeFalsy();
        });

        it('should return true if there are action menu shortcuts', function () {
            ctrl.actions = null;
            ctrl.shortcuts = [
                {
                    label: 'shortcutLabel',
                    state: 'state'
                }
            ];
            expect(ctrl.isVisible()).toBeTruthy();
        });
    });
});
