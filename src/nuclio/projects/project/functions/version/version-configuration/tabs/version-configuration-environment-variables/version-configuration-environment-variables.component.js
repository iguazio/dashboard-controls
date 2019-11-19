(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclVersionConfigurationEnvironmentVariables', {
            bindings: {
                version: '<',
                onChangeCallback: '<'
            },
            templateUrl: 'nuclio/projects/project/functions/version/version-configuration/tabs/version-configuration-environment-variables/version-configuration-environment-variables.tpl.html',
            controller: NclVersionConfigurationEnvironmentVariablesController
        });

    function NclVersionConfigurationEnvironmentVariablesController($element, $i18next, $rootScope, $scope, $timeout,
                                                                   i18next, lodash, PreventDropdownCutOffService,
                                                                   ValidatingPatternsService, VersionHelperService) {
        var ctrl = this;
        var lng = i18next.language;

        ctrl.igzScrollConfig = {
            maxElementsCount: 10,
            childrenSelector: '.table-body'
        };
        ctrl.configMapKeyValidationPattern = ValidatingPatternsService.k8s.configMapKey;
        ctrl.keyValidationPattern = ValidatingPatternsService.k8s.envVarName;
        ctrl.scrollConfig = {
            axis: 'y',
            advanced: {
                updateOnContentResize: true
            }
        };
        ctrl.configMapKeyTooltip = getConfigMapKeyTooltip();
        ctrl.keyTooltip = getKeyTooltip();

        ctrl.$onInit = onInit;
        ctrl.$postLink = postLink;

        ctrl.addNewVariable = addNewVariable;
        ctrl.handleAction = handleAction;
        ctrl.onChangeData = onChangeData;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.variables = lodash.chain(ctrl.version)
                .get('spec.env', [])
                .map(function (variable) {
                    variable.ui = {
                        editModeActive: false,
                        isFormValid: false,
                        name: 'variable'
                    };

                    return variable;
                })
                .value();

            ctrl.isOnlyValueTypeInputs = !lodash.some(ctrl.variables, 'valueFrom');

            $scope.$on('key-value-type-changed', function (event, isValueType) {
                if (!isValueType) {
                    ctrl.isOnlyValueTypeInputs = false;
                }
            });

            $timeout(function () {
                if (ctrl.environmentVariablesForm.$invalid) {
                    ctrl.environmentVariablesForm.$setSubmitted();
                    $rootScope.$broadcast('change-state-deploy-button', {component: 'variable', isDisabled: true});
                }
            })
        }

        /**
         * Post linking method
         */
        function postLink() {

            // Bind DOM-related preventDropdownCutOff method to component's controller
            PreventDropdownCutOffService.preventDropdownCutOff($element, '.three-dot-menu');
        }

        //
        // Public methods
        //

        /**
         * Adds new variable
         */
        function addNewVariable(event) {
            $timeout(function () {
                if (ctrl.variables.length < 1 || lodash.chain(ctrl.variables).last().get('ui.isFormValid', true).value()) {
                    ctrl.variables.push({
                        name: '',
                        value: '',
                        ui: {
                            editModeActive: true,
                            isFormValid: false,
                            name: 'variable'
                        }
                    });

                    $rootScope.$broadcast('change-state-deploy-button', {component: 'variable', isDisabled: true});
                    event.stopPropagation();
                }
            }, 50);
        }

        /**
         * Handler on specific action type
         * @param {string} actionType
         * @param {number} index - index of variable in array
         */
        function handleAction(actionType, index) {
            if (actionType === 'delete') {
                ctrl.variables.splice(index, 1);

                $timeout(function () {
                    validateUniqueness();
                    updateVariables();
                });
            }
        }

        /**
         * Changes data of specific variable
         * @param {Object} variable
         * @param {number} index
         */
        function onChangeData(variable, index) {
            ctrl.variables[index] = variable;

            validateUniqueness();
            updateVariables();
        }

        //
        // Private methods
        //

        /**
         * Generates tooltip for "ConfigMap key" label
         */
        function getConfigMapKeyTooltip() {
            var config = [
                {
                    head: $i18next.t('functions:TOOLTIP.CONFIGURATION.RESTRICTIONS', {lng: lng}),
                    values: [
                        {
                            head: $i18next.t('functions:TOOLTIP.CONFIGURATION.VALID_CHARACTERS', {lng: lng}) + ' —',
                            values: [
                                {head: $i18next.t('functions:TOOLTIP.CONFIGURATION.ALPHANUMERIC_CHARACTERS', {lng: lng}) + ' (a–z, A–Z, 0–9)'},
                                {head: $i18next.t('functions:TOOLTIP.CONFIGURATION.HYPHENS', {lng: lng}) + ' (-)'},
                                {head: $i18next.t('functions:TOOLTIP.CONFIGURATION.UNDERSCORES', {lng: lng}) + ' (_)'}
                            ]
                        },
                        {
                            head: $i18next.t('functions:TOOLTIP.CONFIGURATION.MAX_LENGTH', {lng: lng, count: 253})
                        }
                    ]
                },
                {
                    head: $i18next.t('functions:TOOLTIP.CONFIGURATION.EXAMPLES', {lng: lng}),
                    values: [
                        {head: '"MY_KEY"'},
                        {head: '"my-key"'},
                        {head: '"MyKey.1"'}
                    ]
                }
            ];

            return VersionHelperService.generateTooltip(config);
        }

        /**
         * Generates tooltip for "Key" label
         */
        function getKeyTooltip() {
            var config = [
                {
                    head: $i18next.t('functions:TOOLTIP.CONFIGURATION.RESTRICTIONS', {lng: lng}),
                    values: [
                        {
                            head: $i18next.t('functions:TOOLTIP.CONFIGURATION.VALID_CHARACTERS', {lng: lng}) + ' —',
                            values: [
                                {head: $i18next.t('functions:TOOLTIP.CONFIGURATION.ALPHANUMERIC_CHARACTERS', {lng: lng}) + ' (a–z, A–Z, 0–9)'},
                                {head: $i18next.t('functions:TOOLTIP.CONFIGURATION.HYPHENS', {lng: lng}) + ' (-)'},
                                {head: $i18next.t('functions:TOOLTIP.CONFIGURATION.UNDERSCORES', {lng: lng}) + ' (_)'},
                                {head: $i18next.t('functions:TOOLTIP.CONFIGURATION.PERIODS', {lng: lng}) + ' (.)'}
                            ]
                        },
                        {
                            head: $i18next.t('functions:TOOLTIP.CONFIGURATION.NOT_START_WITH_DIGIT_OR_TWO_PERIODS', {lng: lng}) + ' (..)'
                        },
                        {
                            head: $i18next.t('functions:TOOLTIP.CONFIGURATION.NOT_END_WITH_DIGIT', {lng: lng})
                        },
                        {
                            head: $i18next.t('functions:TOOLTIP.CONFIGURATION.NOT_CONTAIN_ONLY_PERIOD', {lng: lng}) + ' (.)'
                        }
                    ]
                },
                {
                    head: $i18next.t('functions:TOOLTIP.CONFIGURATION.EXAMPLES', {lng: lng}),
                    values: [
                        {head: '"MY_ENV_VAR"'},
                        {head: '"MyEnvVar1"'},
                        {head: '"My-Env-Var.1"'},
                        {head: '"my.env-var"'}
                    ]
                }
            ];

            return VersionHelperService.generateTooltip(config);
        }

        /**
         * Updates function`s variables
         */
        function updateVariables() {
            var isFormValid = true;
            var variables = lodash.map(ctrl.variables, function (variable) {
                if (!variable.ui.isFormValid) {
                    isFormValid = false;
                }

                return lodash.omit(variable, 'ui');
            });

            $rootScope.$broadcast('change-state-deploy-button', {
                component: 'variable',
                isDisabled: !isFormValid
            });

            lodash.set(ctrl.version, 'spec.env', variables);
            ctrl.onChangeCallback();
        }

        /**
         * Determines and sets `uniqueness` validation for `Key` and `ConfigMap key` fields
         */
        function validateUniqueness() {
            var chunkedVars = lodash.chunk(ctrl.variables);
            var uniqueKeys = lodash.xorBy.apply(null, chunkedVars.concat('name'));
            var uniqueConfigMapKeys = lodash.xorBy.apply(null, chunkedVars.concat('valueFrom.configMapKeyRef.key'));

            lodash.forEach(ctrl.variables, function (envVar, key) {
                ctrl.environmentVariablesForm.$$controls[key].key.$setValidity('uniqueness',
                    lodash.includes(uniqueKeys, envVar)
                );

                if (lodash.has(envVar, 'valueFrom.configMapKeyRef')) {
                    ctrl.environmentVariablesForm.$$controls[key]['value-key'].$setValidity('uniqueness',
                        lodash.includes(uniqueConfigMapKeys, envVar)
                    );
                } else if (lodash.has(envVar, 'valueFrom.secretKeyRef') &&
                    ctrl.environmentVariablesForm.$$controls[key]['value-key'].$invalid) {
                    ctrl.environmentVariablesForm.$$controls[key]['value-key'].$setValidity('uniqueness', true);
                }

                envVar.ui.isFormValid = ctrl.environmentVariablesForm.$$controls[key].$valid;
            });

            if (lodash.every(ctrl.variables, 'ui.isFormValid')) {
                $rootScope.$broadcast('change-state-deploy-button', {
                    component: 'variable',
                    isDisabled: false
                });
            }
        }
    }
}());
