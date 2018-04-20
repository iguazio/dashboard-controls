(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .factory('ConvertorService', ConvertorService);

    function ConvertorService() {
        return {
            getConvertedBytes: getConvertedBytes
        };

        /**
         * Method converts bytes into appropriate value
         * @param {number} bytes - number of bytes
         * @returns {Object} object witch contains converted value, label for converted value and pow number
         */
        function getConvertedBytes(bytes) {
            if (bytes === 0 || !angular.isNumber(bytes) || !isFinite(bytes)) {
                return {value: 1025, label: 'GB/s', pow: 3};
            }

            var units = ['bytes', 'KB/s', 'MB/s', 'GB/s'];
            var number = Math.floor(Math.log(bytes) / Math.log(1024));

            // max available value is 1024 GB/s
            if (number > 3) {
                number = 3;
                bytes = Math.pow(1024, Math.floor(number + 1));
            }

            return {value: Math.round(bytes / Math.pow(1024, Math.floor(number))), label: units[number], pow: number};
        }
    }
}());

