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
        .component('nclVersionConfigurationBasicSettings', {
            bindings: {
                version: '<',
                onChangeCallback: '<',
                isFunctionDeploying: '&'
            },
            templateUrl: 'nuclio/functions/version/version-configuration/tabs/version-configuration-basic-settings/version-configuration-basic-settings.tpl.html',
            controller: NclVersionConfigurationBasicSettingsController
        });

    function NclVersionConfigurationBasicSettingsController($rootScope, $timeout, $i18next, i18next, lodash,
                                                            ConfigService, DialogsService, FunctionsService,
                                                            ValidationService) {
        var ctrl = this;
        var lng = i18next.language;

        ctrl.enableFunction = false;
        ctrl.enableTimeout = false;
        ctrl.timeout = {
            min: 0,
            sec: 0
        };
        ctrl.logLevelValues = [
            {
                id: 'error',
                name: $i18next.t('common:ERROR', {lng: lng})
            },
            {
                id: 'warn',
                name: $i18next.t('common:WARNING', {lng: lng})
            },
            {
                id: 'info',
                name: $i18next.t('common:INFO', {lng: lng})
            },
            {
                id: 'debug',
                name: $i18next.t('common:DEBUG', {lng: lng})
            }
        ];

        ctrl.$onInit = onInit;
        ctrl.$onChanges = onChanges;

        ctrl.isDemoMode = ConfigService.isDemoMode;
        ctrl.lodash = lodash;
        ctrl.validationRules = {
            integer: ValidationService.getValidationRules('integer')
        };

        ctrl.inputValueCallback = inputValueCallback;
        ctrl.setPriority = setPriority;
        ctrl.updateEnableStatus = updateEnableStatus;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.platformIsKube = FunctionsService.isKubePlatform();
        }

        /**
         * On changes hook method.
         * @param {Object} changes
         */
        function onChanges(changes) {
            if (angular.isDefined(changes.version)) {
                if (ctrl.isDemoMode()) {
                    var timeoutSeconds = lodash.get(ctrl.version, 'spec.timeoutSeconds');

                    if (lodash.isNumber(timeoutSeconds)) {
                        ctrl.timeout.min = Math.floor(timeoutSeconds / 60);
                        ctrl.timeout.sec = Math.floor(timeoutSeconds % 60);
                    }
                }

                lodash.defaultsDeep(ctrl.version, {
                    spec: {
                        loggerSinks: [{level: 'debug'}]
                    }
                });

                ctrl.enableFunction = !lodash.get(ctrl.version, 'spec.disable', false);

                $timeout(function () {
                    if (ctrl.basicSettingsForm.$invalid) {
                        ctrl.basicSettingsForm.$setSubmitted();
                    }
                });
            }
        }

        //
        // Public methods
        //

        /**
         * Update data callback
         * @param {string} newData
         * @param {string} field
         */
        function inputValueCallback(newData, field) {
            lodash.set(ctrl, field, lodash.includes(field, 'timeout') ? Number(newData) : newData);

            if (lodash.includes(field, 'timeout')) {
                lodash.set(ctrl.version, 'spec.timeoutSeconds', ctrl.timeout.min * 60 + ctrl.timeout.sec);
            } else if (lodash.startsWith(field, 'spec.securityContext.') && newData === '') {
                lodash.unset(ctrl.version, field);
            } else {
                lodash.set(ctrl.version, field, newData);
            }

            ctrl.basicSettingsForm.$setSubmitted();
            ctrl.onChangeCallback();

            $timeout(function () {
                $rootScope.$broadcast('change-state-deploy-button', {
                    component: 'settings',
                    isDisabled: !ctrl.basicSettingsForm.$valid
                });
            });
        }

        /**
         * Sets logger level
         * @param {Object} item
         */
        function setPriority(item) {
            lodash.set(ctrl.version, 'spec.loggerSinks[0].level', item.id);

            ctrl.onChangeCallback();
        }

        /**
         * Switches enable/disable function status
         */
        function updateEnableStatus() {
            var apiGateways = lodash.get(ctrl.version, 'status.apiGateways', []);
            var originallyDisabled = lodash.get(ctrl.version, 'ui.deployedVersion.spec.disable', false);

            if (!lodash.isEmpty(apiGateways) && !ctrl.enableFunction && !originallyDisabled) {
                DialogsService.alert($i18next.t('functions:ERROR_MSG.DISABLE_API_GW_FUNCTION', {
                    lng: lng,
                    apiGatewayName: apiGateways[0]
                }));

                // return checkbox to enabled state
                ctrl.enableFunction = true;
            } else {
                lodash.set(ctrl.version, 'spec.disable', !ctrl.enableFunction);

                ctrl.onChangeCallback();
            }
        }
    }
}());
