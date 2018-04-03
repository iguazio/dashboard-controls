(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('igzSliderInputBlock', {
            bindings: {
                measureUnits: '<?',
                sliderConfig: '<',
                sliderBlockUpdatingBroadcast: '@'
            },
            templateUrl: 'slider-input-block/slider-input-block.tpl.html',
            controller: IgzSliderInputBlockController
        });

    function IgzSliderInputBlockController($rootScope, $scope, $timeout, lodash, ConvertorService) {
        var ctrl = this;

        var defaultMeasureUnits = [
            {
                pow: 1,
                name: 'KB/s'
            },
            {
                pow: 2,
                name: 'MB/s'
            },
            {
                pow: 3,
                name: 'GB/s'
            }
        ];

        ctrl.$onInit = onInit;

        ctrl.changeTrafficUnit = changeTrafficUnit;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {

            // Set default measureUnits if undefined
            if (angular.isUndefined(ctrl.measureUnits)) {
                ctrl.measureUnits = defaultMeasureUnits;
            }

            $scope.$on(ctrl.sliderBlockUpdatingBroadcast, setData);

            // Bind needed callbacks to configuration objects with updated `ctrl.selectedData` values (for rz-slider library usage)
            ctrl.sliderConfig.options.onEnd = setValue;
            ctrl.sliderConfig.options.onChange = checkIfUnlimited;

            ctrl.selectedItem = lodash.find(ctrl.measureUnits, ['name', ctrl.sliderConfig.unitLabel]);

            // Update data with values from external scope
            fillRange();
        }

        //
        // Public methods
        //

        /**
         * Method changes measurement unit
         * @param {Object} trafficUnit - selected measurement unit value
         */
        function changeTrafficUnit(trafficUnit) {
            ctrl.sliderConfig.unitLabel = trafficUnit.name;
            ctrl.sliderConfig.pow = trafficUnit.pow;

            setValue();
        }

        //
        // Private methods
        //

        /**
         * Method checks current value in slider. If it's maximum available then 'U/L'(unlimited) sets in label which displays data.
         * If it's not maximum - label sets with new value.
         */
        function checkIfUnlimited() {
            ctrl.sliderConfig.valueLabel = (ctrl.sliderConfig.value === ctrl.sliderConfig.options.ceil) ? 'U/L' : ctrl.sliderConfig.value;

            $timeout(function () {
                $rootScope.$broadcast('rzSliderForceRender');
            });
        }

        /**
         * Update slider data with values from external scope
         */
        function fillRange() {
            if (ctrl.selectedData) {
                var result = ConvertorService.getConvertedBytes(ctrl.selectedData[ctrl.sliderConfig.options.id]);

                ctrl.sliderConfig.value = result.value;
                ctrl.sliderConfig.valueLabel = result.value;
                ctrl.sliderConfig.unitLabel = result.label;
                ctrl.sliderConfig.pow = result.pow;

                ctrl.selectedItem = lodash.find(defaultMeasureUnits, ['name', ctrl.sliderConfig.unitLabel]);

                checkIfUnlimited();
            }
        }

        /**
         * Set slider data with a value passed through broadcast.
         * Set current selected rule to bind data properly.
         * @param {Object} event - triggering event
         * @param {Object} data - passed data
         */
        function setData(event, data) {
            ctrl.selectedData = data.item.attr;

            fillRange();
        }

        /**
         * Method sets new value in bytes
         */
        function setValue() {
            ctrl.selectedData[ctrl.sliderConfig.options.id] = (ctrl.sliderConfig.value === ctrl.sliderConfig.options.ceil) ? 0 :
                ctrl.sliderConfig.value * Math.pow(1024, ctrl.sliderConfig.pow);
        }
    }
}());
