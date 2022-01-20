(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .factory('MaskService', MaskService);

    function MaskService() {
        var commonSensitiveFields = ['password', 'secret', 'accessKeyID', 'secretAccessKey', 'caCert', 'accessKey',
            'accessCertificate', 'clientSecret'];

        return {
            commonSensitiveFields: commonSensitiveFields,
            getMask: getMask,
            getObjectWithMask: getObjectWithMask,
        };

        //
        // Public methods
        //

        /**
         * Returns a mask for a given string
         *
         * @param {string} string - string to convert to a mask
         * @returns {string} converted string
         * @example
         * getValueMask('pass1234');
         * // => '********'
         */
        function getMask(string) {
            return typeof string === 'string' ? string.replace(/./g, '*') : string;
        }

        /**
         * Returns converted object with masked sensitive data
         *
         * @param {Object} object - object to convert
         * @param {Array<string>} [sensitiveFields] - fields that should be converted
         * @returns {Object} converted object
         * @example
         * getValueMask({name: 'Name', sensitiveField: 'secretInfo'}, ['sensitiveField']);
         * // => {name: 'name, sensitiveField: '**********'}
         */
        function getObjectWithMask(object, sensitiveFields) {
            sensitiveFields = sensitiveFields || commonSensitiveFields;

            const objectJson = JSON.stringify(object, function (key, value) {
                return sensitiveFields.includes(key) && typeof value === 'string' ?
                    value.replace(/./g, '*') : value;
            });

            return JSON.parse(objectJson);
        }
    }
}());
