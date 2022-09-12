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
        .factory('NuclioHeaderService', NuclioHeaderService);

    function NuclioHeaderService($rootScope, $state, lodash) {
        return {
            updateMainHeader: updateMainHeader
        };

        //
        // Public methods
        //

        /**
         * Sends broadcast with needed data object to dynamically update main header title
         * @param {string} title
         * @param {string} subtitles
         * @param {string} state
         */
        function updateMainHeader(title, subtitles, state) {
            var mainHeaderState = lodash.find($state.get(), function (mainState) {
                return mainState.url === lodash.trim($state.$current.url.prefix, '/');
            }).name;

            var mainHeaderTitle = {
                title: title,
                project: subtitles.project,
                function: lodash.defaultTo(subtitles.function, null),
                version: lodash.defaultTo(subtitles.version, null),
                tab: lodash.defaultTo(subtitles.tab, null),
                state: state,
                mainHeaderState: mainHeaderState
            };

            $rootScope.$broadcast('update-main-header-title', mainHeaderTitle);
        }
    }
}());
