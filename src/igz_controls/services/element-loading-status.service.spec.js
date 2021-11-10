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
            expect($rootScope.$broadcast).toHaveBeenCalledWith('element-loading-status_show-spinner_show-spinner' );
        });

        it('hideSpinner() ', function () {
            ElementLoadingStatusService.hideSpinner('hide-spinner');
            expect($rootScope.$broadcast).toHaveBeenCalledWith('element-loading-status_hide-spinner_hide-spinner');
        });

        it('showSpinnerGroup() ', function () {
            var names = [
                'first-spinner',
                'second-spinner',
                'third-spinner'
            ];

            ElementLoadingStatusService.showSpinnerGroup(names);

            expect($rootScope.$broadcast).toHaveBeenCalledWith('element-loading-status_show-spinner_first-spinner');
            expect($rootScope.$broadcast).toHaveBeenCalledWith('element-loading-status_show-spinner_second-spinner');
            expect($rootScope.$broadcast).toHaveBeenCalledWith('element-loading-status_show-spinner_third-spinner');
        });

        it('hideSpinnerGroup() ', function () {
            var names = [
                'first-spinner',
                'second-spinner',
                'third-spinner'
            ];

            ElementLoadingStatusService.hideSpinnerGroup(names);

            expect($rootScope.$broadcast).toHaveBeenCalledWith('element-loading-status_hide-spinner_first-spinner');
            expect($rootScope.$broadcast).toHaveBeenCalledWith('element-loading-status_hide-spinner_second-spinner');
            expect($rootScope.$broadcast).toHaveBeenCalledWith('element-loading-status_hide-spinner_third-spinner');
        });
    });

    describe('loading errors: ', function () {
        it('showLoadingError() ', function () {
            ElementLoadingStatusService.showLoadingError('show-error');
            expect($rootScope.$broadcast).toHaveBeenCalledWith('element-loading-status_show-error_show-error');
        });

        it('hideLoadingError() ', function () {
            ElementLoadingStatusService.hideLoadingError('hide-error');
            expect($rootScope.$broadcast).toHaveBeenCalledWith('element-loading-status_hide-error_hide-error');
        });

        it('showLoadingErrorGroup() ', function () {
            var names = [
                'first-error',
                'second-error',
                'third-error'
            ];

            ElementLoadingStatusService.showLoadingErrorGroup(names);

            expect($rootScope.$broadcast).toHaveBeenCalledWith('element-loading-status_show-error_first-error');
            expect($rootScope.$broadcast).toHaveBeenCalledWith('element-loading-status_show-error_second-error');
            expect($rootScope.$broadcast).toHaveBeenCalledWith('element-loading-status_show-error_third-error');
        });

        it('hideLoadingErrorGroup() ', function () {
            var names = [
                'first-error',
                'second-error',
                'third-error'
            ];

            ElementLoadingStatusService.hideLoadingErrorGroup(names);

            expect($rootScope.$broadcast).toHaveBeenCalledWith('element-loading-status_hide-error_first-error');
            expect($rootScope.$broadcast).toHaveBeenCalledWith('element-loading-status_hide-error_second-error');
            expect($rootScope.$broadcast).toHaveBeenCalledWith('element-loading-status_hide-error_third-error');
        });
    });
});
