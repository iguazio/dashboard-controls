(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclTestEventsLogs', {
            bindings: {
                logs: '<'
            },
            templateUrl: 'nuclio/projects/project/functions/version/version-code/function-event-pane/test-events-logs/test-events-logs.tpl.html',
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
            return angular.fromJson(angular.toJson(lodash.omit(log, REQUIRED_PARAMETERS)));
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
