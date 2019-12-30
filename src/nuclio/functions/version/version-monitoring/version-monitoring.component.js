(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclVersionMonitoring', {
            bindings: {
                version: '<'
            },
            templateUrl: 'nuclio/functions/version/version-monitoring/version-monitoring.tpl.html',
            controller: NclVersionMonitoringController
        });

    function NclVersionMonitoringController($rootScope, $scope, $timeout, lodash, ConfigService) {
        var ctrl = this;

        ctrl.versionStatus = {};
        ctrl.scrollConfig = {
            advanced: {
                updateOnContentResize: true
            }
        };
        ctrl.loggerScrollConfig = {
            advanced: {
                updateOnContentResize: true
            },
            theme: 'light-thin'
        };
        ctrl.rowIsCollapsed = {
            buildLog: false,
            errorLog: false
        };

        ctrl.$onInit = onInit;

        ctrl.isDemoMode = ConfigService.isDemoMode;

        ctrl.checkIsErrorState = checkIsErrorState;
        ctrl.onRowCollapse = onRowCollapse;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            setVersionStatus();

            $scope.$on('deploy-result-changed', setVersionStatus);
        }

        //
        // Public methods
        //

        /**
         * Checks if current version status is `error`
         * @returns {boolean}
         */
        function checkIsErrorState() {
            return lodash.get(ctrl.versionStatus, 'state') === 'error';
        }

        /**
         * Called when row is collapsed/expanded
         * @param {string} row - name of expanded/collapsed row
         */
        function onRowCollapse(row) {
            ctrl.rowIsCollapsed[row] = !ctrl.rowIsCollapsed[row];

            $timeout(function () {
                $rootScope.$broadcast('igzWatchWindowResize::resize');
            }, 350);
        }

        //
        // Private methods
        //

        /**
         * Sets actual deploying status in `ctrl.versionStatus`
         */
        function setVersionStatus() {
            if (lodash.isEmpty(lodash.get(ctrl.version, 'ui.deployResult'))) {
                ctrl.versionStatus = lodash.get(ctrl.version, 'status');
            } else {
                ctrl.versionStatus = lodash.get(ctrl.version, 'ui.deployResult.status');
            }
        }
    }
}());
