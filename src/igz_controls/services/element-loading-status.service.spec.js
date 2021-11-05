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
            ElementLoadingStatusService.showSpinner('show-spinner');
            expect($rootScope.$broadcast).toHaveBeenCalledWith('element-loading-status_show-spinner-show-spinner' );
        });

        it('hideSpinner() ', function () {
            ElementLoadingStatusService.hideSpinner('hide-spinner');
            expect($rootScope.$broadcast).toHaveBeenCalledWith('element-loading-status_hide-spinner-hide-spinner');
        });

        it('showSpinnerGroup() ', function () {
            var names = [
                'first-spinner',
                'second-spinner',
                'third-spinner'
            ];

            ElementLoadingStatusService.showSpinnerGroup(names);

            expect($rootScope.$broadcast).toHaveBeenCalledWith('element-loading-status_show-spinner-first-spinner');
            expect($rootScope.$broadcast).toHaveBeenCalledWith('element-loading-status_show-spinner-second-spinner');
            expect($rootScope.$broadcast).toHaveBeenCalledWith('element-loading-status_show-spinner-third-spinner');
        });

        it('hideSpinnerGroup() ', function () {
            var names = [
                'first',
                'second',
                'third'
            ];

            ElementLoadingStatusService.hideSpinnerGroup(names);

            expect($rootScope.$broadcast).toHaveBeenCalledWith('element-loading-status_hide-spinner-first');
            expect($rootScope.$broadcast).toHaveBeenCalledWith('element-loading-status_hide-spinner-second');
            expect($rootScope.$broadcast).toHaveBeenCalledWith('element-loading-status_hide-spinner-third');
        });
    });

    describe('loading errors: ', function () {
        it('showLoadingError() ', function () {
            ElementLoadingStatusService.showLoadingError('first-error');
            expect($rootScope.$broadcast).toHaveBeenCalledWith('element-loading-status_show-error-first-error');
        });

        it('hideLoadingError() ', function () {
            ElementLoadingStatusService.hideLoadingError('first-error');
            expect($rootScope.$broadcast).toHaveBeenCalledWith('element-loading-status_hide-error-first-error');
        });

        it('showLoadingErrorGroup() ', function () {
            var names = [
                'first-error',
                'second-error',
                'third-error'
            ];

            ElementLoadingStatusService.showLoadingErrorGroup(names);

            expect($rootScope.$broadcast).toHaveBeenCalledWith('element-loading-status_show-error-first-error');
            expect($rootScope.$broadcast).toHaveBeenCalledWith('element-loading-status_show-error-second-error');
            expect($rootScope.$broadcast).toHaveBeenCalledWith('element-loading-status_show-error-third-error');
        });

        it('hideLoadingErrorGroup() ', function () {
            var names = [
                'first-error',
                'second-error',
                'third-error'
            ];

            ElementLoadingStatusService.hideLoadingErrorGroup(names);

            expect($rootScope.$broadcast).toHaveBeenCalledWith('element-loading-status_hide-error-first-error');
            expect($rootScope.$broadcast).toHaveBeenCalledWith('element-loading-status_hide-error-second-error');
            expect($rootScope.$broadcast).toHaveBeenCalledWith('element-loading-status_hide-error-third-error');
        });
    });
});
