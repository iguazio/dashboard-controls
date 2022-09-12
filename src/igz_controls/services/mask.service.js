/*
Copyright 2018 Iguazio Systems Ltd.
Licensed under the Apache License, Version 2.0 (the "License") with
an addition restriction as set forth herein. You may not use this
file except in compliance with the License. You may obtain a copy of
the License at http://www.apache.org/licenses/LICENSE-2.0.
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. See the License for the specific language governing
permissions and limitations under the License.
In addition, you may not use the software for any purposes that are
illegal under applicable law, and the grant of the foregoing license
under the Apache 2.0 license is conditioned upon your compliance with
such restriction.
*/
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

            var objectJson = JSON.stringify(object, function (key, value) {
                return key === 'ui' ? undefined : sensitiveFields.includes(key) && typeof value === 'string' ?
                    value.replace(/./g, '*') : value;
            });

            return JSON.parse(objectJson);
        }
    }
}());
