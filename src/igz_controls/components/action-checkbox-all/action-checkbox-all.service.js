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
        .factory('ActionCheckboxAllService', ActionCheckboxAllService);

    function ActionCheckboxAllService($rootScope) {
        return {
            changeCheckedItemsCount: changeCheckedItemsCount,
            setCheckedItemsCount: setCheckedItemsCount
        };

        //
        // Public methods
        //

        /**
         * Sends broadcast with count of changed checked items
         * @param {number} changedCheckedItemsCount - number of changed checked items
         */
        function changeCheckedItemsCount(changedCheckedItemsCount) {
            $rootScope.$broadcast('action-checkbox-all_change-checked-items-count', {
                changedCheckedItemsCount: changedCheckedItemsCount
            });
        }

        /**
         * Sends broadcast with count of checked items
         * @param {number} checkedItemsCount
         */
        function setCheckedItemsCount(checkedItemsCount) {
            $rootScope.$broadcast('action-checkbox-all_set-checked-items-count', checkedItemsCount);
        }
    }
}());
