describe('igzTextEdit component:', function () {
    var $componentController;
    var $q;
    var $rootScope;
    var $timeout;
    var DialogsService;
    var ngDialog;
    var ctrl;

    beforeEach(function () {
        module('iguazio.app');

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
