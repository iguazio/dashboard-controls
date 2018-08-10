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
         */
        function addPagination(controller, entitiesType, dataServiceName, onChangePageCallback) {
            $controller('PaginationController', {
                entitiesType: entitiesType,
                onChangePageCallback: onChangePageCallback,
                dataServiceName: dataServiceName,
                vm: controller
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
