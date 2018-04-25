/* eslint-disable */

(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .factory('ConverterService', ConverterService);

    function ConverterService(lodash) {
        return {
            toNumberArray: toNumberArray
        };

        //
        // Public methods
        //

        /**
         * Converts a comma-delimited string of numbers and number ranges (X-Y) to an array of `Number`s
         * @param {string} ranges - a comma-separated string (might pad commas with spaces) consisting of either
         *     a single number, or two numbers with a hyphen between them, where the smaller number comes first
         *     (ranges where the first number is smaller than the second number will be ignored)
         * @returns {Array.<number>} an array of numbers representing all the numbers referenced in `ranges` param
         **/
        function toNumberArray(ranges) {
            return lodash.chain(ranges)
                .replace(/\s+/g, '') // get rid of all white-space characters
                .trim(',') // get rid of leading and trailing commas
                .split(',') // get an array of strings, for each string that is between two comma delimiters
                .map(function (range) { // for each string - convert it to a number or an array of numbers
                    // if it is a sequence of digits - convert it to a `Number` value and return it
                    if (/^\d+$/g.test(range)) {
                        return Number(range);
                    }

                    // otherwise, attempt to parse it as a range of numbers (two sequences of digits delimited by a
                    // single hyphen)
                    var matches = range.match(/^(\d+)-(\d+)$/);

                    // attempt to convert both sequences of digits to `Number` values
                    var start = Number(lodash.get(matches, '[1]'));
                    var end = Number(lodash.get(matches, '[2]'));

                    // if any attempt above fails - return `null` to indicate a value that needs to be ignored later
                    // otherwise, return a range of `Number`s represented by that range
                    // (e.g. `'1-3'` is `[1, 2, 3]`)
                    return (Number.isNaN(start) || Number.isNaN(end) || start > end)
                        ? null
                        : lodash.range(start, end + 1);
                })
                .flatten() // make a single flat array (e.g. `[1, [2, 3], 4, [5, 6]]` to `[1, 2, 3, 4, 5, 6]`)
                .without(false, null, '', undefined, NaN) // get rid of `null` values (e.g. `[null, 1, null, 2, 3, null]` to `[1, 2, 3]`)
                .uniq() // get rid of duplicate values (e.g. `[1, 2, 2, 3, 4, 4, 5]` to `[1, 2, 3, 4, 5]`)
                .sortBy() // sort the list in ascending order (e.g. `[4, 1, 5, 3, 2, 6]` to`[1, 2, 3, 4, 5, 6]`)
                .value();
        }
    }
}());
