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
        .component('nclVersionMonitoring', {
            bindings: {
                version: '<'
            },
            templateUrl: 'nuclio/functions/version/version-monitoring/version-monitoring.tpl.html',
            controller: NclVersionMonitoringController
        });

    function NclVersionMonitoringController($rootScope, $timeout, lodash, FunctionsService) {
        var ctrl = this;

        ctrl.enrichedNodeSelectors = [];
        ctrl.enrichedServiceAccount = '';
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
        ctrl.$onChanges = onChanges;

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

            initEnrichedData();
        }

        /**
         * On changes hook method
         * @param {Object} changes
         */
        function onChanges(changes) {
            if (lodash.has(changes, 'version')) {
                initEnrichedData();
            }
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
         * Generates enriched content
         */
        function initEnrichedData() {
            ctrl.enrichedServiceAccount = lodash.get(ctrl.version, 'status.enrichedServiceAccount', '');
            ctrl.enrichedNodeSelectors = lodash.chain(ctrl.version)
                .get('status.enrichedNodeSelector', {})
                .map(function (key, value) {
                    return {
                        name: value,
                        value: key
                    };
                })
                .value();
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
