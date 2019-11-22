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

    function NclVersionConfigurationEnvironmentVariablesController($element, $i18next, $q, $rootScope, $scope, $timeout,
                                                                   i18next, lodash, PreventDropdownCutOffService) {
        var ctrl = this;
        var lng = i18next.language;

        ctrl.igzScrollConfig = {
            maxElementsCount: 10,
            childrenSelector: '.table-body'
        };
        ctrl.configMapKeyValidationRules = [
            {
                label: $i18next.t('functions:VALIDATION.VALID_CHARACTERS', {lng: lng}) + ': a–z, A–Z, 0–9, -, _',
                pattern: /^[\w-]+$/
            },
            {
                label: $i18next.t('functions:VALIDATION.MAX_LENGTH', {lng: lng, count: 253}),
                pattern: /^(?=[\S\s]{1,253}$)/
            },
            {
                label: $i18next.t('functions:VALIDATION.UNIQUENESS', {lng: lng}),
                pattern: validateUniqueness.bind(null, 'valueFrom.configMapKeyRef.key')
            }
        ];
        ctrl.keyValidationRules = [
            {
                label: $i18next.t('functions:VALIDATION.VALID_CHARACTERS', {lng: lng}) + ': a–z, A–Z, 0–9, -, _, .',
                pattern: /^[\w-.]+$/
            },
            {
                label: $i18next.t('functions:VALIDATION.NOT_START_WITH_DIGIT_OR_TWO_PERIODS', {lng: lng}) + ' (..)',
                pattern: /^(?!\.{2,}|\d)/
            },
            {
                label: $i18next.t('functions:VALIDATION.UNIQUENESS', {lng: lng}),
                pattern: validateUniqueness.bind(null, 'name')
            }
        ];
        ctrl.scrollConfig = {
            axis: 'y',
            advanced: {
                updateOnContentResize: true
            }
        };

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

            updateVariables();
        }

        //
        // Private methods
        //

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
        function validateUniqueness(field, value) {
            $timeout(function () {
                lodash.forEach(ctrl.variables, function (envVar, key) {
                    envVar.ui.isFormValid = ctrl.environmentVariablesForm.$$controls[key].$valid;
                });


                $rootScope.$broadcast('change-state-deploy-button', {
                    component: 'variable',
                    isDisabled: lodash.some(ctrl.variables, ['ui.isFormValid', false])
                });
            });

            return lodash.filter(ctrl.variables, [field, value]).length === 1;
        }
    }
}());
