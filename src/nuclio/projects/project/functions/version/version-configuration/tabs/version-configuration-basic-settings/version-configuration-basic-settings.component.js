(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclVersionConfigurationBasicSettings', {
            bindings: {
                version: '<',
                onChangeCallback: '<'
            },
            templateUrl: 'nuclio/projects/project/functions/version/version-configuration/tabs/version-configuration-basic-settings/version-configuration-basic-settings.tpl.html',
            controller: NclVersionConfigurationBasicSettingsController
        });

    function NclVersionConfigurationBasicSettingsController($rootScope, $timeout, lodash, ConfigService,
                                                            ValidatingPatternsService) {
        var ctrl = this;

        ctrl.enableFunction = false;
        ctrl.enableTimeout = false;
        ctrl.timeout = {
            min: 0,
            sec: 0
        };

        ctrl.$onInit = onInit;

        ctrl.isDemoMode = ConfigService.isDemoMode;
        ctrl.validationPatterns = ValidatingPatternsService;

        ctrl.inputValueCallback = inputValueCallback;
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

            ctrl.enableFunction = !lodash.get(ctrl.version, 'spec.disabled', false);
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
         * Switches enable/disable function status
         */
        function updateEnableStatus() {
            lodash.set(ctrl.version, 'spec.disabled', !ctrl.enableFunction);
            ctrl.onChangeCallback();
        }
    }
}());
