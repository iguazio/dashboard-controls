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

    function NclVersionMonitoringController($rootScope, $timeout, lodash, FunctionsService) {
        var ctrl = this;

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

        ctrl.checkIsErrorState = checkIsErrorState;
        ctrl.onRowCollapse = onRowCollapse;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.isFunctionDeploying = lodash.partial(FunctionsService.isFunctionDeploying, ctrl.version);
        }

        //
        // Public methods
        //

        /**
         * Checks if current version status is `error`
         * @returns {boolean}
         */
        function checkIsErrorState() {
            return lodash.includes(['error', 'unhealthy'], lodash.get(ctrl.version.status, 'state'));
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
    }
}());
