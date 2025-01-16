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
        .component('igzElasticLogTableRow', {
            bindings: {
                entryItem: '<'
            },
            templateUrl: 'igz_controls/components/log-table-row/log-table-row.tpl.html',
            controller: IgzElasticLogTableRowController
        });

    function IgzElasticLogTableRowController(lodash) {
        var ctrl = this;

        ctrl.getLogLevel = getLogLevel;
        ctrl.getLogName = getLogName;

        //
        // Public methods
        //

        /**
         * Get log level display value
         * @returns {string} the log level display value
         */
        function getLogLevel() {
            return lodash.first(ctrl.entryItem.level).toUpperCase();
        }

        /**
         * Get log name display value
         * @returns {string} the log name display value
         */
        function getLogName() {
            var name = lodash.get(ctrl.entryItem, 'kubernetes.pod.name', lodash.get(ctrl.entryItem, 'name', ''));

            return lodash.padEnd(name.substring(0, 25), 25);
        }
    }
}());
