angular.module('angular-i18next', [])
    .provider('i18next', [function () {
        this.$get = ['$window', function ($window) {
            return $window.i18next;
        }];
    }]);
