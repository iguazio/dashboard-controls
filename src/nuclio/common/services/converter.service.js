/* eslint-disable */

(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .factory('ConverterService', ConverterService);

    function ConverterService(lodash) {
        return {
            getConvertedBytes: getConvertedBytes,
            fromNumberArray: fromNumberArray,
            toNumberArray: toNumberArray,
            toStringArray: toStringArray
        };

        //
        // Public methods
        //

        /**
         * Method converts bytes into appropriate value
         * @param {number} bytes - number of bytes
         * @param {Array} [unit] - units
         * @returns {Object} object witch contains converted value, label for converted value and pow number
         */
        function getConvertedBytes(bytes, unit) {
            if (bytes === 0 || !angular.isNumber(bytes) || !isFinite(bytes)) {
                if (angular.isDefined(unit)) {
                    return {
                        value: 0,
                        label: lodash.first(unit),
                        pow: 0
                    };
                }

                return {
                    value: 1025,
                    label: angular.isDefined(unit) ? lodash.last(unit) : 'GB/s',
                    pow: 3
                };
            }

            var units = lodash.defaultTo(unit, ['bytes', 'KB/s', 'MB/s', 'GB/s']);
            var number = Math.floor(Math.log(bytes) / Math.log(1024));

            // max available value is 1024 GB/s
            if (number > 3) {
                number = 3;
                bytes = Math.pow(1024, Math.floor(number + 1));
            }

            return {value: Math.round(bytes / Math.pow(1024, Math.floor(number))), label: units[number], pow: number};
        }

        /**
         * Converts an array of `Number`s to a comma-delimited string of numbers and number ranges (X-Y).
         * @param {Array.<Number>} array - A list of natural numbers.
         * @returns {string} a comma-delimited string of numbers and number ranges representing `array`.
         * @example
         * fromNumberArray([1, 2, 3, 4, 7, 9, 10, 12]);
         * // => '1-4,7,9-10,12'
         *
         * fromNumberArray([3, 5, 7]);
         * // => '3,5,7'
         *
         * fromNumberArray([5, 6, 7, 8, 9, 10, 11]);
         * // => '5-11'
         */
        function fromNumberArray(array) {
            var sorted = lodash.sortBy(lodash.uniq(array));
            var result = [];
            var start = 0;

            while (start < sorted.length) {
                var range = lodash.takeWhile(sorted.slice(start), function (value, index, collection) {
                    return index === 0 || value - collection[index - 1] === 1;
                });
                result.push(lodash.head(range) + (range.length > 1 ? '-' + lodash.last(range) : ''));
                start += range.length;
            }

            return result.join(',');
        }

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

        /**
         * Converts a `string` consisting of a comma-delimited list into an array of strings (whitespace is trimmed).
         * If `value` is not a `string`, it will be returned as-is.
         * @param {string|*} value - the string to convert.
         * @returns {Array.<string>|*} an array of strings representing the comma-delimited list in `value`, or `value`
         *     as-is if it is not a `string`.
         * @example
         * toStringArray('  foo,bar   ,  baz,  waz  ,bla  ');
         * // => ['foo', 'bar', 'baz', 'waz', 'bla']
         *
         * toStringArray('  ,  ');
         * // => []
         *
         * toStringArray('    ');
         * // => []
         *
         * toStringArray('');
         * // => []
         *
         * toStringArray(123);
         * // => 123
         *
         * toStringArray(false);
         * // => false
         *
         * toStringArray({ foo: 'bar' });
         * // => { foo: 'bar' }
         *
         * toStringArray([123, 456]);
         * // => [123, 456]
         *
         * toStringArray(/abc/g);
         * // => abc/g
         *
         * toStringArray(null);
         * // => null
         *
         * toStringArray(undefined);
         * // => undefined
         */
        function toStringArray(value) {
            return lodash.isString(value) ? lodash.without(value.trim().split(/\s*,\s*/), '') : value;
        }
    }
}());
