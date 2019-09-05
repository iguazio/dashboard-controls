(function () {
    'use strict';

    angular.module('iguazio.app')
        .filter('scale', scale);

    function scale() {
        return function (pointValue) {
            return pointValue >= 1000000 ? (pointValue / 1000000).toFixed(2) + ' M' :
                   pointValue >= 1000    ? (pointValue / 1000).toFixed(2)    + ' K' :
                   pointValue >= 0.05    ?  pointValue.toFixed(1)                   :
                   /* pointValue === 0 */   '0';
        };
    }
}());
