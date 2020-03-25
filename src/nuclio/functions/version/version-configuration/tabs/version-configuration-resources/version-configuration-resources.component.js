(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclVersionConfigurationResources', {
            bindings: {
                version: '<',
                onChangeCallback: '<'
            },
            templateUrl: 'nuclio/functions/version/version-configuration/tabs/version-configuration-resources/version-configuration-resources.tpl.html',
            controller: NclVersionConfigurationResourcesController
        });

    function NclVersionConfigurationResourcesController($i18next, $timeout, $rootScope, $scope, i18next, lodash,
                                                        ConfigService) {
        var ctrl = this;
        var lng = i18next.language;

        var defaultUnit = {
            id: 'gb',
            name: 'GB',
            unit: 'G',
            root: 1000,
            power: 3
        };
        var scaleResourcesCopy = [];
        var scaleToZero = {};

        ctrl.cpuDropdownOptions = [
            {
                id: 'millicores',
                name: 'millicpu',
                unit: 'm',
                precision: '0',
                step: '100',
                minValue: 1,
                placeholder: $i18next.t('common:FOR_EXAMPLE', {lng: lng}) + ': 1500',
                onChange: function (value) {
                    return parseFloat(value) * 1000;
                },
                convertValue: function (value) {
                    return parseInt(value);
                }
            },
            {
                id: 'cpu',
                name: 'cpu',
                unit: '',
                precision: '3',
                step: '0.1',
                minValue: 0.1,
                placeholder: $i18next.t('common:FOR_EXAMPLE', {lng: lng}) + ': 1.5',
                onChange: function (value) {
                    return parseInt(value) / 1000;
                },
                convertValue: function (value) {
                    return parseFloat(value) * 1000;
                }
            }
        ];

        ctrl.dropdownOptions = [
            { id: 'bytes', name: 'Bytes', unit: '',   root: 0,    power: 0 },
            { id: 'kb',    name: 'KB',    unit: 'k',  root: 1000, power: 1 },
            { id: 'kib',   name: 'KiB',   unit: 'Ki', root: 1024, power: 1 },
            { id: 'mb',    name: 'MB',    unit: 'M',  root: 1000, power: 2 },
            { id: 'mib',   name: 'MiB',   unit: 'Mi', root: 1024, power: 2 },
            { id: 'gb',    name: 'GB',    unit: 'G',  root: 1000, power: 3 },
            { id: 'gib',   name: 'GiB',   unit: 'Gi', root: 1024, power: 3 },
            { id: 'tb',    name: 'TB',    unit: 'T',  root: 1000, power: 4 },
            { id: 'tib',   name: 'TiB',   unit: 'Ti', root: 1024, power: 4 },
            { id: 'pb',    name: 'PB',    unit: 'P',  root: 1000, power: 5 },
            { id: 'pib',   name: 'PiB',   unit: 'Pi', root: 1024, power: 5 },
            { id: 'eb',    name: 'EB',    unit: 'E',  root: 1000, power: 6 },
            { id: 'eib',   name: 'EiB',   unit: 'Ei', root: 1024, power: 6 }
        ];
        ctrl.windowSizeSlider = {};

        ctrl.isDemoMode = ConfigService.isDemoMode;

        ctrl.$onInit = onInit;
        ctrl.$onDestroy = onDestroy;

        ctrl.numberInputCallback = numberInputCallback;
        ctrl.sliderInputCallback = sliderInputCallback;

        ctrl.cpuDropdownCallback = cpuDropdownCallback;
        ctrl.memoryInputCallback = memoryInputCallback;
        ctrl.memoryDropdownCallback = memoryDropdownCallback;
        ctrl.inputGpuValueCallback = inputGpuValueCallback;
        ctrl.inputValueCallback = inputValueCallback;
        ctrl.isInactivityWindowShown = isInactivityWindowShown;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            initParametersData();
            initTargetCpuSlider();

            ctrl.minReplicas = lodash.get(ctrl.version, 'spec.minReplicas');
            ctrl.maxReplicas = lodash.get(ctrl.version, 'spec.maxReplicas');

            initScaleToZeroData();

            $timeout(function () {
                setFormValidity();
                checkIfCpuInputsValid();

                $scope.$watch('$ctrl.resourcesForm.$invalid', function (value) {
                    $rootScope.$broadcast('change-state-deploy-button', {
                        component: 'resources',
                        isDisabled: value
                    });
                });
            });
        }

        /**
         * On destroy method
         */
        function onDestroy() {
            $rootScope.$broadcast('change-state-deploy-button', {
                component: 'resources',
                isDisabled: lodash.get(ctrl.resourcesForm, '$invalid', false)
            });
        }

        //
        // Public methods
        //

        /**
         * CPU dropdown callback
         * @param {Object} item
         * @param {boolean} isItemChanged
         * @param {string} field
         */
        function cpuDropdownCallback(item, isItemChanged, field) {
            if (!lodash.isEqual(item, ctrl[field])) {
                if (isRequestsInput(field)) {
                    if (ctrl.requestsCpuValue) {
                        ctrl.requestsCpuValue = item.onChange(ctrl.requestsCpuValue);
                        lodash.set(ctrl.version, 'spec.resources.requests.cpu', ctrl.requestsCpuValue + item.unit);
                    }
                } else if (ctrl.limitsCpuValue) {
                    ctrl.limitsCpuValue = item.onChange(ctrl.limitsCpuValue);
                    lodash.set(ctrl.version, 'spec.resources.limits.cpu', ctrl.limitsCpuValue + item.unit);
                }

                lodash.set(ctrl, field, item);

                checkIfCpuInputsValid();
            }
        }

        /**
         * Number input callback for GPU fields
         * @param {number} newData
         * @param {string} field
         */
        function inputGpuValueCallback(newData, field) {
            if (angular.isNumber(newData)) {
                ctrl.limitsGpuValue = newData;

                lodash.set(ctrl.version, ['spec', 'resources', field, 'nvidia.com/gpu'], String(newData));
                ctrl.onChangeCallback();
            } else {
                lodash.unset(ctrl.version, ['spec', 'resources', field, 'nvidia.com/gpu']);
                ctrl.limitsGpuValue = null;
            }
        }

        /**
         * Number input callback
         * @param {number} newData
         * @param {string} field
         */
        function inputValueCallback(newData, field) {
            if (angular.isNumber(newData)) {
                if (isRequestsInput(field)) {
                    ctrl.requestsCpuValue = newData;
                    newData = newData + ctrl.selectedCpuRequestItem.unit;
                } else {
                    ctrl.limitsCpuValue = newData;
                    newData = newData + ctrl.selectedCpuLimitItem.unit;
                }

                lodash.set(ctrl.version, 'spec.' + field, newData);
                ctrl.onChangeCallback();
            } else {
                lodash.unset(ctrl.version, 'spec.' + field);
                ctrl[isRequestsInput(field) ? 'requestsCpuValue' : 'limitsCpuValue'] = null;
            }

            checkIfCpuInputsValid();
        }

        /**
         * Checks whether the inactivity window can be shown
         * @returns {boolean}
         */
        function isInactivityWindowShown() {
            return ConfigService.isDemoMode() && lodash.get(scaleToZero, 'mode') === 'enabled';
        }

        /**
         * Memory number input callback
         * @param {number} newData
         * @param {string} field
         */
        function memoryInputCallback(newData, field) {
            var newValue, sizeUnit;

            sizeUnit = isRequestsInput(field) ? lodash.get(ctrl.selectedRequestUnit, 'unit', 'G') :
                                                lodash.get(ctrl.selectedLimitUnit, 'unit', 'G');

            if (!angular.isNumber(newData)) {
                lodash.unset(ctrl.version, field);

                // if new value isn't number that both fields will be valid, because one of them is empty
                ctrl.resourcesForm.requestMemory.$setValidity('equality', true);
                ctrl.resourcesForm.limitsMemory.$setValidity('equality', true);
            } else {
                newValue = newData + sizeUnit;
                lodash.set(ctrl.version, field, newValue);

                checkIfMemoryInputsValid(newValue, field);
            }

            ctrl.onChangeCallback();
        }

        /**
         * Memory dropdown callback
         * @param {Object} item
         * @param {boolean} isItemChanged
         * @param {string} field
         */
        function memoryDropdownCallback(item, isItemChanged, field) {
            var sizeValue = lodash.parseInt(lodash.get(ctrl.version, field, ' 0G'));
            var newValue;

            if (lodash.includes(field, 'requests')) {
                ctrl.selectedRequestUnit = item;
            } else if (lodash.includes(field, 'limits')) {
                ctrl.selectedLimitUnit = item;
            }

            if (!angular.isNumber(sizeValue) || lodash.isNaN(sizeValue)) {
                lodash.unset(ctrl.version, field);
            } else {
                newValue = sizeValue + item.unit;
                lodash.set(ctrl.version, field, newValue);

                checkIfMemoryInputsValid(newValue, field);
            }

            ctrl.onChangeCallback();
        }

        /**
         * Update data callback
         * @param {string|number} newData
         * @param {string} field
         */
        function numberInputCallback(newData, field) {
            if (lodash.isNil(newData) || newData === '') {
                lodash.unset(ctrl.version.spec, field);
            } else {
                lodash.set(ctrl.version.spec, field, newData);
            }

            lodash.set(ctrl, field, newData);

            if (field === 'minReplicas' && isInactivityWindowShown()) {
                updateScaleToZeroParameters();
            }

            if (lodash.includes(['minReplicas', 'maxReplicas'], field)) {
                updateTargetCpuSlider();
            }

            ctrl.onChangeCallback();
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
         * Checks if cpu number inputs and drop-downs valid
         * Example:
         * Request: "400m" - Limit: "0.6" are valid
         * Request: "300m" - Limit: "0.2" are invalid
         */
        function checkIfCpuInputsValid() {
            var requestsCpu = lodash.get(ctrl.version, 'spec.resources.requests.cpu');
            var limitsCpu = lodash.get(ctrl.version, 'spec.resources.limits.cpu');
            var isFieldsValid;

            if (lodash.isNil(requestsCpu) || lodash.isNil(limitsCpu)) {
                isFieldsValid = true;
            } else {
                isFieldsValid = ctrl.selectedCpuRequestItem.convertValue(requestsCpu) <= ctrl.selectedCpuLimitItem.convertValue(limitsCpu);
            }

            ctrl.resourcesForm.requestCpu.$setValidity('equality', isFieldsValid);
            ctrl.resourcesForm.limitsCpu.$setValidity('equality', isFieldsValid);
        }

        /**
         * Checks if memory number inputs and drop-downs valid
         * Example:
         * Request: "4GB" - Limit: "6GB" are valid
         * Request: "4TB" - Limit: "6GB" are invalid
         * @param {string} value
         * @param {string} field
         */
        function checkIfMemoryInputsValid(value, field) {

            // oppositeValue is a variable for opposite field of current value
            // if value argument is a value of 'Request' field that 'oppositeValue' will contain value of 'Limit' field
            var oppositeValue;
            var isFieldsValid;

            if (lodash.includes(field, 'requests')) {
                oppositeValue = lodash.get(ctrl.version, 'spec.resources.limits.memory');

                // compare 'Request' and 'Limit' fields values converted in bytes
                isFieldsValid = lodash.isNil(oppositeValue) ? true : convertToBytes(value) <= convertToBytes(oppositeValue);
            } else if (lodash.includes(field, 'limits')) {
                oppositeValue = lodash.get(ctrl.version, 'spec.resources.requests.memory');

                // compare 'Request' and 'Limit' fields values converted in bytes
                isFieldsValid = lodash.isNil(oppositeValue) ? true : convertToBytes(value) >= convertToBytes(oppositeValue);
            }

            ctrl.resourcesForm.requestMemory.$setValidity('equality', isFieldsValid);
            ctrl.resourcesForm.limitsMemory.$setValidity('equality', isFieldsValid);
        }

        /**
         * Converts megabytes, gigabytes and terabytes into bytes
         * @param {string} value
         * @returns {number}
         */
        function convertToBytes(value) {
            var unit = extractUnit(value);
            var unitData = lodash.find(ctrl.dropdownOptions, ['unit', unit]);

            return parseInt(value) * Math.pow(unitData.root, unitData.power);
        }

        /**
         * Extracts the unit part of a string consisting of a numerical value then a unit.
         * @param {string} str - the string with value and unit.
         * @returns {string} the unit, or the empty-string if unit does not exist in the `str`.
         * @example
         * extractUnit('100 GB');
         * // => 'GB'
         *
         * extractUnit('100GB');
         * // => 'GB'
         *
         * extractUnit('100');
         * // => ''
         */
        function extractUnit(str) {
            return lodash.get(str.match(/[a-zA-Z]+/), '[0]', '');
        }

        /**
         * Init default common parameters for new version
         */
        function initParametersData() {
            var requestsMemory = lodash.get(ctrl.version, 'spec.resources.requests.memory');
            var limitsMemory   = lodash.get(ctrl.version, 'spec.resources.limits.memory');
            var requestsCpu    = lodash.get(ctrl.version, 'spec.resources.requests.cpu');
            var limitsCpu      = lodash.get(ctrl.version, 'spec.resources.limits.cpu');
            var limitsGpu      = lodash.get(ctrl.version, ['spec', 'resources', 'limits', 'nvidia.com/gpu']);

            ctrl.requestsMemoryValue = parseValue(requestsMemory);
            ctrl.limitsMemoryValue   = parseValue(limitsMemory);
            ctrl.requestsCpuValue    = parseValue(requestsCpu);
            ctrl.limitsCpuValue      = parseValue(limitsCpu);
            ctrl.limitsGpuValue      = parseValue(limitsGpu);

            // get size unit from memory values into int or set default, example: '15G' -> 'G'
            ctrl.selectedRequestUnit = lodash.isNil(requestsMemory) ? defaultUnit :
                lodash.find(ctrl.dropdownOptions, ['unit', extractUnit(requestsMemory)]);
            ctrl.selectedLimitUnit = lodash.isNil(limitsMemory) ? defaultUnit :
                lodash.find(ctrl.dropdownOptions, ['unit', extractUnit(limitsMemory)]);

            ctrl.selectedCpuRequestItem = lodash.isNil(requestsCpu) ? ctrl.cpuDropdownOptions[0] :
                lodash.find(ctrl.cpuDropdownOptions, ['unit', extractUnit(requestsCpu)]);
            ctrl.selectedCpuLimitItem = lodash.isNil(limitsCpu) ? ctrl.cpuDropdownOptions[0] :
                lodash.find(ctrl.cpuDropdownOptions, ['unit', extractUnit(limitsCpu)]);

            function parseValue(value) {
                if (lodash.isNil(value)) {
                    return null;
                }
                var parsedValue = parseFloat(value);

                return parsedValue > 0 ? parsedValue : null;
            }
        }

        /**
         * Initializes Target CPU slider.
         */
        function initTargetCpuSlider() {
            ctrl.targetCpuValueUnit = '';
            ctrl.targetCpuSliderConfig = {
                value: 75,
                valueLabel: 'disabled',
                pow: 0,
                unitLabel: '%',
                labelHelpIcon: false,
                options: {
                    disabled: true,
                    floor: 1,
                    id: 'targetCPU',
                    ceil: 100,
                    step: 1,
                    showSelectionBar: true
                }
            };

            updateTargetCpuSlider();
        }

        /**
         * Updates Target CPU slider state (enabled/disabled) and display value.
         */
        function updateTargetCpuSlider() {
            var minReplicas = lodash.get(ctrl.version, 'spec.minReplicas');
            var maxReplicas = lodash.get(ctrl.version, 'spec.maxReplicas');
            var disabled = !lodash.isNumber(minReplicas) || !lodash.isNumber(maxReplicas) || maxReplicas <= 1 ||
                minReplicas === maxReplicas;
            var targetCpuValue = lodash.get(ctrl.version, 'spec.targetCPU', 75);

            ctrl.targetCpuValueUnit = disabled ? '' : '%';
            lodash.merge(ctrl.targetCpuSliderConfig, {
                value: targetCpuValue,
                valueLabel: disabled ? 'disabled' : targetCpuValue,
                options: {
                    disabled: disabled
                }
            });
        }

        /**
         * Initializes data for "Scale to zero" section
         */
        function initScaleToZeroData() {
            scaleToZero = lodash.get(ConfigService, 'nuclio.scaleToZero', {});

            if (!lodash.isEmpty(scaleToZero)) {
                scaleResourcesCopy = lodash.get(ctrl.version, 'spec.scaleToZero.scaleResources', scaleToZero.scaleResources);

                updateScaleToZeroParameters();
            }
        }

        /**
         * Checks if input is related to `CPU Request`
         * @param {string} field
         */
        function isRequestsInput(field) {
            return lodash.includes(field.toLowerCase(), 'request');
        }

        /**
         * Show form errors if form is invalid
         */
        function setFormValidity() {
            lodash.forEach(['requestMemory', 'limitsMemory', 'requestCpu', 'limitsCpu',
                'limitsGpu', 'minReplicas', 'maxReplicas'], prepareToValidity);

            var path = 'spec.resources.requests.memory';
            checkIfMemoryInputsValid(lodash.get(ctrl.version, path, '0'), path);

            /**
             * Set `dirty` to true and `ctrl.numberInputChanged` of `number-input.component` to true
             * for remove `pristine` css class
             */
            function prepareToValidity(field) {
                if (angular.isDefined(ctrl.resourcesForm[field])) {
                    ctrl.resourcesForm[field].$dirty = true;
                    ctrl.resourcesForm[field].$$element.scope().$ctrl.numberInputChanged = true;
                }
            }
        }

        /**
         * Updates parameters for "Scale to zero" section
         */
        function updateScaleToZeroParameters() {
            if (!ConfigService.isDemoMode()) {
                return;
            }

            lodash.defaultsDeep(ctrl.version, {
                ui: {
                    scaleToZero: {
                        scaleResources: scaleResourcesCopy
                    }
                }
            });

            var scaleResources = lodash.get(ctrl.version, 'ui.scaleToZero.scaleResources');

            if (ctrl.minReplicas === 0) {
                lodash.set(ctrl.version, 'spec.scaleToZero.scaleResources', scaleResources);
            } else {
                lodash.unset(ctrl.version, 'spec.scaleToZero');
            }

            var maxWindowSize = lodash.chain(scaleResources)
                .maxBy(function (value) {
                    return parseInt(value.windowSize);
                })
                .get('windowSize')
                .value();

            ctrl.windowSizeSlider = {
                value: maxWindowSize,
                options: {
                    stepsArray: scaleToZero.inactivityWindowPresets,
                    showTicks: true,
                    showTicksValues: true,
                    disabled: ctrl.minReplicas > 0,
                    onChange: function (_, newValue) {
                        lodash.forEach(scaleResources, function (value) {
                            value.windowSize = newValue;
                        });

                        if (ctrl.minReplicas === 0) {
                            lodash.set(ctrl.version, 'spec.scaleToZero.scaleResources', scaleResources);
                        }
                    }
                }
            }
        }
    }
}());
