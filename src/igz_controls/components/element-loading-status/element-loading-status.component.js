(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('igzElementLoadingStatus', {
            bindings: {
                errorMessage: '@?',
                loadingStatusSize: '@?',
                name: '@',
                refresh: '<?',
                title: '@?',
                tooltipLabel: '@?'
            },
            templateUrl: 'igz_controls/components/element-loading-status/element-loading-status.tpl.html',
            controller: IgzElementLoadingStatusController,
            transclude: true
        });

    function IgzElementLoadingStatusController($element, $scope, $state, $timeout, $i18next, i18next, lodash) {
        var ctrl = this;
        var defaultHeight = 0;
        var lng = i18next.language;

        ctrl.isShowSpinner = true;
        ctrl.isShowContent = false;
        ctrl.isShowError = false;

        ctrl.$onInit = onInit;
        ctrl.$postLink = postLink;
        ctrl.$onChanges = onChanges;

        ctrl.checkSize = checkSize;
        ctrl.refreshPage = refreshPage;
        ctrl.setWrapperHeight = setWrapperHeight;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            $scope.$on(`element-loading-status_show-spinner-${ctrl.name}`, showSpinner);
            $scope.$on(`element-loading-status_hide-spinner-${ctrl.name}`, hideSpinner);

            $scope.$on(`element-loading-status_show-error-${ctrl.name}`, showError);
            $scope.$on(`element-loading-status_hide-error-${ctrl.name}`, hideError);
        }

        /**
         * Post linking method
         */
        function postLink() {
            setWrapperHeight();
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

            defaultHeight = ctrl.loadingStatusSize === 'small' ? 20 : 40;
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

        /**
         * Set height of spinner wrapper
         */
        function setWrapperHeight() {
            $timeout(function () {
                var elementHeight = $element.height() > 0 ? $element.height() : defaultHeight;
                var elementParentHeight = $element.parent().height() > 0 ? $element.parent().height() : defaultHeight;

                if (ctrl.isShowSpinner) {
                    $element.find('.loader-wrapper').height(elementParentHeight || elementHeight);
                    $element.find('.loader-wrapper').addClass('appeared');
                }

                if (ctrl.isShowError) {
                    $element.find('.loading-error').height(elementHeight || elementParentHeight);
                    $element.find('.loading-error').addClass('appeared');
                }
            });
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
            ctrl.setWrapperHeight();
        }

        /**
         * Hide given loading spinner
         */
        function hideSpinner() {
            ctrl.isShowSpinner = false;
            $timeout(function () {
                ctrl.isShowContent = true;
            }, 2);
        }

        /**
         * Show given loading error
         */
        function showError() {
            ctrl.isShowError = true;
            ctrl.isShowSpinner = false;
            ctrl.setWrapperHeight();
        }

        /**
         * Hide given loading error
         */
        function hideError() {
            ctrl.isShowError = false;
        }
    }
}());
