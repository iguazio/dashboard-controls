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
        .factory('YamlService', YamlService);

    function YamlService(YAML) {
        return {
            prepareYamlObject: prepareYamlObject
        };

        //
        // Public methods
        //

        /**
         * Prepare YAML object
         * @param {Object} objectToParse
         * @returns {string} YAML object
         */
        function prepareYamlObject(objectToParse) {
            var parsedObject = YAML.stringify(objectToParse, Infinity, 2);

            return getValidYaml(parsedObject);
        }

        //
        // Private methods
        //

        /**
         * Returns valid YAML string.
         * First RegExp deletes all excess lines in YAML string created by issue in yaml.js package.
         * It is necessary to generate valid YAML.
         * Example:
         * -
         *   name: name
         *   value: value
         * -
         *   name: name
         *   value: value
         * Will transform in:
         * - name: name
         *   value: value
         * - name: name
         *   value: value
         * Second and Third RegExp replaces all double quotes with single quotes outside the value.
         * Example:
         * 'key': "" -> 'key': ''
         * 'key': "some "string" value" -> 'key': 'some "string" value'
         * Fourth RegExp transform all double quotes to escaped double quotes inside the value.
         * Example:
         * 'key': 'some "string" value' -> 'key': 'some \"string\" value'
         * Fifth, Sixth and Seventh replaces all single quotes with double quotes outside the value.
         * Example:
         * 'key': 'value' -> "key": "value"
         * Eighth RegExp replaces all pairs of single quotes with one single quote.
         * It needs because property name or property value is a string which contains single quote
         * will parsed by yaml.js package in string with pair of single quotes.
         * Example:
         * "ke'y": "val'ue"
         * After will parse will be -> "ke''y": "val''ue"
         * This RegExp will transform it to normal view -> "ke'y": "val'ue"
         * @param {string} data - incoming YAML-string
         * @returns {string}
         */
        function getValidYaml(data) {
            function replacer(match, captureGroup1, captureGroup2) {
                return captureGroup1 + captureGroup2.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
            }

            return data.replace(/(\s*-)\s*\n\s+/g, '$1 ')
                .replace(/(:\s)"(.+)"$/g, '$1\'$2\'')
                .replace(/(:\s)"{2}/g, '$1\'\'')
                .replace(/([^\\"])("+)/g, replacer)
                .replace(/'(.+)'(:)/g, '"$1"$2')
                .replace(/(:\s)'(.+)'/g, '$1"$2"')
                .replace(/(:\s)'{2}/g, '$1""')
                .replace(/'{2}/g, '\'');
        }
    }
}());
