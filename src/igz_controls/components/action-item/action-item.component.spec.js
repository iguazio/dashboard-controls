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
describe('igzActionItem component:', function () {
    var $componentController;
    var $rootScope;
    var ctrl;
    var ngDialog;
    var ngDialogSpy;

    beforeEach(function () {
        module('iguazio.dashboard-controls');

        inject(function (_$componentController_, _$rootScope_, _ngDialog_) {
            $componentController = _$componentController_;
            $rootScope = _$rootScope_;
            ngDialog = _ngDialog_;
        });

        ngDialogSpy = spyOn(ngDialog, 'openConfirm').and.returnValue({
            then: function (thenCallback) {
                thenCallback();
            }
        });

        var bindings = {
            action: {
                label: 'Download',
                id: 'default',
                icon: 'download',
                active: true,
                confirm: {
                    message: 'Are you sure you want to delete selected items?',
                    yesLabel: 'Yes, Delete',
                    noLabel: 'Cancel',
                    type: 'critical_alert'
                },
                template: '<div></div>',
                subTemplateProps: {
                    isShown: false
                },
                handler: function () {
                },
                callback: function () {
                }
            }
        };
        var element = '<igz-action-item></igz-action-item>';

        ctrl = $componentController('igzActionItem', {$element: element}, bindings);
    });

    afterEach(function () {
        $componentController = null;
        $rootScope = null;
        ctrl = null;
        ngDialog = null;
        ngDialogSpy = null;
    });

    describe('onClickAction()', function () {
        it('should just call action.handler if action.confirm is not defined', function () {
            var spy = spyOn(ctrl.action, 'handler');
            ctrl.onClickAction();
            expect(spy).toHaveBeenCalled();
        });

        it('should show confirm dialog and then call action.handler if action.confirm is defined', function () {
            var spy = spyOn(ctrl.action, 'handler');
            ctrl.onClickAction();
            expect(ngDialogSpy).toHaveBeenCalled();
            expect(spy).toHaveBeenCalled();
        });

        it('should show subtemplate if action.template is defined', function () {
            expect(ctrl.action.subTemplateProps.isShown).toBeFalsy();
            ctrl.onClickAction();
            expect(ctrl.action.subTemplateProps.isShown).toBeTruthy();
        });

        it('should call action.callback if defined', function () {
            var spy = spyOn(ctrl.action, 'callback');
            ctrl.onClickAction();
            expect(spy).toHaveBeenCalled();
        });

        it('should not call action event if action.active \'false\'', function () {
            ctrl.action.active = false;

            var spyHandler = spyOn(ctrl.action, 'handler');
            var spyCallback = spyOn(ctrl.action, 'callback');

            ctrl.onClickAction();

            expect(spyHandler).not.toHaveBeenCalled();
            expect(spyCallback).not.toHaveBeenCalled();
        });
    });
});
