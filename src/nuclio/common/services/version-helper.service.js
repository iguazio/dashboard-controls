(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .factory('VersionHelperService', VersionHelperService);

    function VersionHelperService(lodash) {
        return {
            generateTooltip: generateTooltip,
            isVersionDeployed: isVersionDeployed,
            updateIsVersionChanged: updateIsVersionChanged
        };

        //
        // Public methods
        //

        /**
         * Recursive generates tooltip based on `config` object.
         * @param {Array.<Object>} config - list of objects with following structure:
         *      {
         *          head: {string},
         *          values: {Array.<Object>}
         *      },
         *      where the `values` consists of objects of the same structure
         * @param {string} type - type of tags: `block` or `list`
         * @returns {string} string with correct html tags
         */
        function generateTooltip(config, type) {
            var tags = {
                block: {
                    open: '<div class="tooltip-block">',
                    close: '</div>'
                },
                list: {
                    open: '<li>',
                    close: '</li>'
                }
            };
            type = lodash.defaultTo(type, 'block');

            return lodash.reduce(config, function (result, item) {
                result += tags[type].open + '<div>' + item.head + '</div>';
                if (!lodash.isUndefined(item.values)) {
                    result += '<ul>' + generateTooltip(item.values, 'list') + '</ul>';
                }
                result += tags[type].close;

                return result
            }, '');
        }

        /**
         * Tests whether the version is deployed.
         * @returns {boolean} `true` in case version is deployed, or `false` otherwise.
         */
        function isVersionDeployed(version) {
            return lodash.isObject(version.status) && !lodash.isEmpty(version.status);
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
