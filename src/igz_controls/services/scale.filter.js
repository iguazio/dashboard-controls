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
        .filter('scale', scale);

    function scale(lodash) {
        var unitsConfig = {
            'nanos': [
                { threshold: 1000000000, unit: '' },
                { threshold: 1000000, unit: 'm' },
                { threshold: 1000, unit: 'µ' },
                { threshold: 0.05, unit: 'n', divisor: 1 },
                '0'
            ],
            'default': [
                { threshold: 1000000000, unit: ' G', precision: 2 },
                { threshold: 1000000, unit: ' M', precision: 2 },
                { threshold: 1000, unit: ' K', precision: 2 },
                { threshold: 1, unit: '', precision: 0 },
                { threshold: 0.05, unit: '', precision: 1, divisor: 1 },
                '0'
            ]
        };

        return function (value, precision, type) {
            var units = lodash.defaultTo(unitsConfig[type], unitsConfig.default);
            var step = lodash.find(units, function (item) {
                return value >= item.threshold;
            });

            if (lodash.isUndefined(step)) {
                return lodash.last(units);
            }

            var precisionToUse = lodash.defaultTo(lodash.defaultTo(precision, step.precision), 0);

            return (value / lodash.defaultTo(step.divisor, step.threshold)).toFixed(precisionToUse) + step.unit;
        };
    }
}());
