(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('igzElementLoadingStatus', {
            bindings: {
                loadingStatusSize: '@?',
                name: '@',
                tooltipLabel: '@?'
            },
            templateUrl: 'igz_controls/components/element-loading-status/element-loading-status.tpl.html',
            controller: IgzElementLoadingStatusController,
            transclude: true
        });

    function IgzElementLoadingStatusController($scope, $element, $timeout, $state, lodash) {
        var ctrl = this;
        var defaultHeight = 0;

        ctrl.isShowSpinner = true;
        ctrl.isShowContent = false;
        ctrl.isShowError = false;

        ctrl.$onInit = onInit;
        ctrl.$postLink = postLink;

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
            lodash.defaults(ctrl, {
                loadingStatusSize: 'default',
                tooltipLabel: ''
            });
            defaultHeight = ctrl.loadingStatusSize === 'small' ? 20 : 40;

            $scope.$on('element-loading-status_show-spinner', showSpinner);
            $scope.$on('element-loading-status_hide-spinner', hideSpinner);

            $scope.$on('element-loading-status_show-error', showError);
            $scope.$on('element-loading-status_hide-error', hideError);
        }

        /**
         * Post linking method
         */
        function postLink() {

            // Set height of spinner wrapper
            setWrapperHeight();
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
         * @param {Object} ev - angular event object
         * @param {Object} args - arguments passed from $broadcast
         */
        function showSpinner(ev, args) {
            if (args.name === ctrl.name) {
                ctrl.isShowError = false;
                ctrl.isShowContent = false;
                ctrl.isShowSpinner = true;
                ctrl.setWrapperHeight();
            }
        }

        /**
         * Hide given loading spinner
         * @param {Object} ev - angular event object
         * @param {Object} args - arguments passed from $broadcast
         */
        function hideSpinner(ev, args) {
            if (args.name === ctrl.name) {
                ctrl.isShowSpinner = false;
                $timeout(function () {
                    ctrl.isShowContent = true;
                }, 2);
            }
        }

        /**
         * Show given loading error
         * @param {Object} ev - angular event object
         * @param {Object} args - arguments passed from $broadcast
         */
        function showError(ev, args) {
            if (args.name === ctrl.name) {
                ctrl.isShowError = true;
                ctrl.isShowSpinner = false;
                ctrl.setWrapperHeight();
            }
        }

        /**
         * Hide given loading error
         * @param {Object} ev - angular event object
         * @param {Object} args - arguments passed from $broadcast
         */
        function hideError(ev, args) {
            if (args.name === ctrl.name) {
                ctrl.isShowError = false;
            }
        }
    }
}());
