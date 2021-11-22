(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('igzElementLoadingStatus', {
            bindings: {
                errorMessage: '@?',
                loadingStatusSize: '@?',
                name: '@',
                refresh: '<?',
                textStatus: '<?',
                title: '@?',
                tooltipLabel: '@?'
            },
            templateUrl: 'igz_controls/components/element-loading-status/element-loading-status.tpl.html',
            controller: IgzElementLoadingStatusController,
            transclude: true
        });

    function IgzElementLoadingStatusController($element, $scope, $state, $i18next, i18next, lodash) {
        var ctrl = this;
        var lng = i18next.language;

        ctrl.isShowSpinner = true;
        ctrl.isShowContent = false;
        ctrl.isShowError = false;

        ctrl.$onInit = onInit;
        ctrl.$onChanges = onChanges;

        ctrl.checkSize = checkSize;
        ctrl.refreshPage = refreshPage;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            $scope.$on('element-loading-status_show-spinner_' + ctrl.name, showSpinner);
            $scope.$on('element-loading-status_hide-spinner_' + ctrl.name, hideSpinner);

            $scope.$on('element-loading-status_show-error_' + ctrl.name, showError);
            $scope.$on('element-loading-status_hide-error_' + ctrl.name, hideError);
        }

        /**
         * Changes method
         */
        function onChanges() {
            lodash.defaults(ctrl, {
                loadingStatusSize: 'default',
                refresh: false,
                title: '',
                tooltipLabel: ''
            });

            if (lodash.isEmpty(ctrl.errorMessage)) {
                lodash.assign(ctrl, {
                    errorMessage: $i18next.t('common:ERROR_MSG.ELEMENT_LOADING_DEFAULT_1', { lng: lng }),
                    title: $i18next.t('common:OOPS', { lng: lng }),
                    refresh: true
                });
            }
        }

        //
        // Public methods
        //

        /**
         * Check if given size is actual
         * @param {string} size - size name ('small', 'default')
         */
        function checkSize(size) {
            return ctrl.loadingStatusSize === size;
        }

        /**
         * Refresh current page (ui-router state)
         * @param {Object} $event - angular event object
         */
        function refreshPage($event) {

            // Prevent 'upper' events to be triggered
            $event.stopPropagation();

            $state.go($state.current, {}, {reload: true});
        }

        //
        // Private methods
        //

        /**
         * Show given loading spinner
         */
        function showSpinner() {
            ctrl.isShowError = false;
            ctrl.isShowContent = false;
            ctrl.isShowSpinner = true;
        }

        /**
         * Hide given loading spinner
         */
        function hideSpinner() {
            ctrl.isShowSpinner = false;
            ctrl.isShowContent = true;
        }

        /**
         * Show given loading error
         */
        function showError() {
            ctrl.isShowError = true;
            ctrl.isShowSpinner = false;
        }

        /**
         * Hide given loading error
         */
        function hideError() {
            ctrl.isShowError = false;
        }
    }
}());
