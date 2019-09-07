describe('ElementLoadingStatusService: ', function () {
    var $rootScope;
    var ElementLoadingStatusService;

    beforeEach(function () {
        module('iguazio.dashboard-controls');

        inject(function (_$rootScope_, _ElementLoadingStatusService_) {
            $rootScope = _$rootScope_;
            ElementLoadingStatusService = _ElementLoadingStatusService_;
        });

        spyOn($rootScope, '$broadcast');
    });

    afterEach(function () {
        $rootScope = null;
        ElementLoadingStatusService = null;
    });

    describe('loading spinners: ', function () {
        it('showSpinner() ', function () {
            ElementLoadingStatusService.showSpinner('show spinner');
            expect($rootScope.$broadcast).toHaveBeenCalledWith('element-loading-status_show-spinner', {name: 'show spinner'});
        });

        it('hideSpinner() ', function () {
            ElementLoadingStatusService.hideSpinner('hide spinner');
            expect($rootScope.$broadcast).toHaveBeenCalledWith('element-loading-status_hide-spinner', {name: 'hide spinner'});
        });

        it('showSpinnerGroup() ', function () {
            var names = [
                'show spinner 1',
                'show spinner 2',
                'show spinner 3'
            ];

            ElementLoadingStatusService.showSpinnerGroup(names);

            expect($rootScope.$broadcast).toHaveBeenCalledWith('element-loading-status_show-spinner', {name: 'show spinner 1'});
            expect($rootScope.$broadcast).toHaveBeenCalledWith('element-loading-status_show-spinner', {name: 'show spinner 2'});
            expect($rootScope.$broadcast).toHaveBeenCalledWith('element-loading-status_show-spinner', {name: 'show spinner 3'});
        });

        it('hideSpinnerGroup() ', function () {
            var names = [
                'show spinner 1',
                'show spinner 2',
                'show spinner 3'
            ];

            ElementLoadingStatusService.hideSpinnerGroup(names);

            expect($rootScope.$broadcast).toHaveBeenCalledWith('element-loading-status_hide-spinner', {name: 'show spinner 1'});
            expect($rootScope.$broadcast).toHaveBeenCalledWith('element-loading-status_hide-spinner', {name: 'show spinner 2'});
            expect($rootScope.$broadcast).toHaveBeenCalledWith('element-loading-status_hide-spinner', {name: 'show spinner 3'});
        });
    });

    describe('loading errors: ', function () {
        it('showLoadingError() ', function () {
            ElementLoadingStatusService.showLoadingError('show error');
            expect($rootScope.$broadcast).toHaveBeenCalledWith('element-loading-status_show-error', {name: 'show error'});
        });

        it('hideLoadingError() ', function () {
            ElementLoadingStatusService.hideLoadingError('hide error');
            expect($rootScope.$broadcast).toHaveBeenCalledWith('element-loading-status_hide-error', {name: 'hide error'});
        });

        it('showLoadingErrorGroup() ', function () {
            var names = [
                'show error 1',
                'show error 2',
                'show error 3'
            ];

            ElementLoadingStatusService.showLoadingErrorGroup(names);

            expect($rootScope.$broadcast).toHaveBeenCalledWith('element-loading-status_show-error', {name: 'show error 1'});
            expect($rootScope.$broadcast).toHaveBeenCalledWith('element-loading-status_show-error', {name: 'show error 2'});
            expect($rootScope.$broadcast).toHaveBeenCalledWith('element-loading-status_show-error', {name: 'show error 3'});
        });

        it('hideLoadingErrorGroup() ', function () {
            var names = [
                'show error 1',
                'show error 2',
                'show error 3'
            ];

            ElementLoadingStatusService.hideLoadingErrorGroup(names);

            expect($rootScope.$broadcast).toHaveBeenCalledWith('element-loading-status_hide-error', {name: 'show error 1'});
            expect($rootScope.$broadcast).toHaveBeenCalledWith('element-loading-status_hide-error', {name: 'show error 2'});
            expect($rootScope.$broadcast).toHaveBeenCalledWith('element-loading-status_hide-error', {name: 'show error 3'});
        });
    });
});