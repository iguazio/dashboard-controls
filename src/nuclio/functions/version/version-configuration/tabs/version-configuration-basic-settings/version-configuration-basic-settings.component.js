(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclVersionConfigurationBasicSettings', {
            bindings: {
                version: '<',
                onChangeCallback: '<'
            },
            templateUrl: 'nuclio/functions/version/version-configuration/tabs/version-configuration-basic-settings/version-configuration-basic-settings.tpl.html',
            controller: NclVersionConfigurationBasicSettingsController
        });

    function NclVersionConfigurationBasicSettingsController($rootScope, $timeout, $i18next, i18next, lodash,
                                                            ConfigService, DialogsService, ValidatingPatternsService) {
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

        ctrl.isDemoMode = ConfigService.isDemoMode;
        ctrl.validationPatterns = ValidatingPatternsService;

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

            $timeout(function () {
                if (ctrl.basicSettingsForm.$valid) {
                    if (lodash.includes(field, 'timeout')) {
                        lodash.set(ctrl.version, 'spec.timeoutSeconds', ctrl.timeout.min * 60 + ctrl.timeout.sec);
                    } else {
                        lodash.set(ctrl.version, field, newData);
                    }

                    $rootScope.$broadcast('change-state-deploy-button', {component: 'settings', isDisabled: false});

                    ctrl.onChangeCallback();
                } else {
                    $rootScope.$broadcast('change-state-deploy-button', {component: 'settings', isDisabled: true});
                }
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

            if (!lodash.isEmpty(apiGateways) && !ctrl.enableFunction) {
                DialogsService.alert($i18next.t('functions:ERROR_MSG.DISABLE_API_GW_FUNCTION', {lng: lng, apiGatewayName: apiGateways[0]}));

                // return checkbox to enabled state
                ctrl.enableFunction = true;
            } else {
                lodash.set(ctrl.version, 'spec.disable', !ctrl.enableFunction);

                ctrl.onChangeCallback();
            }
        }
    }
}());
