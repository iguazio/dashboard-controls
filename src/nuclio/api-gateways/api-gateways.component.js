/* eslint max-params: ["error", 25] */
(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclApiGateways', {
            bindings: {
                createApiGateway: '&',
                deleteApiGateway: '&',
                getApiGateway: '&',
                getApiGateways: '&',
                getFunctions: '&',
                project: '<',
                updateApiGateway: '&'
            },
            templateUrl: 'nuclio/api-gateways/api-gateways.tpl.html',
            controller: ApiGatewaysController
        });

    function ApiGatewaysController($interval, $q, $rootScope, $scope, $state, $timeout, $i18next, i18next, lodash,
                                   ngDialog, ApiGatewaysService, CommonTableService, ConfigService, DialogsService,
                                   GeneralDataService, NuclioHeaderService) {
        var ctrl = this;
        var lng = i18next.language;

        var POLL_TIMEOUT_DELAY_MILLIS = 300000;

        var pollingCancelDeferred = null;
        var updatingInterval = null;
        var updatingIntervalTime = ConfigService.screenAutoRefreshIntervals.apiGateways;
        var apiGateways = [];

        ctrl.apiGateways = [];
        ctrl.apiGatewayActions = [];
        ctrl.filtersData = {
            apiGatewayName: {
                keys: ['metadata.name'],
                searchQuery: ''
            },
            endPoint: {
                keys: ['spec.host'],
                searchQuery: ''
            },
            primary: {
                keys: ['spec.upstreams[0].nucliofunction.name'],
                searchQuery: ''
            },
            canary: {
                keys: ['spec.upstreams[1].nucliofunction.name'],
                searchQuery: ''
            }
        };
        ctrl.filtersCounter = 0;
        ctrl.isFiltersShowed = {
            value: false,
            changeValue: function (newVal) {
                this.value = newVal;
            }
        };
        ctrl.isReverseSorting = false;
        ctrl.isSplashShowed = {
            value: true
        };
        ctrl.searchStates = {};
        ctrl.sortedColumnName = 'name';

        ctrl.$onInit = onInit;
        ctrl.$onDestroy = onDestroy;

        ctrl.handleApiGatewayAction = handleApiGatewayAction;
        ctrl.isApiGatewaysListEmpty = isApiGatewaysListEmpty;
        ctrl.onApplyFilters = onApplyFilters;
        ctrl.onChangeSearchQuery = onChangeSearchQuery;
        ctrl.onResetFilters = onResetFilters;
        ctrl.openApiGatewayWizard = openApiGatewayWizard;
        ctrl.pollAndUpdate = pollAndUpdate;
        ctrl.refreshApiGateways = refreshApiGateways;
        ctrl.sortTableByColumn = sortTableByColumn;
        ctrl.toggleFilters = toggleFilters;

        ctrl.getColumnSortingClasses = CommonTableService.getColumnSortingClasses;
        ctrl.isDemoMode = ConfigService.isDemoMode;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            initApiGateways();

            // initializes apiGateway actions array
            ctrl.apiGatewayActions = ApiGatewaysService.initApiGatewayActions();

            updatePanelActions();

            $scope.$on('action-panel_fire-action', onFireAction);
            $scope.$on('action-checkbox-all_checked-items-count-change', updatePanelActions);
            $scope.$on('action-checkbox-all_check-all', updatePanelActions);

            $timeout(function () {
                // update breadcrumbs
                var title = {
                    project: ctrl.project,
                    tab: $i18next.t('functions:API_GATEWAYS', { lng: lng })
                };

                NuclioHeaderService.updateMainHeader('common:PROJECTS', title, $state.current.name);
            });
        }

        /**
         * Destructor method
         */
        function onDestroy() {
            if (!lodash.isNull(pollingCancelDeferred)) {
                pollingCancelDeferred.resolve();
            }

            stopAutoUpdate();
        }

        //
        // Public methods
        //

        /**
         * According to given action name calls proper action handler
         * @param {string} actionType - ex. `delete`
         * @param {Array} checkedItems - an array of checked API Gateways
         * @returns {Promise}
         */
        function handleApiGatewayAction(actionType, checkedItems) {
            var promises = [];

            lodash.forEach(checkedItems, function (checkedItem) {
                var actionHandler = checkedItem.ui[actionType];

                if (lodash.isFunction(actionHandler)) {
                    promises.push(actionHandler());
                }
            });

            return $q.all(promises).then(function () {
                if (actionType === 'delete') {
                    return refreshApiGateways();
                }
            });
        }

        /**
         * Checks if API Gateways list is empty
         * @returns {boolean}
         */
        function isApiGatewaysListEmpty() {
            return lodash.isEmpty(apiGateways);
        }

        /**
         * Updates API Gateways list depends on filters value
         */
        function onApplyFilters() {
            $rootScope.$broadcast('search-input_refresh-search');
        }

        /**
         * Handles on update filters counter
         * @param {string} searchQuery
         * @param {string} multiSearchName - unique name of the search input
         */
        function onChangeSearchQuery(searchQuery, multiSearchName) {
            lodash.set(ctrl.filtersData, [multiSearchName, 'searchQuery'], searchQuery);

            var appliedFilters = lodash.filter(ctrl.filtersData, function (filter) {
                return filter.searchQuery !== '';
            });
            ctrl.filtersCounter = appliedFilters.length;
        }

        /**
         * Handles on reset filters event
         */
        function onResetFilters() {
            $rootScope.$broadcast('search-input_reset');

            ctrl.filtersCounter = 0;
        }

        /**
         * Opens new API Gateway wizard
         */
        function openApiGatewayWizard(editWizard) {
            ngDialog.open({
                template: '<ncl-new-api-gateway-wizard data-api-gateways="ngDialogData.apiGateways" ' +
                    'data-api-gateway="ngDialogData.apiGateway" ' +
                    'data-edit-wizard="ngDialogData.editWizard" ' +
                    'data-close-dialog="closeThisDialog({newApiGateway, taskId})" ' +
                    'data-ng-dialog-id="{{ngDialogData.ngDialogId}}" ' +
                    'data-project="ngDialogData.project" ' +
                    'data-create-api-gateway="ngDialogData.createApiGateway({apiGateway: apiGateway, projectName: projectName})" ' +
                    'data-update-api-gateway="ngDialogData.updateApiGateway({apiGateway: apiGateway, projectName: projectName})" ' +
                    'data-get-functions="ngDialogData.getFunctions({projectName: projectName, enrichApiGateways: enrichApiGateways})" ' +
                    'class="new-item-wizard igz-component"></ncl-new-api-gateway-wizard>',
                plain: true,
                scope: $scope,
                data: {
                    apiGateway: {},
                    apiGateways: apiGateways,
                    editWizard: editWizard,
                    project: ctrl.project,
                    createApiGateway: ctrl.createApiGateway,
                    updateApiGateway: ctrl.updateApiGateway,
                    getFunctions: ctrl.getFunctions
                },
                className: 'ngdialog-new-item-wizard'
            }).closePromise
                .then(function (data) {
                    var newApiGateway = lodash.get(data, 'value.newApiGateway');

                    if (newApiGateway) {
                        lodash.set(newApiGateway, 'status.state', '');
                        apiGateways.push(newApiGateway);
                        sortTableByColumn(ctrl.sortedColumnName, true);
                        ctrl.pollAndUpdate(newApiGateway);
                    }
                });
        }

        /**
         * Polls api-gateway until it is no longer in the process of status change,
         * then updates this api-gateway and hides its loading spinner.
         * @param {Object} apiGateway - the API gateway to poll and update.
         */

        function pollAndUpdate(apiGateway) {
            ApiGatewaysService.showStatusSpinner(apiGateway);
            var pollMethod = ctrl.getApiGateway.bind(null, {
                apiGatewayName: lodash.get(apiGateway, 'spec.name'),
                projectName: lodash.get(ctrl.project, 'metadata.name', '')
            });
            pollingCancelDeferred = $q.defer();
            $timeout(function () {
                pollingCancelDeferred.resolve();
            }, POLL_TIMEOUT_DELAY_MILLIS);
            GeneralDataService.poll(pollMethod,
                                    ApiGatewaysService.isSteadyState,
                                    { timeoutPromise: pollingCancelDeferred.promise })
                .then(function (updatedApiGateway) {
                    if (!lodash.isNil(updatedApiGateway)) {
                        lodash.merge(apiGateway, updatedApiGateway);
                        ApiGatewaysService.buildEndpoint(apiGateway);
                    }
                })
                .finally(function () {
                    if (ApiGatewaysService.isSteadyState(apiGateway)) {
                        ApiGatewaysService.hideStatusSpinner(apiGateway);
                    }
                });
        }

        /**
         * Refreshes API gateways list.
         * @param {boolean} [hideLoader=false] - set to `true` to prevent showing the loader.
         * @returns {Promise}
         */
        function refreshApiGateways(hideLoader) {
            if (!lodash.defaultTo(hideLoader, false)) {
                ctrl.isSplashShowed.value = true;
            }

            return ctrl.getApiGateways({ projectName: lodash.get(ctrl.project, 'metadata.name', '') })
                .then(function (apiGatewaysList) {
                    apiGateways = lodash.map(apiGatewaysList, function (apiGateway) {
                        var foundApiGateway = lodash.find(apiGateways, ['metadata.name', apiGateway.metadata.name]);
                        var ui = lodash.get(foundApiGateway, 'ui');
                        apiGateway.ui = lodash.defaultTo(ui, apiGateway.ui);

                        return apiGateway;
                    });

                    sortTableByColumn(ctrl.sortedColumnName, true);

                    // hide loaders for API gateways in steady state
                    var steadyApiGateways = lodash.filter(apiGateways, ApiGatewaysService.isSteadyState);
                    ApiGatewaysService.hideStatusSpinner(steadyApiGateways);

                    // show loaders for API gateways in steady state
                    var transientApiGateways = lodash.filter(apiGateways, ApiGatewaysService.isTransientState);
                    ApiGatewaysService.showStatusSpinner(transientApiGateways);
                })
                .catch(function (error) {
                    var defaultMsg = $i18next.t('functions:ERROR_MSG.GET_API_GATEWAYS', { lng: lng });

                    DialogsService.alert(lodash.get(error, 'data.error', defaultMsg)).then(function () {
                        $state.go('app.project.functions');
                    });
                })
                .finally(function () {
                    ctrl.isSplashShowed.value = false;
                });
        }

        /**
         * Sorts the table by column name
         * @param {string} columnName - name of column
         * @param {boolean} isJustSorting - if it is needed just to sort data without changing reverse
         */
        function sortTableByColumn(columnName, isJustSorting) {
            if (!isJustSorting) {

                // changes the order of sorting the column
                ctrl.isReverseSorting = columnName === ctrl.sortedColumnName && !ctrl.isReverseSorting;
            }

            // saves the name of sorted column
            ctrl.sortedColumnName = columnName;

            var predicateByColumnName = {
                name: 'spec.name',
                endpoint: 'spec.host',
                primary: ApiGatewaysService.getPrimaryName,
                canary: ApiGatewaysService.getCanaryName,
                canaryPercentage: ApiGatewaysService.getCanaryPercentage,
                authenticationMode: 'spec.authenticationMode',
                status: 'status.state',
                createdBy: function (apiGateway) {
                    return lodash.chain(apiGateway)
                        .get('metadata.labels')
                        .get('iguazio.com/username')
                        .value();
                },
                createdAt: 'metadata.creationTimestamp'
            };

            var predicate = lodash.defaultTo(predicateByColumnName[columnName], columnName);

            ctrl.apiGateways = lodash.orderBy(apiGateways, [predicate], ctrl.isReverseSorting ? ['desc'] : ['asc']);
        }

        /**
         * Shows/hides filters panel
         */
        function toggleFilters() {
            ctrl.isFiltersShowed.value = !ctrl.isFiltersShowed.value;
        }

        //
        // Private methods
        //

        /**
         * Initializes API Gateways list
         */
        function initApiGateways() {
            return ctrl.refreshApiGateways()
                .then(function () {
                    startAutoUpdate();
                })
                .finally(function () {
                    ctrl.isSplashShowed.value = false;

                    $timeout(function () {
                        $rootScope.$broadcast('igzWatchWindowResize::resize');
                    });
                });
        }

        /**
         * Handler on action-panel broadcast
         * @param {Event} event - $broadcast-ed event
         * @param {Object} data - $broadcast-ed data
         */
        function onFireAction(event, data) {
            var checkedApiGateways = lodash.filter(apiGateways, 'ui.checked');

            ctrl.handleApiGatewayAction(data.action, checkedApiGateways);
        }

        /**
         * Starts auto-update refreshing.
         */
        function startAutoUpdate() {
            if (lodash.isNull(updatingInterval)) {
                updatingInterval = $interval(refreshApiGateways.bind(null, true), updatingIntervalTime);
            }
        }

        /**
         * Stops auto-update refreshing
         */
        function stopAutoUpdate() {
            if (!lodash.isNull(updatingInterval)) {
                $interval.cancel(updatingInterval);
                updatingInterval = null;
            }
        }

        /**
         * Updates actions of action panel according to selected nodes
         * @param {Object} [event] - triggering event
         * @param {Object} [data] - passed data
         */
        function updatePanelActions(event, data) {
            var checkedRows = lodash.filter(apiGateways, 'ui.checked');
            var checkedRowsCount = lodash.get(data, 'checkedCount', checkedRows.length);

            if (checkedRowsCount > 0) {

                // sets visibility status of `edit` action
                // visible if only one API Gateway is checked
                var editAction = lodash.find(ctrl.apiGatewayActions, ['id', 'edit']);

                if (!lodash.isNil(editAction)) {
                    editAction.visible = checkedRowsCount === 1;
                }

                // sets confirm message for `delete action` depending on count of checked rows
                var deleteAction = lodash.find(ctrl.apiGatewayActions, ['id', 'delete']);

                if (!lodash.isNil(deleteAction)) {
                    deleteAction.confirm.message = checkedRowsCount === 1 ?
                        $i18next.t('functions:DELETE_API_GATEWAY_CONFIRM', { lng: lng }) :
                        $i18next.t('functions:DELETE_API_GATEWAYS_CONFIRM', { lng: lng });
                }
            }
        }
    }
}());
