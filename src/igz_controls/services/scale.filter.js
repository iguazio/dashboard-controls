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
                { threshold: 0.05, unit: 'n' },
                '0'
            ],
            'default': [
                { threshold: 1000000000, unit: ' G', precision: 2 },
                { threshold: 1000000, unit: ' M', precision: 2 },
                { threshold: 1000, unit: ' K', precision: 2 },
                { threshold: 0.05, unit: '', precision: 1 },
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
            return (value / step.threshold).toFixed(precisionToUse) + step.unit;
        };
    }
}());
