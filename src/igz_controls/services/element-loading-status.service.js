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
            $rootScope.$broadcast('element-loading-status_show-spinner_' + name);
        }

        /**
         * Send event to hide loading spinner
         * @param {string} name - spinner name
         */
        function hideSpinner(name) {
            $rootScope.$broadcast('element-loading-status_hide-spinner_' + name);
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
            $rootScope.$broadcast('element-loading-status_show-error_' + name);
        }

        /**
         * Send event to hide loading error
         * @param {string} name - spinner name
         */
        function hideLoadingError(name) {
            $rootScope.$broadcast('element-loading-status_hide-error_' + name);
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
