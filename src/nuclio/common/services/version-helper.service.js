(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .factory('VersionHelperService', VersionHelperService);

    function VersionHelperService(lodash, ConfigService) {
        return {
            isVersionDeployed: isVersionDeployed,
            updateIsVersionChanged: updateIsVersionChanged,
            getInvocationUrl: getInvocationUrl
        };

        //
        // Public methods
        //

        /**
         * Get correct invocation url otherwise returns `URL not exposed` message
         * @param {Object} version
         * @returns {{text: string, valid: boolean}} URL invocation data
         */
        function getInvocationUrl(version) {
            var httpTrigger = lodash.find(version.spec.triggers, ['kind', 'http']);

            if (!lodash.isNil(httpTrigger)) {
                var ingresses = lodash.get(httpTrigger, 'attributes.ingresses', null)

                if (!lodash.isEmpty(ingresses)) {
                    return {
                        text: ingresses[0].host,
                        valid: true
                    }
                }

                var serviceType = lodash.get(httpTrigger, 'attributes.serviceType', null);
                var state = lodash.get(version, 'status.state', null);
                var disable = lodash.get(version, 'spec.disable', false);
                var httpPort = lodash.get(version, 'status.httpPort', null)
                var externalIPAddress = ConfigService.nuclio.externalIPAddress;

                if (serviceType === 'NodePort' &&
                    state === 'ready'          &&
                    disable === false          &&
                    !lodash.isNil(httpPort)    &&
                    httpPort !== 0             &&
                    !lodash.isEmpty(externalIPAddress)) {
                    return {
                        text: 'http://' + externalIPAddress + ':' + httpPort,
                        valid: true
                    }

                }
            }

            return {
                text: 'URL not exposed',
                valid: false
            }
        }

        /**
         * Tests whether the version is deployed.
         * @param {Object} version
         * @returns {boolean} `true` in case version is deployed, or `false` otherwise.
         */
        function isVersionDeployed(version) {
            var state = lodash.get(version, 'status.state', '');
            return !lodash.isEmpty(state);
        }

        /**
         * Updates "version changed" indicator of `version`. Sets it to `true` in case working version differs from
         * deployed one, or `false` otherwise.
         * @param {Object} version - the working function's version.
         * @param {Object} version.ui.deployedVersion - latest deployed function's version.
         */
        function updateIsVersionChanged(version) {
            var working = cloneObject(lodash.omit(version, 'ui'));
            var deployed = cloneObject(lodash.omit(version.ui.deployedVersion, 'ui'));
            version.ui.versionChanged = !lodash.isEqual(working, deployed);
        }

        //
        // Private methods
        //

        /**
         * Creates objects copy
         * Recursively copies all properties which are not empty objects or empty strings
         * as they are not needed for comparison
         * @param {Object} obj - an object which must be copied
         * @returns {Object} newObj - copy of obj without empty objects and strings
         */
        function cloneObject(obj) {

            // omits all empty values
            var newObj = lodash.omitBy(obj, function (value) {
                return lodash.isObject(value) || lodash.isString(value) ? lodash.isEmpty(value) : false;
            });

            lodash.forOwn(newObj, function (value, key) {

                // recursively copies nested objects
                if (lodash.isObject(value)) {
                    newObj[key] = cloneObject(value);
                }
            });

            return newObj;
        }
    }
}());
