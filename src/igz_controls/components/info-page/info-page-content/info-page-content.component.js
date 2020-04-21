(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('igzInfoPageContent', {
            bindings: {
                scrolled: '<',
                watchId: '@?'
            },
            templateUrl: 'igz_controls/components/info-page/info-page-content/info-page-content.tpl.html',
            transclude: true,
            controller: IgzInfoPageContentController
        });

    function IgzInfoPageContentController($scope, $timeout, $window, $element) {
        var ctrl = this;

        ctrl.isFiltersShowed = false;
        ctrl.isInfoPaneShowed = false;

        // Config for horizontal scrollbar on containers view
        ctrl.scrollConfigHorizontal = {
            axis: 'x',
            scrollInertia: 0
        };

        ctrl.$onInit = onInit;
        ctrl.$postLink = postLink;

        //
        // Hook methods
        //

        /**
         * Init method
         */
        function onInit() {
            var watchId = angular.isDefined(ctrl.watchId) ? '-' + ctrl.watchId : '';

            $scope.$on('info-page-upper-pane_toggle-start' + watchId, onUpperPaneToggleStart);
            $scope.$on('info-page-filters_toggle-start' + watchId, onFiltersPaneToggleStart);
            $scope.$on('info-page-pane_toggle-start' + watchId, onInfoPaneToggleStart);
            $scope.$on('info-page-pane_toggled', dispatchResize);
        }

        /**
         * Post linking method
         */
        function postLink() {
            $timeout(function () {
                manageHorizontalScroll();

                $scope.$on('info-page-filters_toggled', manageHorizontalScroll);

                $scope.$on('info-page-pane_toggled', manageHorizontalScroll);

                $scope.$on('igzWatchWindowResize::resize', manageHorizontalScroll);
            });
        }

        //
        // Private methods
        //

        /**
         * Manages x-scrollbar behavior
         * Needed to get rid of accidental wrong content width calculations made by 'ng-scrollbars' library
         * We just control x-scrollbar with lib's native enable/disable methods
         */
        function manageHorizontalScroll() {
            var $scrollXContainer = $element.find('.igz-scrollable-container.horizontal').first();
            var contentWrapperWidth = $element.find('.igz-info-page-content-wrapper').first().width();
            var contentMinWidth = parseInt($element.find('.igz-info-page-content').css('min-width'));

            if ($scrollXContainer.length && contentWrapperWidth < (contentMinWidth || 946)) {
                $scrollXContainer.mCustomScrollbar('update');
            } else if ($scrollXContainer.length) {
                $scrollXContainer.mCustomScrollbar('disable', true);
                $element.find('.mCSB_container').first().width('100%');
            }
        }

        /**
         * Upper pane toggle start $broadcast listener
         * @param {Object} e - broadcast event
         * @param {boolean} isShown - represents upper pane state
         */
        function onUpperPaneToggleStart(e, isShown) {
            ctrl.isUpperPaneShowed = isShown;
        }

        /**
         * Filters pane toggle start $broadcast listener
         * @param {Object} e - broadcast event
         * @param {boolean} isShown - represents filters pane state
         */
        function onFiltersPaneToggleStart(e, isShown) {
            ctrl.isFiltersShowed = isShown;
        }

        /**
         * Info pane toggle start $broadcast listener
         * @param {Object} e - broadcast event
         * @param {boolean} isShown - represents info pane state
         */
        function onInfoPaneToggleStart(e, isShown) {
            ctrl.isInfoPaneShowed = isShown;
        }

        /**
         * Updates Ui-Layout library's containers size
         */
        function dispatchResize() {
            $timeout(function () {
                $window.dispatchEvent(new Event('resize'));
            }, 0);
        }
    }
}());
