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
        .component('igzSplashScreen', {
            bindings: {
                isSplashShowed: '<'
            },
            templateUrl: 'igz_controls/components/splash-screen/splash-screen.tpl.html',
            controller: IgzSplashScreenController
        });

    function IgzSplashScreenController($scope, $state, $i18next, i18next) {
        var ctrl = this;
        var lng = i18next.language;

        // public properties
        ctrl.isLoading = true;
        ctrl.isAlertShowing = false;
        ctrl.textToDisplay = $i18next.t('common:LOADING_CAPITALIZE_ELLIPSIS', {lng: lng});

        ctrl.$onInit = onInit;

        // public methods
        ctrl.refreshPage = refreshPage;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            $scope.$on('splash-screen_show-error', showError);
        }

        //
        // Public methods
        //

        /**
         * Sends broadcast to refresh browse page
         */
        function refreshPage() {
            ctrl.isLoading = true;
            ctrl.isAlertShowing = false;

            $state.reload();
        }

        //
        // Private methods
        //

        /**
         * Shows error text
         * @param {Object} event - native broadcast event
         * @param {string} data - broadcast data
         */
        function showError(event, data) {
            if (angular.isDefined(data.textToDisplay)) {
                ctrl.textToDisplay = data.textToDisplay;
            }

            if (angular.isDefined(data.alertText)) {
                ctrl.alertText = data.alertText;
            }

            ctrl.isLoading = false;
            ctrl.isAlertShowing = true;
        }
    }
}());
