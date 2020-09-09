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
