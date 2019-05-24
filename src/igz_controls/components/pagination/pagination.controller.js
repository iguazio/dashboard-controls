(function () {
    'use strict';
    angular.module('iguazio.dashboard-controls')
        .controller('PaginationController', PaginationController);

    /*eslint no-shadow: 0*/
    function PaginationController($rootScope, $injector, $location, $stateParams, $timeout, $i18next, i18next, lodash,
                                  entitiesType, onChangePageCallback, dataServiceName, ActionCheckboxAllService,
                                  PaginationService, vm) {

        // entityId - id of nested entity
        var entityId = lodash.defaultTo($location.search().entityId, $stateParams.id);
        var selectedItemId = $stateParams.selectedItemId || $location.search().id;
        var dataService = null;
        var lng = i18next.language;

        vm.sort = '';
        vm.entityUiConfig = [];

        vm.changePage = changePage;
        vm.updatePagination = updatePagination;

        activate();

        //
        // Public methods
        //

        /**
         * Updates page numbering after actions on entities (removing, duplicating or adding new entity) had been
         * finished
         */
        function updatePagination(additionalParams) {
            return vm.changePage(vm.page.number, vm.page.size, additionalParams);
        }

        /**
         * Changes entities by getting new portion of data from the back-end
         * @param {number} pageNumber - new page number to get data from
         * @param {number} perPage - how many items should be present on a page
         * @param {Object} [additionalParams] - additional parameters that should be passed to data service method
         */
        function changePage(pageNumber, perPage, additionalParams) {
            var pageAdditionalParams = angular.copy(additionalParams);
            selectedItemId = $stateParams.selectedItemId || $location.search().id;
            selectedItemId = isNumeric(selectedItemId) ? lodash.toInteger(selectedItemId) : selectedItemId;

            vm.isSplashShowed.value = true;

            if (angular.isFunction(vm.closeInfoPane)) {
                vm.closeInfoPane();
            }

            vm.page.size = perPage;
            vm.page.number = lodash.isNil(selectedItemId) ? pageNumber : 0;

            if (lodash.isNil(vm.preventModifyURL) || !vm.preventModifyURL) {
                $location.search('pageSize', vm.page.size);

                if (lodash.isNil($location.search().id)) {
                    $location.search('pageNumber', vm.page.number + 1);
                }
            }

            // save entities ui state
            vm.entityUiConfig = lodash.map(vm[entitiesType], function (el) {
                return lodash.pick(el, ['id', 'ui']);
            });

            // is needed to make PushService work correctly.
            vm[entitiesType] = [];

            // abort all pending statistics requests
            $rootScope.$broadcast('statistics-data_abort-requests');

            return dataService[entitiesType + 'Paginated'](lodash.isNil(selectedItemId) ? vm.page.number : null,
                vm.page.size, fillAdditionalParams(pageAdditionalParams), entityId)
                .then(function (response) {
                    vm[entitiesType] = response;

                    // restore entities ui.checked state after page changing
                    if (vm.entityUiConfig.length > 0) {
                        angular.forEach(vm[entitiesType], function (el) {
                            lodash.assign(el, {
                                ui: {
                                    checked: lodash.get(lodash.find(vm.entityUiConfig, {'id': el.id}), 'ui.checked', false)
                                }
                            });
                        });
                        ActionCheckboxAllService.setCheckedItemsCount(lodash.filter(vm[entitiesType], 'ui.checked').length);
                    }

                    vm.page.total = vm[entitiesType]['total_pages'] || 1;
                    vm.page.number = lodash.get(vm[entitiesType], 'page_number', vm.page.number);

                    if ((lodash.isNil(vm.preventModifyURL) || !vm.preventModifyURL) && lodash.isNil($location.search().id)) {
                        $location.search('pageNumber', vm.page.number + 1);
                    }

                    checkPageNumber(additionalParams);

                    if (!lodash.isNil(selectedItemId)) {
                        $timeout(function () {
                            var selectedItem = lodash.find(vm[entitiesType], {id: selectedItemId});

                            $rootScope.$broadcast(entitiesType.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase() + '-table-row_on-select-row', selectedItem);
                            $stateParams.selectedItemId = null;
                        });
                    }

                    checkSearchStates();

                    // if some additional processing required
                    if (angular.isFunction(onChangePageCallback)) {
                        onChangePageCallback();
                    }

                    // Hide loading splash screen
                    vm.isSplashShowed.value = false;
                })
                .catch(function (error) {
                    var errorMessages = {
                        '400': $i18next.t('common:ERROR_MSG.PAGINATION.400', {lng: lng}),
                        '403': $i18next.t('common:ERROR_MSG.PAGINATION.403', {lng: lng}),
                        '500': $i18next.t('common:ERROR_MSG.ERROR_ON_SERVER_SIDE', {lng: lng}),
                        'default': $i18next.t('common:ERROR_MSG.UNKNOWN_ERROR', {lng: lng})
                    };
                    var message = lodash.get(errorMessages, String(error.status), errorMessages.default);

                    $rootScope.$broadcast('splash-screen_show-error', {
                        alertText: message + ' ' + $i18next.t('common:ERROR_MSG.YOU_CAN_TRY_TO_REFRESH_PAGE', {lng: lng})
                    });
                });
        }

        //
        // Private methods
        //

        /**
         * Constructor method
         */
        function activate() {
            initializePageInfo();

            dataService = $injector.get(
                dataServiceName ? dataServiceName : lodash.upperFirst(entitiesType) + 'DataService'
            );
        }

        /**
         * Checks page number
         * Sets it to correct one if it's not valid
         * @param {Object} [additionalParams] - additional parameters that should be passed to data service method
         */
        function checkPageNumber(additionalParams) {
            var oldPageNumber = vm.page.number;
            vm.page.number = Math.min(vm.page.number, vm.page.total - 1);
            if (oldPageNumber !== vm.page.number) {
                vm.changePage(vm.page.number, vm.page.size, additionalParams);
            }
        }

        /**
         * Checks if there is items in the list
         */
        function checkSearchStates() {
            if (!lodash.isNil(vm.searchStates)) {
                vm.searchStates.searchNotFound = vm[entitiesType].length === 0 && vm.page.number === 0;
            }
        }

        /**
         * Returns additional params with items id, filtering and sorting if it exists
         * @param {Object} [additionalParams={}]
         * @returns {Object}
         */
        function fillAdditionalParams(additionalParams) {
            if (!angular.isObject(additionalParams)) {
                additionalParams = {};
            }

            lodash.assign(additionalParams, {
                sort: (vm.isReverseSorting ? '-' : '') + vm.sortedColumnName // needs for sorting on back-end
            });

            if (!lodash.isNil(selectedItemId)) {
                lodash.assign(additionalParams, {
                    'page[of]': selectedItemId
                });
            }

            if (angular.isFunction(vm.clearFilters) && !lodash.isNil(selectedItemId)) {
                vm.clearFilters();
            }

            if (angular.isFunction(vm.getActiveFilters)) {
                lodash.defaultsDeep(additionalParams, vm.getActiveFilters());
            }

            return additionalParams;
        }

        /**
         * Checks if a string is a whole number
         * @param {string} value
         * @returns {boolean}
         */
        function isNumeric(value) {
            return /^\d+$/.test(value);
        }

        /**
         * Initializes page info
         */
        function initializePageInfo() {
            if (lodash.isNil(vm.page)) {
                vm.page = {
                    number: 0,
                    size: 10, // default amount of container items per page
                    total: 0
                };
            }

            // Get data provided in url
            var providedData = $location.search();
            var providedPageSizeValue = Number.isInteger(parseInt(lodash.get(providedData, 'pageSize'))) ?
                parseInt(lodash.get(providedData, 'pageSize')) : vm.page.size;

            // Set page size
            var perPageOptions = lodash.isNil(vm.perPageValues) ? PaginationService.perPageDefaults() : vm.perPageValues;
            var perPage = lodash.chain(perPageOptions)
                .sortBy('id')
                .map('id')
                .find(function (option) {
                    return option >= providedPageSizeValue;
                })
                .value();

            if (angular.isUndefined(perPage)) {
                perPage = lodash.maxBy(perPageOptions, 'id').id;
            }
            vm.page.size = PaginationService.getPageSize(entitiesType, perPage);

            // Set a page number
            var providedPageNumber = parseInt(lodash.get(providedData, 'pageNumber'));
            vm.page.number = !lodash.isInteger(providedPageNumber) ? vm.page.number :
                Math.max(providedPageNumber - 1, 0);
        }
    }
}());
