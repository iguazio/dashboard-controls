angular.module('angular-moment', [])
    .provider('moment', function () {
        this.$get = ['$window', function ($window) {
            return $window.moment;
        }];
    });
