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
        .component('igzSliderInputBlock', {
            bindings: {
                allowFullRange: '<',
                onChangeCallback: '<',
                onSliderChanging: '<?',
                sliderConfig: '<',
                sliderBlockUpdatingBroadcast: '@',
                measureUnits: '<?',
                valueUnit: '<?',
                updateSliderInput: '@?'
            },
            templateUrl: 'igz_controls/components/slider-input-block/slider-input-block.tpl.html',
            controller: IgzSliderInputBlockController
        });

    function IgzSliderInputBlockController($rootScope, $scope, $timeout, lodash, ConverterService) {
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

            $timeout(function () {

                // Bind needed callbacks to configuration objects with updated `ctrl.selectedData` values (for rz-slider library usage)
                ctrl.sliderConfig.options.onEnd = setValue;
                ctrl.sliderConfig.options.onChange = checkIfUnlimited;
            });

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
         * Calls onSliderChanging method if it was defined
         */
        function checkIfUnlimited() {
            ctrl.sliderConfig.valueLabel =
                (ctrl.sliderConfig.value === ctrl.sliderConfig.options.ceil && !ctrl.allowFullRange) ? 'U/L' : ctrl.sliderConfig.value;

            if (angular.isFunction(ctrl.onSliderChanging) && ctrl.sliderConfig.value !== ctrl.sliderConfig.options.ceil) {
                ctrl.onSliderChanging(ctrl.sliderConfig.value, ctrl.updateSliderInput);
            }

            $timeout(function () {
                $rootScope.$broadcast('rzSliderForceRender');
            });
        }

        /**
         * Update slider data with values from external scope
         */
        function fillRange() {
            if (ctrl.selectedData) {
                var result = ConverterService.getConvertedBytes(ctrl.selectedData[ctrl.sliderConfig.options.id]);

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
            if (!lodash.isNil(ctrl.onChangeCallback)) {
                ctrl.onChangeCallback(ctrl.sliderConfig.value === ctrl.sliderConfig.options.ceil ?
                    null : ctrl.sliderConfig.value * Math.pow(1024, ctrl.sliderConfig.pow), ctrl.updateSliderInput);
            }

            if (!lodash.isNil(ctrl.selectedData)) {
                ctrl.selectedData[ctrl.sliderConfig.options.id] = (ctrl.sliderConfig.value === ctrl.sliderConfig.options.ceil) ?
                    0 : ctrl.sliderConfig.value * Math.pow(1024, ctrl.sliderConfig.pow);
            }
        }
    }
}());
