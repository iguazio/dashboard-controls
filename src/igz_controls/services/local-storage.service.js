(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .factory('LocalStorageService', LocalStorageService);

    function LocalStorageService(lodash) {
        return {
            clearAll: clearAll,
            getItem: getItem,
            removeItem: removeItem,
            setItem: setItem
        };

        //
        // Public methods
        //

        /**
         * Removes all data from local storage
         */
        function clearAll() {
            localStorage.clear();
        }

        /**
         * Directly gets a value from local storage
         * @param {string} namespace - localStorage namespace (e.g.: 'login', 'session')
         * @param {string} key - key nested in namespace
         * @returns {*} value stored at `key` in `namespace` object stored at `namespace` in `localStorage`, or
         *     the entire namespace as a plain object
         */
        function getItem(namespace, key) {
            var namespaceObject = getNamespace(namespace);
            return arguments.length === 1 ? namespaceObject : lodash.get(namespaceObject, key, null);
        }

        /**
         * Removes keys from localStorage
         * @param {string} namespace - localStorage namespace (e.g.: 'login', 'session')
         * @param {Array.<string>|string} keys - key(s) to be removed; if not provided, removes the entire namespace
         */
        function removeItem(namespace, keys) {
            if (arguments.length === 1) {
                localStorage.removeItem(namespace);
            } else {
                var namespaceObject = getNamespace(namespace);

                if (!lodash.isNil(namespaceObject)) {

                    // omit provided keys from provided namespace,
                    var reducedNamespace = lodash.omit(getNamespace(namespace), keys);

                    // update the provided namespace with the result
                    localStorage.setItem(namespace, angular.toJson(reducedNamespace));
                }
            }
        }

        /**
         * Directly adds a value to local storage
         * @param {string} namespace - localStorage namespace (e.g.: 'login', 'session')
         * @param {string|Object} key - key to be set. If key is object then set whole object to localStorage.
         *     Otherwise add/set key-value pair to existing localStorage object.
         * @param {string} value - value to be set
         */
        function setItem(namespace, key, value) {
            if (arguments.length === 2 && lodash.isObject(key)) {
                localStorage.setItem(namespace, angular.toJson(key));
            } else if (arguments.length > 2 && lodash.isString(key) && !lodash.isNil(value)) {
                var localStorageObject = getNamespace(namespace);

                if (lodash.isNil(localStorageObject)) {
                    localStorageObject = {};
                }

                lodash.set(localStorageObject, [key], value);
                localStorage.setItem(namespace, angular.toJson(localStorageObject));
            }
        }

        //
        // Private methods
        //

        /**
         * Retrieves the value of `namespace` in local storage as a plain object
         * @param {string} namespace - the namespace to retrieve
         * @returns {?Object} the de-serialized JSON string in `namespace` key in `localStorage`
         *     or `null` if `namespace` does not exist in `localStorage` or if its content is not a serialized JSON
         */
        function getNamespace(namespace) {
            try {
                return angular.fromJson(localStorage.getItem(namespace));
            } catch (error) {
                return null;
            }
        }
    }
}());
