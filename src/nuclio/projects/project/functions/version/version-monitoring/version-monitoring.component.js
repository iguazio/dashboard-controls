(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclVersionMonitoring', {
            bindings: {
                version: '<'
            },
            templateUrl: 'nuclio/projects/project/functions/version/version-monitoring/version-monitoring.tpl.html',
            controller: NclVersionMonitoringController
        });

    function NclVersionMonitoringController($rootScope, $timeout, lodash, DialogsService, NuclioProjectsDataService) {
        var ctrl = this;

        ctrl.errorScrollConfig = {
            advanced: {
                updateOnContentResize: true
            }
        };
        ctrl.invocationURL = '';
        ctrl.loggerScrollConfig = {
            advanced: {
                updateOnContentResize: true
            },
            theme: 'light-thin'
        };
        ctrl.rowIsCollapsed = {
            buildLog: false,
            errorLog: false,
        };

        ctrl.$onInit = onInit;

        ctrl.getLogLevel = getLogLevel;
        ctrl.getLogParams = getLogParams;
        ctrl.onRowCollapse = onRowCollapse;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            if (lodash.isNil(ctrl.version.status) || lodash.isNil(ctrl.version.status.httpPort)) {
                ctrl.invocationURL = 'Not yet deployed';
            } else {
                NuclioProjectsDataService.getExternalIPAddresses()
                    .then(function (response) {
                        ctrl.invocationURL = 'http://' + response.data.externalIPAddresses.addresses[0] + ':' + ctrl.version.status.httpPort;
                    })
                    .catch(function () {
                        DialogsService.alert('Oops: Unknown error occurred while retrieving external IP address');
                    });
            }
        }

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

        /**
         * Called when row is collapsed/expanded
         * @param {string} row - name of expanded/collapsed row
         */
        function onRowCollapse(row) {
            ctrl.rowIsCollapsed[row] = !ctrl.rowIsCollapsed[row];

            $timeout(resizeVersionView, 350);
        }

        //
        // Private method
        //

        /**
         * Resize view after test result is closed
         */
        function resizeVersionView() {
            var clientHeight = document.documentElement.clientHeight;
            var navigationTabs = angular.element(document).find('.ncl-navigation-tabs')[0];
            var contentView = angular.element(document).find('.ncl-edit-version-view')[0];
            var contentBlock = angular.element(document).find('.ncl-version')[0];
            var navigationRect = navigationTabs.getBoundingClientRect();
            var contentHeight = clientHeight - navigationRect.bottom;

            contentView = angular.element(contentView);
            contentBlock = angular.element(contentBlock);

            contentView.css({'height': contentHeight + 'px'});
            contentBlock.css({'height': contentHeight + 'px'});

            $rootScope.$broadcast('igzWatchWindowResize::resize');
        }
    }
}());
