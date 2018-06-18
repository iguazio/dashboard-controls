(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclDeployLog', {
            bindings: {
                logEntires: '<'
            },
            templateUrl: 'nuclio/common/components/deploy-log/deploy-log.tpl.html',
            controller: NclDeployLogController
        });

    function NclDeployLogController(lodash) {
        var ctrl = this;

        ctrl.scrollCofig = {
            advanced: {
                updateOnContentResize: true
            },
            theme: 'light-thin'
        };

        ctrl.getLogLevel = getLogLevel;
        ctrl.getLogParams = getLogParams;

        //
        // Public methods
        //

        /**
         * Get log level display value
         * @param {string} level - the level model value (one of: 'debug', 'info', 'warn', 'error')
         * @returns {string} the log level display value
         */
        function getLogLevel(level) {
            return lodash.first(level).toUpperCase();
        }

        /**
         * Get log parameters display value
         * @param {string} logEntry - the log entry that includes the parameters
         * @returns {string} the log level display value
         */
        function getLogParams(logEntry) {
            var params = lodash.omit(logEntry, ['name', 'time', 'level', 'message', 'err']);

            return lodash.isEmpty(params) ? '' : '[' + lodash.map(params, function (value, key) {
                return key + ': ' + angular.toJson(value);
            }).join(', ').replace(/\\n/g, '\n').replace(/\\"/g, '"') + ']';
        }
    }
}());
