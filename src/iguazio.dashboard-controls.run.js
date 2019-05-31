(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .run(appInit);

    function appInit($window, i18next) {

        // Initialization i18next for unit-tests
        i18next.init();
    }
}());
