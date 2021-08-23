/* eslint max-statements: ["error", 60] */
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

    function NclVersionConfigurationResourcesController($i18next, $rootScope, $scope, $stateParams, $timeout, i18next,
                                                        lodash, ConfigService, DialogsService, FormValidationService,
                                                        ValidationService) {
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
                placeholder: '1500',
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
                placeholder: '1.5',
                onChange: function (value) {
                    return parseInt(value) / 1000;
                },
                convertValue: function (value) {
                    return parseFloat(value) * 1000;
                }
            }
        ];

        ctrl.defaultFunctionConfig = lodash.get(ConfigService, 'nuclio.defaultFunctionConfig.attributes', {});

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
        ctrl.nodeSelectors = [];
        ctrl.nodeSelectorsValidationRules = {
            key: [
                {
                    name: 'uniqueness',
                    label: $i18next.t('functions:UNIQUENESS', {lng: lng}),
                    pattern: validateNodeSelectorUniqueness
                }
            ],
            value: ValidationService.getValidationRules('k8s.qualifiedName')
        };
        ctrl.revertToDefaultsBtnIsHidden = true;
        ctrl.windowSizeSlider = {};

        ctrl.$onInit = onInit;
        ctrl.$onChanges = onChanges;
        ctrl.$onDestroy = onDestroy;

        ctrl.addNewNodeSelector = addNewNodeSelector;
        ctrl.cpuDropdownCallback = cpuDropdownCallback;
        ctrl.cpuInputCallback = cpuInputCallback;
        ctrl.gpuInputCallback = gpuInputCallback;
        ctrl.handleNodeSelectorsAction = handleNodeSelectorsAction;
        ctrl.handleRevertToDefaultsClick = handleRevertToDefaultsClick;
        ctrl.isInactivityWindowShown = isInactivityWindowShown;
        ctrl.memoryDropdownCallback = memoryDropdownCallback;
        ctrl.memoryInputCallback = memoryInputCallback;
        ctrl.onChangeNodeSelectorsData = onChangeNodeSelectorsData;
        ctrl.replicasInputCallback = replicasInputCallback;
        ctrl.sliderInputCallback = sliderInputCallback;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            initTargetCpuSlider();

            ctrl.memoryWarningOpen = false;

            $timeout(function () {
                $scope.$watch('$ctrl.resourcesForm.$invalid', function (value) {
                    $rootScope.$broadcast('change-state-deploy-button', {
                        component: 'resources',
                        isDisabled: value
                    });
                });
            });
        }

        /**
         * On changes hook method.
         * @param {Object} changes
         */
        function onChanges(changes) {
            if (angular.isDefined(changes.version)) {
                initParametersData();
                updateTargetCpuSlider();

                ctrl.minReplicas = lodash.get(ctrl.version, 'spec.minReplicas');
                ctrl.maxReplicas = lodash.get(ctrl.version, 'spec.maxReplicas');

                initScaleToZeroData();
                initNodeSelectors();

                $timeout(function () {
                    setFormValidity();
                    checkIfCpuInputsValid();
                });
            }
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
         * Adds new node selector
         * param {Event} event - native event object
         */
        function addNewNodeSelector(event) {
            $timeout(function () {
                if (ctrl.nodeSelectors.length < 1 || lodash.last(ctrl.nodeSelectors).ui.isFormValid) {
                    ctrl.nodeSelectors.push({
                        name: '',
                        value: '',
                        ui: {
                            editModeActive: true,
                            isFormValid: false,
                            name: 'nodeSelector'
                        }
                    });

                    $rootScope.$broadcast('change-state-deploy-button', { component: 'nodeSelector', isDisabled: true });
                    event.stopPropagation();
                    checkNodeSelectorsIdentity();
                }
            }, 50);
        }

        /**
         * CPU dropdown callback
         * @param {Object} item
         * @param {boolean} isItemChanged
         * @param {string} field
         */
        function cpuDropdownCallback(item, isItemChanged, field) {
            if (!lodash.isEqual(item, ctrl[field])) {
                if (isRequestsInput(field)) {
                    if (ctrl.resources.requests.cpu) {
                        ctrl.resources.requests.cpu = item.onChange(ctrl.resources.requests.cpu);
                        lodash.set(ctrl.version, 'spec.resources.requests.cpu', ctrl.resources.requests.cpu + item.unit);
                    }
                } else if (ctrl.resources.limits.cpu) {
                    ctrl.resources.limits.cpu = item.onChange(ctrl.resources.limits.cpu);
                    lodash.set(ctrl.version, 'spec.resources.limits.cpu', ctrl.resources.limits.cpu + item.unit);
                }

                lodash.set(ctrl, field, item);

                checkIfCpuInputsValid();
            }
        }

        /**
         * Number input callback
         * @param {number} newData
         * @param {string} field
         */
        function cpuInputCallback(newData, field) {
            if (angular.isNumber(newData)) {
                if (isRequestsInput(field)) {
                    ctrl.resources.requests.cpu = newData;
                    newData = newData + ctrl.selectedCpuRequestItem.unit;
                } else {
                    ctrl.resources.limits.cpu = newData;
                    newData = newData + ctrl.selectedCpuLimitItem.unit;
                }

                lodash.set(ctrl.version, 'spec.' + field, newData);
                ctrl.onChangeCallback();
            } else {
                lodash.unset(ctrl.version, 'spec.' + field);
                ctrl[isRequestsInput(field) ? 'resources.requests.cpu' : 'resources.limits.cpu'] = null;
            }

            checkIfCpuInputsValid();
        }

        /**
         * Number input callback for GPU fields
         * @param {number} newData
         * @param {string} field
         */
        function gpuInputCallback(newData, field) {
            if (angular.isNumber(newData)) {
                lodash.set(ctrl.version, ['spec', 'resources', field, 'nvidia.com/gpu'], String(newData));
                lodash.set(ctrl.resources, [field, 'gpu'], String(newData));
                ctrl.onChangeCallback();
            } else {
                lodash.unset(ctrl.version, ['spec', 'resources', field, 'nvidia.com/gpu']);
                lodash.set(ctrl.resources, [field, 'gpu'], null);
            }
        }

        /**
         * Handler on Node selector action type
         * @param {string} actionType
         * @param {number} index - index of the "Node selector" in the array
         */
        function handleNodeSelectorsAction(actionType, index) {
            if (actionType === 'delete') {
                ctrl.nodeSelectors.splice(index, 1);

                $timeout(function () {
                    updateNodeSelectors();
                });
            }
        }

        /**
         * Opens pop up on revert to defaults click
         */
        function handleRevertToDefaultsClick() {
            DialogsService.confirm($i18next.t('functions:REVERT_NODE_SELECTORS_TO_DEFAULTS_CONFIRM', {lng: lng}),
                                   $i18next.t('functions:YES_REVERT_CONFIRM', {lng: lng}),
                                   $i18next.t('common:CANCEL', {lng: lng})).then(function () {
                setNodeSelectorsDefaultValue();
            });
        }

        /**
         * Checks whether the inactivity window can be shown
         * @returns {boolean}
         */
        function isInactivityWindowShown() {
            return lodash.get(scaleToZero, 'mode') === 'enabled';
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
         * Memory number input callback
         * @param {number} newData
         * @param {string} field
         */
        function memoryInputCallback(newData, field) {
            var newValue, sizeUnit;

            sizeUnit = isRequestsInput(field) ? lodash.get(ctrl.selectedRequestUnit, 'unit', 'G') :
                                                lodash.get(ctrl.selectedLimitUnit, 'unit', 'G');

            if (!angular.isNumber(newData)) {
                lodash.unset(ctrl.version.spec, field);

                // if new value isn't number that both fields will be valid, because one of them is empty
                ctrl.resourcesForm.requestMemory.$setValidity('equality', true);
                ctrl.resourcesForm.limitsMemory.$setValidity('equality', true);
            } else {
                newValue = newData + sizeUnit;
                lodash.set(ctrl.version.spec, field, newValue);
                lodash.set(ctrl, field, newData);

                checkIfMemoryInputsValid(newValue, field);
            }

            ctrl.memoryWarningOpen = !lodash.isNil(lodash.get(ctrl.version, 'spec.resources.limits.memory')) &&
                lodash.isNil(lodash.get(ctrl.version, 'spec.resources.requests.memory'));

            ctrl.onChangeCallback();
        }

        /**
         * Changes Node selector data
         * @param {Object} nodeSelector
         * @param {number} index
         */
        function onChangeNodeSelectorsData(nodeSelector, index) {
            ctrl.nodeSelectors[index] = lodash.cloneDeep(nodeSelector);

            updateNodeSelectors();
        }

        /**
         * Replicas data update callback
         * @param {string|number} newData
         * @param {string} field
         */
        function replicasInputCallback(newData, field) {
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
         * Checks whether the `Revert to defaults` button must be hidden
         */
        function checkNodeSelectorsIdentity() {
            const nodeSelectors = lodash.map(ctrl.nodeSelectors, function (selector) {
                return {
                    key: selector.name,
                    value: selector.value
                }
            })

            ctrl.revertToDefaultsBtnIsHidden = lodash.isEqual(
                lodash.get(ConfigService,'nuclio.defaultFunctionConfig.attributes.spec.nodeSelector', []), nodeSelectors);
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
         * Initializes data for Node selectors section
         */
        function initNodeSelectors() {
            ctrl.nodeSelectors = lodash.chain(ctrl.version)
                .get('spec.nodeSelector', {})
                .map(function (value, key) {
                    return {
                        name: key,
                        value: value,
                        ui: {
                            editModeActive: false,
                            isFormValid: key.length > 0 && value.length > 0,
                            name: 'nodeSelector'
                        }
                    };
                })
                .value();

            if ($stateParams.isNewFunction) {
                setNodeSelectorsDefaultValue();
            } else {
                checkNodeSelectorsIdentity();
            }

            $timeout(function () {
                if (ctrl.nodeSelectorsForm.$invalid) {
                    ctrl.nodeSelectorsForm.$setSubmitted();
                    $rootScope.$broadcast('change-state-deploy-button', { component: 'nodeSelector', isDisabled: true });
                }
            });
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

            ctrl.resources = {
                requests: {
                    memory: parseValue(requestsMemory),
                    cpu: parseValue(requestsCpu)
                },
                limits: {
                    memory: parseValue(limitsMemory),
                    cpu: parseValue(limitsCpu),
                    gpu: parseValue(limitsGpu)
                }
            };

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
         * Initializes Target CPU slider.
         */
        function initTargetCpuSlider() {
            ctrl.targetCpuValueUnit = '';
            ctrl.targetCpuSliderConfig = {
                value: lodash.get(ctrl.defaultFunctionConfig, 'spec.resources.targetCPU', 75),
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
         * Set Node selectors default value
         */
        function setNodeSelectorsDefaultValue() {
            ctrl.nodeSelectors = lodash.chain(ConfigService)
                .get('nuclio.defaultFunctionConfig.attributes.spec.nodeSelector', [])
                .map(function (value, key) {
                    return {
                        name: key,
                        value: value,
                        ui: {
                            editModeActive: false,
                            isFormValid: key.length > 0 && value.length > 0,
                            name: 'nodeSelector'
                        }
                    };
                })
                .value();
        }

        /**
         * Updates Node selectors
         */
        function updateNodeSelectors() {
            var isFormValid = true;
            var newNodeSelectors = {};

            lodash.forEach(ctrl.nodeSelectors, function (nodeSelector) {
                if (!nodeSelector.ui.isFormValid) {
                    isFormValid = false;
                }

                newNodeSelectors[nodeSelector.name] = nodeSelector.value;
            });

            // since uniqueness validation rule of some fields is dependent on the entire label list, then whenever
            // the list is modified - the rest of the labels need to be re-validated
            FormValidationService.validateAllFields(ctrl.nodeSelectorsForm);

            $rootScope.$broadcast('change-state-deploy-button', {
                component: 'nodeSelector',
                isDisabled: !isFormValid || ctrl.nodeSelectorsForm.$invalid
            });

            lodash.set(ctrl.version, 'spec.nodeSelector', newNodeSelectors);
            checkNodeSelectorsIdentity();
        }

        /**
         * Updates parameters for "Scale to zero" section
         */
        function updateScaleToZeroParameters() {
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
                    disabled: !Number.isSafeInteger(ctrl.minReplicas) || ctrl.minReplicas > 0,
                    onChange: function (_, newValue) {
                        lodash.forEach(scaleResources, function (value) {
                            value.windowSize = newValue;
                        });

                        if (ctrl.minReplicas === 0) {
                            lodash.set(ctrl.version, 'spec.scaleToZero.scaleResources', scaleResources);
                        }
                    }
                }
            };
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
         * Determines `uniqueness` validation for Node selector `Key` field
         * @param {string} value - value to validate
         * @returns {boolean}
         */
        function validateNodeSelectorUniqueness(value) {
            return lodash.filter(ctrl.nodeSelectors, ['name', value]).length === 1;
        }
    }
}());
