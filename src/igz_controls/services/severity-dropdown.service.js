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
        .factory('SeverityDropdownService', SeverityDropdownService);

    function SeverityDropdownService($i18next, i18next) {
        return {
            getSeveritiesArray: getSeveritiesArray
        };

        //
        // Public methods
        //

        /**
         * Gets array of severity types
         * @returns {Array}
         */
        function getSeveritiesArray() {
            var lng = i18next.language;
            return [
                {
                    name: $i18next.t('common:ERROR', {lng: lng}),
                    type: 'error',
                    icon: {
                        name: 'igz-icon-warning severity-icon critical'
                    }
                },
                {
                    name: $i18next.t('common:DEBUG', {lng: lng}),
                    type: 'debug',
                    icon: {
                        name: 'igz-icon-warning severity-icon major'
                    }
                },
                {
                    name: $i18next.t('common:WARNING', {lng: lng}),
                    type: 'warning',
                    icon: {
                        name: 'igz-icon-warning severity-icon warning'
                    }
                },
                {
                    name: $i18next.t('common:INFO', {lng: lng}),
                    type: 'info',
                    icon: {
                        name: 'igz-icon-info-round severity-icon info'
                    }
                }
            ];
        }
    }
}());
