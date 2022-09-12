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
        .factory('PriorityDropdownService', PriorityDropdownService);

    function PriorityDropdownService($i18next, i18next) {
        return {
            getName: getName,
            getPrioritiesArray: getPrioritiesArray
        };

        //
        // Public methods
        //

        /**
         * Gets array of priority types
         * @returns {Array}
         */
        function getPrioritiesArray() {
            var lng = i18next.language;

            return [
                {
                    name: $i18next.t('common:REAL_TIME', {lng: lng}),
                    type: 'realtime',
                    icon: {
                        name: 'igz-icon-priority-realtime'
                    }
                },
                {
                    name: $i18next.t('common:HIGH', {lng: lng}),
                    type: 'high',
                    icon: {
                        name: 'igz-icon-priority-high'
                    }
                },
                {
                    name: $i18next.t('common:STANDARD', {lng: lng}),
                    type: 'standard',
                    icon: {
                        name: 'igz-icon-priority-standard'
                    }
                },
                {
                    name: $i18next.t('common:LOW', {lng: lng}),
                    type: 'low',
                    icon: {
                        name: 'igz-icon-priority-low'
                    }
                }
            ];
        }

        /**
         * Gets name of priority depends on type
         * @param {string} type
         * @returns {string}
         */
        function getName(type) {
            var lng = i18next.language;

            return type === 'realtime' ? $i18next.t('common:REAL_TIME', {lng: lng}) :
                   type === 'high'     ? $i18next.t('common:HIGH', {lng: lng})      :
                   type === 'standard' ? $i18next.t('common:STANDARD', {lng: lng})  :
                   type === 'low'      ? $i18next.t('common:LOW', {lng: lng})       : '';
        }
    }
}());
