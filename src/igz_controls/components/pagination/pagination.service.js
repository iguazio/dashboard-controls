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
        .factory('PaginationService', PaginationService);

    function PaginationService($controller, lodash, LocalStorageService) {
        return {
            addPagination: addPagination,
            perPageDefaults: perPageDefaults,
            getPageSize: getPageSize
        };

        //
        // Public methods
        //

        /**
         * Initialize new Pagination controller and bind it's method to another controller
         * @param {Object} controller vm
         * @param {string} entitiesType name of entities type
         * @param {string} [dataServiceName] Name of DataService
         * @param {function} [onChangePageCallback] Additional code that should be executed after page changed
         * @param {boolean} [emptyOnPageChange=true] Set to `false` to prevent list from emptying before repopulating
         * @param {Promise.<Object> | Object} [customErrors] List of custom errors messages
         */
        function addPagination(controller, entitiesType, dataServiceName, onChangePageCallback, emptyOnPageChange, customErrors) {
            $controller('PaginationController', {
                entitiesType: entitiesType,
                onChangePageCallback: onChangePageCallback,
                dataServiceName: dataServiceName,
                vm: controller,
                emptyOnPageChange: emptyOnPageChange,
                customErrors: customErrors
            });
        }

        /**
         * Returns default values for perPage dropdown
         * @returns {Array.<Object>}
         */
        function perPageDefaults() {
            return [
                {
                    id: 10,
                    name: '10'
                },
                {
                    id: 20,
                    name: '20'
                },
                {
                    id: 30,
                    name: '30'
                },
                {
                    id: 40,
                    name: '40'
                }
            ];
        }

        /**
         * Gets page size from localStorage if it exist there.
         * If no - set default page size to localStorage and return it
         * @param {string} entity - entity name
         * @param {number} pageSize - default value of page size
         * @returns {number}
         */
        function getPageSize(entity, pageSize) {
            var storedPerPage = angular.copy(LocalStorageService.getItem('itemsPerPage', entity));

            if (lodash.isNil(storedPerPage)) {
                LocalStorageService.setItem('itemsPerPage', entity, pageSize);
                storedPerPage = pageSize;
            }

            return storedPerPage;
        }
    }
}());
