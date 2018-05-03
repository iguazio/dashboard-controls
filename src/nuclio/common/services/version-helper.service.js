(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .factory('VersionHelperService', VersionHelperService);

    function VersionHelperService($rootScope, lodash) {
        return {
            checkVersionChange: checkVersionChange
        };

        //
        // Public methods
        //

        /**
         * Checks if current version differs from deployed one
         * Sends broadcast about current version's deployed status
         * @param version - an object of selected function's version
         * @param version.ui.deployedVersion - latest deployed function's version
         */
        function checkVersionChange(version) {
            var copyForComparison = cloneObject(version);
            var versionChanged = !lodash.isEqual(lodash.omit(copyForComparison, 'ui'), copyForComparison.ui.deployedVersion);

            if (versionChanged !== version.ui.versionChanged && versionChanged) {
                version.ui.versionChanged = versionChanged;
                $rootScope.$broadcast('change-version-deployed-state', {component: 'version', isDeployed: false});
            } else if (!versionChanged) {
                version.ui.versionChanged = versionChanged;
                $rootScope.$broadcast('change-version-deployed-state', {component: 'version', isDeployed: true});
            }
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
                if (lodash.isObject(value) || lodash.isString(value)) {
                    return lodash.isEmpty(value);
                }
                return false;
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
