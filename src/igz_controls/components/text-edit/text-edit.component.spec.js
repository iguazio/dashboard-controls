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
describe('igzTextEdit component:', function () {
    var $componentController;
    var $q;
    var $rootScope;
    var $timeout;
    var DialogsService;
    var ngDialog;
    var ctrl;

    beforeEach(function () {
        module('iguazio.dashboard-controls');

        inject(function (_$componentController_, _$q_, _$rootScope_, _$timeout_, _DialogsService_, _ngDialog_) {
            $componentController = _$componentController_;
            $q = _$q_;
            $rootScope = _$rootScope_;
            $timeout = _$timeout_;
            DialogsService = _DialogsService_;
            ngDialog = _ngDialog_;
        });

        var bindings = {
            closeDialog: angular.noop,
            submitData: angular.noop,
            content: 'any content'
        };
        var element = angular.element('<igz-text-edit></igz-text-edit>');

        ctrl = $componentController('igzTextEdit', {$element: element}, bindings);
    });

    afterEach(function () {
        $componentController = null;
        $q = null;
        $rootScope = null;
        $timeout = null;
        DialogsService = null;
        ngDialog = null;
        ctrl = null;
    });

    describe('onChangeText():', function () {
        beforeEach(function () {
            ctrl.$onInit();
        });

        it('should set file changed flag to true', function () {
            ctrl.content = 'some content';
            ctrl.onChangeText('some new content');
            $timeout.flush();

            expect(ctrl.fileChanged).toBeTruthy();
        });
    });

    describe('onClose():', function () {
        it('should call ctrl.closeDialog', function () {
            var spy = spyOn(ctrl, 'closeDialog');
            ctrl.onClose();

            expect(spy).toHaveBeenCalled();
        });

        it('should call ctrl.closeDialog if promise was resolved', function () {
            ctrl.fileChanged = true;
            var spyOnClose = spyOn(ctrl, 'closeDialog');

            spyOn(DialogsService, 'confirm').and.callFake(function () {
                return {
                    then: function (callback) {
                        callback();
                    }
                };
            });
            ctrl.onClose();

            expect(spyOnClose).toHaveBeenCalled();
        });

        it('should not call ctrl.closeDialog if promise was not resolved', function () {
            ctrl.fileChanged = true;

            var spyCloseDialog = spyOn(ctrl, 'closeDialog');

            spyOn(DialogsService, 'confirm').and.callFake(function () {
                return {
                    then: angular.noop
                };
            });
            ctrl.onClose();

            expect(spyCloseDialog).not.toHaveBeenCalled();
        });
    });

    describe('onSubmit():', function () {
        it('should call ctrl.closeDialog and set new value to ctrl.serverError,ctrl.isLoadingState', function () {
            ctrl.fileChanged = true;
            ctrl.content = 'some new content';

            var spyCloseDialog = spyOn(ctrl, 'closeDialog');

            spyOn(ctrl, 'submitData').and.callFake(function () {
                return {
                    then: function (callback) {
                        callback('some data');

                        return {
                            catch: function (catchCallback) {
                                catchCallback({statusText: 'some error text'});

                                return {
                                    'finally': function (finallyCallback) {
                                        finallyCallback();
                                    }
                                };
                            }
                        };
                    }
                };
            });
            ctrl.onSubmit();

            expect(spyCloseDialog).toHaveBeenCalledWith({value: 'some data'});
            expect(ctrl.serverError).toEqual('some error text');
            expect(ctrl.isLoadingState).toBeFalsy();
        });
    });
});
