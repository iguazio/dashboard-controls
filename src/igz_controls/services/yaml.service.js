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
                return captureGroup1 + captureGroup2.replace(/"/g, '\\"');
            }

            return data.replace(/(\s*-)\s*\n\s+/g, '$1 ')
                .replace(/(:\s)"(.+)"/g, '$1\'$2\'')
                .replace(/(:\s)"{2}/g, '$1\'\'')
                .replace(/([^\\"])("+)/g, replacer)
                .replace(/'(.+)'(:)/g, '"$1"$2')
                .replace(/(:\s)'(.+)'/g, '$1"$2"')
                .replace(/(:\s)'{2}/g, '$1""')
                .replace(/'{2}/g, '\'');
        }
    }
}());
