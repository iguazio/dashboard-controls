(function () {
    'use strict'

    var defaultConfig = {
        url: {
            api: {
                baseUrl: location.protocol + '//' + location.hostname + ':8001/api'
            },
            push: {
                baseUrl: location.protocol + '//' + location.hostname + ':8002/push'
            },
            nginx: {
                baseUrl: location.protocol + '//' + location.hostname + ':8081'
            },
            elasticsearch: {
                baseUrl: location.protocol + '//' + location.hostname + ':8004'
            }
        },
        path: {
            hostArtifactDir: '/'
        },
        mode: 'production',
        isDemoMode: function () {
            return defaultConfig.mode === 'demo';
        },
        isStagingMode: function (strict) {
            return defaultConfig.mode === 'staging' || !strict && defaultConfig.mode === 'demo';
        },
        requestsChunkSize: 1,
        cacheStoragePoolId: '0',
        defaultIntervalSec: 10, // the default interval in units of seconds that back-end uses for statistics
        externalIPAddress: ''
    };

    angular.module('iguazio.dashboard-controls')
        .constant('ConfigService', window._.merge(defaultConfig, {}));

    angular.module('iguazio.dashboard-controls')
        .config(config)
        .config(ngDialogConfig)
        .config(lodashConfig);

    angular.module('iguazio.dashboard-controls')
        .constant('moment', window.moment)
        .constant('d3', window.d3)
        .constant('Highcharts', window.Highcharts)
        .constant('lodash', window._)
        .constant('Base64', window.Base64);

    function config($compileProvider, $locationProvider, $httpProvider, uibDatepickerConfig, $qProvider) {
        $locationProvider.html5Mode(true);

        $httpProvider.defaults.withCredentials = true;

        uibDatepickerConfig.showWeeks = false;

        // allows to get values from bindings outside of onInit function (since angular 1.6)
        $compileProvider.preAssignBindingsEnabled(true);

        // prevents 'Possibly unhandled rejection' error
        $qProvider.errorOnUnhandledRejections(false);
    }

    function ngDialogConfig(ngDialogProvider) {
        ngDialogProvider.setDefaults({
            className: 'ngdialog-theme-nuclio',
            showClose: false,
            closeByEscape: false,
            closeByDocument: false
        });
    }

    function lodashConfig() {
        var lodash = window._;

        lodash.mixin({

            /**
             * Checks if value is a non-empty object, collection, map, or set.
             *
             * Objects are considered non-empty if they have any own enumerable string keyed properties.
             *
             * Array-like values such as arguments objects, arrays, buffers, strings, or jQuery-like collections are
             * considered non-empty if they have a length greater than 0. Similarly, maps and sets are considered
             * non-empty if they have a size greater than 0.
             * @param {*} value - The value to check.
             * @returns {boolean} Returns `true` if value is non-empty, else `false`.
             */
            isNonEmpty: lodash.negate(lodash.isEmpty),

            /**
             * Checks if `predicate` returns falsey for *any* element of `collection`. Iteration is stopped once
             * `predicate` returns falsey. The predicate is invoked with three arguments:
             * _(value, index|key, collection)_.
             * @param {Array|Object} collection - The collection to iterate over.
             * @param {function|string|Array|Object} [predicate=lodash.identity] - The function invoked per iteration.
             * @returns {boolean} Returns `true` if any element fails the predicate check, else `false`.
             */
            notEvery: lodash.negate(lodash.every),

            /**
             * Checks if `predicate` returns falsey for *all* element of `collection`. Iteration is stopped once
             * `predicate` returns truthy. The predicate is invoked with three arguments:
             * _(value, index|key, collection)_.
             * @param {Array|Object} collection - The collection to iterate over.
             * @param {function|string|Array|Object} [predicate=lodash.identity] - The function invoked per iteration.
             * @returns {boolean} Returns `true` if all elements fail the predicate check, else `false`.
             */
            none: lodash.negate(lodash.some),

            /**
             * Iterates over elements of collection, finding the first element for which predicate returns truthy. The
             * predicate is invoked with three arguments: _(value, index|key, collection)_. Then gets the value at
             * `path` of matched element (if found). If the resolved value is `undefined`, or if no match was found, the
             * `defaultValue` is returned instead (if it is provided, otherwise `undefined` is returned).
             * @param {Array|Object} collection - The collection to inspect
             * @param {function|string|Array|Object} [predicate=lodash.identity] - The function invoked per iteration.
             * @param {Array|string} path - The path of the property to get
             * @param {*} defaultValue - The value returned for `undefined` resolved values of matched element, or in
             *     case no match found.
             * @param {number} [fromIndex=0] The index to search from.
             * @returns {*} Returns the resolved value of the matched element, or `defaultValue` for `undefined`
             *     resolved values, or in case no match was found. If `defaultValue` is not provided then `undefined` is
             *     returned in these cases.
             */
            findGet: function (collection, predicate, path, defaultValue, fromIndex) {
                return lodash.chain(collection)
                    .find(predicate, fromIndex)
                    .get(path, defaultValue)
                    .value();
            }
        });
    }
}());
