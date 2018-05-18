(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclVersionConfigurationResources', {
            bindings: {
                version: '<',
                onChangeCallback: '<'
            },
            templateUrl: 'nuclio/projects/project/functions/version/version-configuration/tabs/version-configuration-resources/version-configuration-resources.tpl.html',
            controller: NclVersionConfigurationResourcesController
        });

    function NclVersionConfigurationResourcesController($timeout, $rootScope, lodash, ConfigService) {
        var ctrl = this;

        ctrl.isDemoMode = ConfigService.isDemoMode;

        ctrl.$onInit = onInit;
        ctrl.$onDestroy = onDestroy;

        ctrl.initSliders = initSliders;
        ctrl.onSliderChanging = onSliderChanging;
        ctrl.numberInputCallback = numberInputCallback;
        ctrl.sliderInputCallback = sliderInputCallback;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            var limits = lodash.get(ctrl.version.spec, 'resources.limits');

            ctrl.initSliders();

            if (!lodash.isNil(limits)) {
                ctrl.version.spec.resources.limits = lodash.mapValues(limits, function (item) {
                    return Number(item);
                });
            }

            ctrl.minReplicas = lodash.chain(ctrl.version).get('spec.minReplicas').defaultTo(1).value();
            ctrl.maxReplicas = lodash.chain(ctrl.version).get('spec.maxReplicas').defaultTo(1).value();
        }

        /**
         * On destroy method
         */
        function onDestroy() {
            $rootScope.$broadcast('change-state-deploy-button', {component: 'resources', isDisabled: false});
        }

        //
        // Public methods
        //

        /**
         * Inits data for sliders
         */
        function initSliders() {
            // maximum value of memory in megabytes
            var maxMemoryValueInMB = 4096;
            // maximum value of memory in gigabytes
            var maxMemoryValueInGB = 33;
            // maximum value of CPU
            var maxCPUvalue = 65;
            var memory = lodash.get(ctrl.version.spec, 'resources.limits.memory');
            // gets the memory value in bytes
            var memoryBytes = parseInt(lodash.get(ctrl.version.spec, 'resources.limits.memory', Math.pow(1024, 2) * maxMemoryValueInGB));
            // converts memory value from bytes to megabytes
            var memoryValue = lodash.round(memoryBytes / Math.pow(1024, 2));
            var memoryValueLabel = null;
            // gets the cpu value
            var cpuValue = lodash.get(ctrl.version.spec, 'resources.limits.cpu', maxCPUvalue);
            // sets to the cpu label - cpu value if exists or U/L (unlimited) if doesn't
            var cpuValueLabel = lodash.get(ctrl.version.spec, 'resources.limits.cpu', 'U/L');
            var targetCPUvalue = lodash.get(ctrl.version, 'spec.targetCPU', 75);

            // converts memory value from megabytes to gigabytes if value too big
            if (memoryValue <= maxMemoryValueInMB) {
                ctrl.memoryValueUnit = 'MB';
            } else {
                memoryValue = lodash.round(memoryValue / 1024);
                ctrl.memoryValueUnit = 'GB';
            }
            // sets to the memory label - memory value if exists or U/L (unlimited) if doesn't
            memoryValueLabel = angular.isDefined(memory) ? memoryValue : 'U/L';

            ctrl.targetValueUnit = '%';
            ctrl.memorySliderConfig = {
                name: 'Memory',
                value: memoryValue,
                valueLabel: memoryValueLabel,
                valueUnit: ctrl.memoryValueUnit,
                pow: 2,
                unitLabel: '',
                labelHelpIcon: false,
                options: {
                    floor: 128,
                    ceil: maxMemoryValueInGB,
                    stepsArray: initMemorySteps(),
                    showSelectionBar: false,
                    onChange: null,
                    onEnd: null
                }
            };
            ctrl.cpuSliderConfig = {
                name: 'CPU',
                value: cpuValue,
                valueLabel: cpuValueLabel,
                pow: 0,
                unitLabel: '',
                labelHelpIcon: false,
                options: {
                    floor: 1,
                    id: 'cpu',
                    ceil: maxCPUvalue,
                    step: 1,
                    precision: 1,
                    showSelectionBar: false,
                    onChange: null,
                    onEnd: null
                }
            };
            ctrl.targetCpuSliderConfig = {
                name: 'Target CPU',
                value: targetCPUvalue,
                valueLabel: targetCPUvalue,
                pow: 0,
                unitLabel: '%',
                labelHelpIcon: false,
                options: {
                    floor: 1,
                    id: 'targetCPU',
                    ceil: 100,
                    step: 1,
                    showSelectionBar: false,
                    onChange: null,
                    onEnd: null
                }
            };
            ctrl.defaultMemoryMeasureUnits = [
                {
                    pow: 2,
                    name: 'MB'
                }
            ];
        }

        /**
         * Handles all slider changes
         * @param {number} newValue
         * @param {string} field
         */
        function onSliderChanging(newValue, field) {
            if (lodash.includes(field, 'memory')) {
                var rangeInGB = {
                    start: 5,
                    end: 33
                };

                // there are two ranges:
                // 128 - 4096 MB
                // 5 - 32 GB
                if (lodash.inRange(newValue, rangeInGB.start, rangeInGB.end)) {
                    ctrl.memorySliderConfig.pow = 3;
                    ctrl.memoryValueUnit = 'GB';
                } else {
                    ctrl.memorySliderConfig.pow = 2;
                    ctrl.memoryValueUnit = 'MB';
                }
            }
        }

        /**
         * Update data callback
         * @param {string} newData
         * @param {string} field
         */
        function numberInputCallback(newData, field) {
            ctrl[field] = newData;
            $timeout(function () {
                if (ctrl.resourcesForm.$valid) {
                    lodash.set(ctrl.version.spec, 'minReplicas', ctrl.minReplicas);
                    lodash.set(ctrl.version.spec, 'maxReplicas', ctrl.maxReplicas);
                    $rootScope.$broadcast('change-state-deploy-button', {component: 'resources', isDisabled: false});
                    ctrl.onChangeCallback();
                } else {
                    $rootScope.$broadcast('change-state-deploy-button', {component: 'resources', isDisabled: true});
                }
            })
        }

        /**
         * Update limits callback
         * @param {number} newValue
         * @param {string} field
         */
        function sliderInputCallback(newValue, field) {
            if (lodash.isNil(newValue)) {
                lodash.unset(ctrl.version, field);
            } else {
                lodash.set(ctrl.version, field, Number(newValue));
            }

            ctrl.onChangeCallback();
        }

        //
        // Private methods
        //

        /**
         * Creates array of memory slider steps
         * @returns {Array}
         */
        function initMemorySteps() {
            var stepsArray = [];
            var value = 128;

            // array of limits and steps
            var limits = {
                firstLimit: {
                    limit: 512,
                    step: 128
                },
                secondLimit: {
                    limit: 1024,
                    step: 256
                },
                thirdLimit: {
                    limit: 4096,
                    step: 512
                },
                lastLimit: {
                    limit: 33280,
                    step: 1024
                }
            };
            stepsArray.push(value);

            while (value < limits.lastLimit.limit) {

                // if value suits limit - increase value on current step
                // step will be 128 if value < 512
                // 256 if value < 1024
                // 512 if value < 4096
                // and 1024 from 1024 to 32 * 1024
                if (value < limits.firstLimit.limit) {
                    value += limits.firstLimit.step;
                } else if (value < limits.secondLimit.limit) {
                    value += limits.secondLimit.step;
                } else if (value < limits.thirdLimit.limit) {
                    value += limits.thirdLimit.step;
                } else {
                    value += limits.lastLimit.step;
                }

                // converts value to GB if it greater than 4096MB
                stepsArray.push(value <= limits.thirdLimit.limit ? value : value / 1024);
            }
            return stepsArray;
        }
    }
}());
