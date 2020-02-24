(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclVersionConfigurationEnvironmentVariables', {
            bindings: {
                version: '<',
                onChangeCallback: '<'
            },
            templateUrl: 'nuclio/functions/version/version-configuration/tabs/version-configuration-environment-variables/version-configuration-environment-variables.tpl.html',
            controller: NclVersionConfigurationEnvironmentVariablesController
        });

    function NclVersionConfigurationEnvironmentVariablesController($element, $i18next, $rootScope, $timeout, i18next,
                                                                   lodash, PreventDropdownCutOffService,
                                                                   ValidatingPatternsService) {
        var ctrl = this;
        var lng = i18next.language;

        ctrl.igzScrollConfig = {
            maxElementsCount: 10,
            childrenSelector: '.table-body'
        };
        ctrl.validationRules = {
            key: ValidatingPatternsService.getValidationRules('k8s.envVarName', [{
                name: 'uniqueness',
                label: $i18next.t('functions:UNIQUENESS', {lng: lng}),
                pattern: validateUniqueness.bind(null, 'name')
            }]),
            secretKey: ValidatingPatternsService.getValidationRules('k8s.configMapKey'),
            secret: ValidatingPatternsService.getValidationRules('k8s.dns1123Subdomain'),
            configmapKey: [
                {
                    name: 'validCharacters',
                    label: $i18next.t('common:VALID_CHARACTERS', {lng: lng}) + ': a–z, A–Z, 0–9, -, _',
                    pattern: /^[\w-]+$/
                },
                {
                    name: 'maxLength',
                    label: $i18next.t('common:MAX_LENGTH_CHARACTERS', {lng: lng, count: 253}),
                    pattern: /^(?=[\S\s]{1,253}$)/
                },
                {
                    name: 'uniqueness',
                    label: $i18next.t('functions:UNIQUENESS', {lng: lng}),
                    pattern: validateUniqueness.bind(null, 'valueFrom.configMapKeyRef.key')
                }
            ]
        };
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
        ctrl.onChangeType = onChangeType;

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
            ctrl.variables[index] = lodash.cloneDeep(variable);

            updateVariables();
        }

        /**
         * Handles a change of variables type
         * @param {Object} newType
         * @param {number} index
         */
        function onChangeType(newType, index) {
            var variablesCopy = angular.copy(ctrl.variables);

            variablesCopy[index] = newType.id === 'value' ? {} : {valueFrom: {}};
            ctrl.isOnlyValueTypeInputs = !lodash.some(variablesCopy, 'valueFrom');

            if (newType.id === 'secret') {
                var form = lodash.get(ctrl.environmentVariablesForm, '$$controls[' + index + '][value-key]');

                if (angular.isDefined(form)) {
                    lodash.forEach(ctrl.validationRules.configmapKey, function (rule) {
                        form.$setValidity(rule.name, true);
                    });
                }
            }
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

            $rootScope.$broadcast('update-patterns-validity', ['key', 'value']);
            $rootScope.$broadcast('change-state-deploy-button', {
                component: 'variable',
                isDisabled: !isFormValid
            });

            lodash.set(ctrl.version, 'spec.env', variables);
            ctrl.onChangeCallback();
        }

        /**
         * Determines `uniqueness` validation for `Key` and `ConfigMap key` fields
         * @param {string} path
         * @param {string} value
         */
        function validateUniqueness(path, value) {
            return lodash.filter(ctrl.variables, [path, value]).length === 1;
        }
    }
}());
