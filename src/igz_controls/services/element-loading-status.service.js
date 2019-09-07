(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .factory('ElementLoadingStatusService', ElementLoadingStatusService);

    function ElementLoadingStatusService($rootScope) {
        return {
            showSpinner: showSpinner,
            hideSpinner: hideSpinner,
            showSpinnerGroup: showSpinnerGroup,
            hideSpinnerGroup: hideSpinnerGroup,

            showLoadingError: showLoadingError,
            hideLoadingError: hideLoadingError,
            showLoadingErrorGroup: showLoadingErrorGroup,
            hideLoadingErrorGroup: hideLoadingErrorGroup
        };

        /**
         * Send event to show loading spinner
         * @param {string} name - spinner name
         */
        function showSpinner(name) {
            $rootScope.$broadcast('element-loading-status_show-spinner', {name: name});
        }

        /**
         * Send event to hide loading spinner
         * @param {string} name - spinner name
         */
        function hideSpinner(name) {
            $rootScope.$broadcast('element-loading-status_hide-spinner', {name: name});
        }

        /**
         * Send event to show group of loading spinners
         * @param {Array} names - array of strings representing spinners names
         */
        function showSpinnerGroup(names) {
            angular.forEach(names, showSpinner);
        }

        /**
         * Send event to hide group of loading spinners
         * @param {Array} names - array of strings representing spinners names
         */
        function hideSpinnerGroup(names) {
            angular.forEach(names, hideSpinner);
        }

        /**
         * Send event to show loading error
         * @param {string} name - spinner name
         */
        function showLoadingError(name) {
            $rootScope.$broadcast('element-loading-status_show-error', {name: name});
        }

        /**
         * Send event to hide loading error
         * @param {string} name - spinner name
         */
        function hideLoadingError(name) {
            $rootScope.$broadcast('element-loading-status_hide-error', {name: name});
        }

        /**
         * Send event to show group of loading errors
         * @param {Array} names - array of strings representing errors names
         */
        function showLoadingErrorGroup(names) {
            angular.forEach(names, showLoadingError);
        }

        /**
         * Send event to show group of loading errors
         * @param {Array} names - array of strings representing errors names
         */
        function hideLoadingErrorGroup(names) {
            angular.forEach(names, hideLoadingError);
        }
    }
}());
