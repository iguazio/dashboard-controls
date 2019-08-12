(function () {
    'use strict';
    angular.module('iguazio.dashboard-controls')
        .controller('PaginationController', PaginationController);

    /*eslint no-shadow: 0*/
    function PaginationController($i18next, $injector , $location, $rootScope, $stateParams, $timeout,
                                  i18next, lodash, ActionCheckboxAllService, PaginationService,
                                  entitiesType, onChangePageCallback, dataServiceName, vm, emptyOnPageChange) {

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
         * Changes entities by getting new portion of data from the back-end.
         * @param {number} pageNumber - new page number to get data from.
         * @param {number} perPage - how many items should be present on a page.
         * @param {Object} [additionalParams] - additional parameters that should be passed to data service method
         *     (e.g. filter, include, sort, etc.).
         */
        function changePage(pageNumber, perPage, additionalParams) {
            var pageAdditionalParams = lodash.cloneDeep(additionalParams);
            selectedItemId = lodash.defaultTo($stateParams.selectedItemId, $location.search().id);
            selectedItemId = isNumeric(selectedItemId) ? lodash.toInteger(selectedItemId) : selectedItemId;

            vm.isSplashShowed.value = lodash.get(additionalParams, 'isSplashShowed', true);

            if (lodash.isFunction(vm.closeInfoPane)) {
                vm.closeInfoPane();
            }

            vm.page.size = perPage;
            vm.page.number = lodash.isNil(selectedItemId) ? pageNumber : 0;

            if (!lodash.defaultTo(vm.preventModifyURL, false)) {
                $location.search('pageSize', vm.page.size);

                if (lodash.isNil($location.search().id)) {
                    $location.search('pageNumber', vm.page.number + 1);
                }
            }

            // save entities ui state
            vm.entityUiConfig = lodash.map(vm[entitiesType], function (el) {
                return lodash.pick(el, ['id', 'ui']);
            });

            if (lodash.defaultTo(emptyOnPageChange, true)) {
                vm[entitiesType] = [];
            }

            // abort all pending statistics requests
            $rootScope.$broadcast('statistics-data_abort-requests');

            var methodName = entitiesType + 'Paginated';
            return dataService[methodName](lodash.isNil(selectedItemId) ? vm.page.number : null,
                                           vm.page.size,
                                           fillAdditionalParams(pageAdditionalParams),
                                           entityId)
                .then(function (response) {
                    vm[entitiesType] = response;

                    // restore entities ui.checked state after page changing
                    if (vm.entityUiConfig.length > 0) {
                        lodash.forEach(vm[entitiesType], function (el) {
                            lodash.merge(el, {
                                ui: {
                                    checked: lodash.chain(vm.entityUiConfig)
                                        .find({ id: el.id })
                                        .get('ui.checked')
                                        .defaultTo(false)
                                        .value()
                                }
                            });
                        });
                        var checkedItems = lodash.filter(vm[entitiesType], ['ui.checked', true]);
                        ActionCheckboxAllService.setCheckedItemsCount(checkedItems.length);
                    }

                    vm.page.total = lodash.get(vm[entitiesType], 'total_pages', 1);
                    vm.page.number = lodash.get(vm[entitiesType], 'page_number', vm.page.number);

                    if (!lodash.defaultTo(vm.preventModifyURL, false) && lodash.isNil($location.search().id)) {
                        $location.search('pageNumber', vm.page.number + 1);
                    }

                    checkPageNumber(additionalParams);

                    if (!lodash.isNil(selectedItemId)) {
                        $timeout(function () {
                            var selectedItem = lodash.find(vm[entitiesType], { id: selectedItemId });

                            $rootScope.$broadcast(entitiesType.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase() +
                                '-table-row_on-select-row', selectedItem);
                            $stateParams.selectedItemId = null;
                        });
                    }

                    checkSearchStates();

                    // if some additional processing required
                    if (lodash.isFunction(onChangePageCallback)) {
                        onChangePageCallback();
                    }

                    // Hide loading splash screen
                    vm.isSplashShowed.value = false;
                })
                .catch(function (error) {
                    var errorMessages = {
                        '400': $i18next.t('common:ERROR_MSG.PAGINATION.400', { lng: lng }),
                        '403': $i18next.t('common:ERROR_MSG.PAGINATION.403', { lng: lng }),
                        '500': $i18next.t('common:ERROR_MSG.ERROR_ON_SERVER_SIDE', { lng: lng }),
                        'default': $i18next.t('common:ERROR_MSG.UNKNOWN_ERROR', { lng: lng })
                    };
                    var message = lodash.get(errorMessages, String(error.status), errorMessages.default);

                    $rootScope.$broadcast('splash-screen_show-error', {
                        alertText: message + ' ' + $i18next.t('common:ERROR_MSG.YOU_CAN_TRY_TO_REFRESH_PAGE', { lng: lng })
                    });
                });
        }

        /**
         * Updates current page by reloading it with the same page number and page size.
         * @param {Object} additionalParams -
         */
        function updatePagination(additionalParams) {
            return vm.changePage(vm.page.number, vm.page.size, additionalParams);
        }

        //
        // Private methods
        //

        /**
         * Constructor method.
         */
        function activate() {
            initializePageInfo();

            dataService = $injector.get(
                lodash.defaultTo(dataServiceName, lodash.upperFirst(entitiesType) + 'DataService')
            );
        }

        /**
         * Checks if page number (from response) is out of bounds. If it is, goes to last page.
         * @param {Object} [additionalParams] - additional parameters that should be passed to data service method.
         */
        function checkPageNumber(additionalParams) {
            var oldPageNumber = vm.page.number;
            vm.page.number = lodash.clamp(vm.page.number, 0, vm.page.total - 1);
            if (oldPageNumber !== vm.page.number) {
                vm.updatePagination(additionalParams);
            }
        }

        /**
         * Toggles `searchNotFound` state on or off according to the list being empty or not.
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
            if (!lodash.isObject(additionalParams)) {
                additionalParams = {};
            }

            additionalParams.sort = (vm.isReverseSorting ? '-' : '') + vm.sortedColumnName;

            if (!lodash.isNil(selectedItemId)) {
                additionalParams['page[of]'] = selectedItemId;
            }

            if (lodash.isFunction(vm.clearFilters) && !lodash.isNil(selectedItemId)) {
                vm.clearFilters();
            }

            if (lodash.isFunction(vm.getActiveFilters)) {
                lodash.defaultsDeep(additionalParams, vm.getActiveFilters());
            }

            return additionalParams;
        }

        /**
         * Initializes page info.
         */
        function initializePageInfo() {
            lodash.defaultsDeep(vm, {
                page: {
                    number: 0,
                    size: 10,
                    total: 0
                }
            });

            // Get data provided in url
            var providedData = $location.search();
            var pageSize = Number.parseInt(lodash.get(providedData, 'pageSize'));
            var providedPageSizeValue = Number.isInteger(pageSize) ? pageSize : vm.page.size;

            // Set page size
            var perPageOptions = lodash.isNil(vm.perPageValues) ? PaginationService.perPageDefaults() : vm.perPageValues;
            var perPage = lodash.chain(perPageOptions)
                .sortBy('id')
                .map('id')
                .find(function (option) {
                    return option >= providedPageSizeValue;
                })
                .defaultTo(lodash.maxBy(perPageOptions, 'id').id)
                .value();

            vm.page.size = PaginationService.getPageSize(entitiesType, perPage);

            // Set page number
            var providedPageNumber = Number.parseInt(lodash.get(providedData, 'pageNumber'));
            vm.page.number = !lodash.isInteger(providedPageNumber) ? vm.page.number :
                Math.max(providedPageNumber - 1, 0);
        }
    }

    /**
     * Checks if a string is a whole number (i.e. consists of digits only).
     * @param {string} value - the string to test.
     * @returns {boolean} `ture` if `value` consists of digit characters only, or `false` otherwise.
     */
    function isNumeric(value) {
        return /^\d+$/.test(value);
    }
}());
