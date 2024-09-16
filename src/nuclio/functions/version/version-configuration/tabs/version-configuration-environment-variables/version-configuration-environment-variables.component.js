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
        .component('nclVersionConfigurationEnvironmentVariables', {
            bindings: {
                version: '<',
                onChangeCallback: '<',
                isFunctionDeploying: '&'
            },
            templateUrl: 'nuclio/functions/version/version-configuration/tabs/version-configuration-environment-variables/version-configuration-environment-variables.tpl.html',
            controller: NclVersionConfigurationEnvironmentVariablesController
        });

    function NclVersionConfigurationEnvironmentVariablesController($element, $i18next, $rootScope, $timeout, i18next,
                                                                   lodash, FormValidationService,
                                                                   PreventDropdownCutOffService,
                                                                   ValidationService) {
        var ctrl = this;
        var lng = i18next.language;

        var envVariableFromValidationRules = ValidationService.getValidationRules('k8s.configMapKey', [
            {
                name: 'uniqueness',
                label: $i18next.t('common:UNIQUENESS', {lng: lng}),
                pattern: validateUniqueness.bind(null, ['configMapRef.name', 'secretRef.name'])
            }
        ]);
        var envVariableKeyValidationRule = ValidationService.getValidationRules('k8s.envVarName', [{
            name: 'uniqueness',
            label: $i18next.t('common:UNIQUENESS', {lng: lng}),
            pattern: validateUniqueness.bind(null, ['name'])
        }]);
        var envVariableConfigmapKeyValidationRule = ValidationService.getValidationRules('k8s.configMapKey', [
            {
                name: 'uniqueness',
                label: $i18next.t('common:UNIQUENESS', {lng: lng}),
                pattern: validateUniqueness.bind(null, ['valueFrom.configMapKeyRef.key'])
            }
        ]);

        ctrl.environmentVariablesForm = null;
        ctrl.igzScrollConfig = {
            maxElementsCount: 10,
            childrenSelector: '.table-body'
        };
        ctrl.validationRules = {
            key: envVariableKeyValidationRule,
            secretKey: ValidationService.getValidationRules('k8s.configMapKey'),
            secret: ValidationService.getValidationRules('k8s.secretName'),
            configmapKey: envVariableConfigmapKeyValidationRule,
            configmapRef: envVariableFromValidationRules,
            secretRef: envVariableFromValidationRules
        };
        ctrl.variables = [];
        ctrl.scrollConfig = {
            axis: 'y',
            advanced: {
                updateOnContentResize: true
            }
        };

        ctrl.$postLink = postLink;
        ctrl.$onChanges = onChanges;

        ctrl.addNewVariable = addNewVariable;
        ctrl.handleAction = handleAction;
        ctrl.onChangeData = onChangeData;
        ctrl.onChangeType = onChangeType;

        //
        // Hook methods
        //

        /**
         * Post linking method
         */
        function postLink() {

            // Bind DOM-related preventDropdownCutOff method to component's controller
            PreventDropdownCutOffService.preventDropdownCutOff($element, '.three-dot-menu');
        }

        /**
         * On changes hook method.
         * @param {Object} changes
         */
        function onChanges(changes) {
            if (angular.isDefined(changes.version)) {
                ctrl.variables =
                  lodash.chain(lodash.get(ctrl.version, 'spec.env', []))
                      .concat(lodash.get(ctrl.version, 'spec.envFrom', []))
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
                });
            }
        }

        //
        // Public methods
        //

        /**
         * Adds new variable
         */
        function addNewVariable(event) {
            if (ctrl.isFunctionDeploying()) {
                return;
            }

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

                    ctrl.environmentVariablesForm.$setPristine();

                    $rootScope.$broadcast('change-state-deploy-button', {
                        component: 'variable',
                        isDisabled: true
                    });
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
         * Updates function's variables
         */
        function updateVariables() {
            var isFormValid = true;
            var variables = lodash.chain(ctrl.variables)
                .map(function (variable) {
                    if (!variable.ui.isFormValid) {
                        isFormValid = false;
                    }

                    return lodash.omit(variable, 'ui');
                })
                .reduce(function (acc, variable) {
                    var envType = !lodash.get(variable, 'configMapRef.name', false) &&
                               !lodash.get(variable, 'secretRef.name', false) ? 'env' : 'envFrom';

                    acc[envType] = acc[envType] ? lodash.concat(acc[envType], variable) : [variable];

                    return acc;
                }, {})
                .value();

            // since uniqueness validation rule of some fields is dependent on the entire environment variable list,
            // then whenever the list is modified - the rest of the environment variables need to be re-validated
            FormValidationService.validateAllFields(ctrl.environmentVariablesForm);

            $rootScope.$broadcast('change-state-deploy-button', {
                component: 'variable',
                isDisabled: !isFormValid
            });

            lodash.set(ctrl.version, 'spec.env', lodash.get(variables, 'env', []));
            lodash.set(ctrl.version, 'spec.envFrom', lodash.get(variables, 'envFrom', []));

            ctrl.onChangeCallback();
        }

        /**
         * Determines `uniqueness` validation for Environment Variables
         * @param {Array} paths
         * @param {string} value
         * @returns {boolean} - Returns true if the value is unique across the specified paths, false otherwise.
         */
        function validateUniqueness(paths, value) {
            return lodash.filter(ctrl.variables, function (variable) {
                return paths.some(function (path) {
                    return lodash.get(variable, path) === value;
                });
            }).length === 1;
        }
    }
}());
