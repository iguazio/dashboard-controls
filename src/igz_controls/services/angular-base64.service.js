angular.module('angular-base64', [])
    .provider('Base64', function () {
        this.$get = ['$window', function ($window) {
            return $window.Base64;
        }];
    });
