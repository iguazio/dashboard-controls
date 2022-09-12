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
        .component('nclTestEventsLogs', {
            bindings: {
                logs: '<'
            },
            templateUrl: 'nuclio/functions/version/version-code/function-event-pane/test-events-logs/test-events-logs.tpl.html',
            controller: NclTestEventsLogsController
        });

    function NclTestEventsLogsController(lodash) {
        var ctrl = this;
        var REQUIRED_PARAMETERS = ['level', 'name', 'time', 'err', 'message', 'ui'];

        ctrl.$onInit = onInit;

        ctrl.collapseRow = collapseRow;
        ctrl.expandAllRows = expandAllRows;
        ctrl.getLevelIconClass = getLevelIconClass;
        ctrl.getParameters = getParameters;
        ctrl.hasAdditionalParameters = hasAdditionalParameters;

        //
        // Hook method
        //

        /**
         * Initialization method
         */
        function onInit() {
            lodash.forEach(ctrl.logs, function (log) {
                lodash.set(log, 'ui.collapsed', true);
            });
        }

        //
        // Public methods
        //

        /**
         * Collapse/expand row depending on `collapse` value
         * @param {Object} log
         * @param {boolean} collapse
         */
        function collapseRow(log, collapse) {
            lodash.set(log, 'ui.collapsed', collapse);
        }

        /**
         * Collapse/expand all rows depending on `expand` value
         * @param {boolean} expand
         */
        function expandAllRows(expand) {
            lodash.forEach(ctrl.logs, function (log) {
                lodash.set(log, 'ui.collapsed', !expand);
            });
        }

        /**
         * Gets css class depending on log.level
         * @param {Object} log
         * @returns {string}
         */
        function getLevelIconClass(log) {
            return log.level === 'debug' ? 'ncl-icon-debug' :
                   log.level === 'info'  ? 'igz-icon-info-round' :
                   log.level === 'warn'  ? 'igz-icon-warning' :
                   log.level === 'error' ? 'igz-icon-cancel-path' :
                                           '';
        }

        /**
         * Gets additional parameters
         * @param {Object} log
         * @returns {Object}
         */
        function getParameters(log) {
            return lodash.omit(log, REQUIRED_PARAMETERS);
        }

        /**
         * Checks if log has additional parameters
         * @param {Object} log
         * @returns {boolean}
         */
        function hasAdditionalParameters(log) {
            return !lodash.isEmpty(getParameters(log));
        }
    }
}());
