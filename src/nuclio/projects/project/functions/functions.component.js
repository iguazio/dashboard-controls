(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclFunctions', {
            bindings: {
                getExternalIpAddressesCallback: '&',
                getProjectCallback: '&',
                getFunctionsCallback: '&',
                deleteFunctionCallback: '&'
            },
            templateUrl: 'nuclio/projects/project/functions/functions.tpl.html',
            controller: FunctionsController
        });

    function FunctionsController($filter, $q, $rootScope, $scope, $state, $stateParams, $timeout, lodash, CommonTableService,
                                 ConfigService, DialogsService, NuclioClientService, NuclioHeaderService, NuclioProjectsDataService, NuclioFunctionsDataService) {
        var ctrl = this;
        var title = {}; // breadcrumbs config

        ctrl.actions = [];
        ctrl.filtersCounter = 0;
        ctrl.functions = [];
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
        ctrl.project = {};
        ctrl.searchStates = {};
        ctrl.searchKeys = [
            'metadata.name',
            'spec.description'
        ];
        ctrl.sortOptions = [
            {
                label: 'Name',
                value: 'metadata.name',
                active: true
            },
            {
                label: 'Description',
                value: 'spec.description',
                active: false
            },
            {
                label: 'Status',
                value: 'status.state',
                active: false
            },
            {
                label: 'Replicas',
                value: 'spec.replicas',
                active: false
            },
            {
                label: 'Runtime',
                value: 'spec.runtime',
                active: false
            }
        ];
        ctrl.sortedColumnName = 'metadata.name';
        ctrl.externalIPAddress = '';

        ctrl.$onInit = onInit;

        ctrl.isColumnSorted = CommonTableService.isColumnSorted;

        ctrl.deleteFunction = deleteFunction;
        ctrl.getVersions = getVersions;
        ctrl.handleAction = handleAction;
        ctrl.isDemoMode = ConfigService.isDemoMode;
        ctrl.isFunctionsListEmpty = isFunctionsListEmpty;
        ctrl.onApplyFilters = onApplyFilters;
        ctrl.onSortOptionsChange = onSortOptionsChange;
        ctrl.onResetFilters = onResetFilters;
        ctrl.onUpdateFiltersCounter = onUpdateFiltersCounter;
        ctrl.openNewFunctionScreen = openNewFunctionScreen;
        ctrl.refreshFunctions = refreshFunctions;
        ctrl.sortTableByColumn = sortTableByColumn;
        ctrl.toggleFilters = toggleFilters;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            if (angular.isDefined($stateParams.projectId)) {
                ctrl.isSplashShowed.value = true;

                ctrl.getProjectCallback({id: $stateParams.projectId})
                    .then(function (project) {
                        ctrl.project = project;

                        title.project = ctrl.project;
                        title.projectName = ctrl.project.spec.displayName;

                        ctrl.refreshFunctions();

                        NuclioHeaderService.updateMainHeader('Projects', title, $state.current.name);
                    })
                    .catch(function (error) {
                        ctrl.isSplashShowed.value = false;
                        var msg = 'Oops: Unknown error occurred while retrieving project';

                        if (!lodash.isEmpty(error.errors)) {
                            msg = error.errors[0].detail
                        }

                        DialogsService.alert(msg);
                    });

                ctrl.getExternalIpAddressesCallback()
                    .then(function (response) {
                        ctrl.externalIPAddress = response.data.externalIPAddresses.addresses[0];
                    })
                    .catch(function (error) {
                        ctrl.isSplashShowed.value = false;
                        var msg = 'Oops: Unknown error occurred while retrieving external IP address';

                        if (!lodash.isEmpty(error.errors)) {
                            msg = error.errors[0].detail
                        }

                        DialogsService.alert(msg);
                    });
            } else {
                ctrl.refreshFunctions();
            }

            ctrl.actions = NuclioFunctionsDataService.initVersionActions();

            $scope.$on('$stateChangeStart', stateChangeStart);
            $scope.$on('action-panel_fire-action', onFireAction);
            $scope.$on('action-checkbox_item-checked', updatePanelActions);
            $scope.$on('action-checkbox-all_check-all', function () {
                $timeout(updatePanelActions);
            });

            updatePanelActions();
        }

        //
        // Public methods
        //

        /**
         * Calls callback which responsible to delete a single function
         * @param functionData
         * @returns {*}
         */
        function deleteFunction(functionData) {
            return ctrl.deleteFunctionCallback({functionData: functionData});
        }

        /**
         * Gets list of function versions
         * @returns {string[]}
         */
        function getVersions() {
            return lodash.chain(ctrl.functions)
                .map(function (functionItem) {

                    // TODO
                    return functionItem.version === -1 ? [] : functionItem.versions;
                })
                .flatten()
                .value();
        }

        /**
         * Checks if functions list is empty
         * @returns {boolean}
         */
        function isFunctionsListEmpty() {
            return lodash.isEmpty(ctrl.functions);
        }

        /**
         * According to given action name calls proper action handler
         * @param {string} actionType - ex. `delete`
         * @param {Array} checkedItems - an array of checked projects
         * @returns {Promise}
         */
        function handleAction(actionType, checkedItems) {
            var promises = [];

            lodash.forEach(checkedItems, function (checkedItem) {
                var actionHandler = checkedItem.ui[actionType];

                if (lodash.isFunction(actionHandler)) {
                    promises.push(actionHandler());
                }
            });

            return $q.all(promises).then(function () {
                ctrl.refreshFunctions();
            });
        }

        /**
         * Updates functions list depends on filters value
         */
        function onApplyFilters() {
            $rootScope.$broadcast('search-input_refresh-search');
        }

        /**
         * Sorts the table by column name depends on selected value in sort dropdown
         * @param {Object} option
         */
        function onSortOptionsChange(option) {
            var previousElement = lodash.find(ctrl.sortOptions, ['active', true]);
            var newElement = lodash.find(ctrl.sortOptions, ['label', option.label]);

            // change state of selected element, and of previous element
            previousElement.active = false;
            newElement.active = true;

            // if previous value is equal to new value, then change sorting predicate
            if (previousElement.label === newElement.label) {
                newElement.desc = !option.desc;
            }

            ctrl.isReverseSorting = newElement.desc;
            ctrl.sortedColumnName = newElement.value;

            ctrl.sortTableByColumn(ctrl.sortedColumnName);
        }

        /**
         * Handles on reset filters event
         */
        function onResetFilters() {
            $rootScope.$broadcast('search-input_reset');

            ctrl.filtersCounter = 0;
        }

        /**
         * Handles on update filters counter
         * @param {string} searchQuery
         */
        function onUpdateFiltersCounter(searchQuery) {
            ctrl.filtersCounter = lodash.isEmpty(searchQuery) ? 0 : 1;
        }

        /**
         * Navigates to new function screen
         */
        function openNewFunctionScreen() {
            title.function = 'Create function';

            NuclioHeaderService.updateMainHeader('Projects', title, $state.current.name);

            $state.go('app.project.create-function');
        }

        /**
         * Refreshes function list
         */
        function refreshFunctions() {
            ctrl.isSplashShowed.value = true;

            ctrl.getFunctionsCallback({id: ctrl.project.metadata.name, namespace: ctrl.project.metadata.namespace})
                .then(function (result) {
                    ctrl.functions = lodash.toArray(lodash.defaultTo(result.data, result));

                    if (lodash.isEmpty(ctrl.functions) && !$stateParams.createCancelled) {
                        ctrl.isSplashShowed.value = false;

                        $state.go('app.project.create-function');
                    } else {

                        // TODO: unmock versions data
                        lodash.forEach(ctrl.functions, function (functionItem) {
                            lodash.set(functionItem, 'versions', [{
                                name: '$LATEST',
                                invocation: '30',
                                last_modified: '2018-02-05T17:07:48.509Z'
                            }]);
                            lodash.set(functionItem, 'spec.version', 1);
                        });

                        ctrl.isSplashShowed.value = false;
                    }
                })
                .catch(function (error) {
                    ctrl.isSplashShowed.value = false;
                    var msg = 'Oops: Unknown error occurred while retrieving functions';

                    if (!lodash.isEmpty(error.errors)) {
                        msg = error.errors[0].detail
                    }

                    DialogsService.alert(msg);
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
                ctrl.isReverseSorting = (columnName === ctrl.sortedColumnName) ? !ctrl.isReverseSorting : false;
            }

            // saves the name of sorted column
            ctrl.sortedColumnName = columnName;

            ctrl.functions = $filter('orderBy')(ctrl.functions, columnName, ctrl.isReverseSorting);
        }

        /**
         * Opens a splash screen on start change state
         */
        function stateChangeStart() {
            ctrl.isSplashShowed.value = true;
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
         * Handler on action-panel broadcast
         * @param {Event} event - $broadcast-ed event
         * @param {Object} data - $broadcast-ed data
         * @param {string} data.action - a name of action
         */
        function onFireAction(event, data) {
            var checkedRows = lodash.chain(ctrl.functions)
                .map(function (functionItem) {
                    return lodash.filter(functionItem.versions, 'ui.checked');
                })
                .flatten()
                .value();

            ctrl.handleAction(data.action, checkedRows);
        }

        /**
         * Updates actions of action panel according to selected versions
         */
        function updatePanelActions() {
            var checkedRows = lodash.chain(ctrl.functions)
                .map(function (functionItem) {
                    return lodash.filter(functionItem.versions, 'ui.checked');
                })
                .flatten()
                .value();

            if (checkedRows.length > 0) {

                // sets visibility status of `edit action`
                // visible if only one version is checked
                var editAction = lodash.find(ctrl.actions, {'id': 'edit'});
                if (!lodash.isNil(editAction)) {
                    editAction.visible = checkedRows.length === 1;
                }

                // sets confirm message for `delete action` depending on count of checked rows
                var deleteAction = lodash.find(ctrl.actions, {'id': 'delete'});
                if (!lodash.isNil(deleteAction)) {
                    var message = checkedRows.length === 1 ?
                        'Delete version “' + checkedRows[0].name + '”?' : 'Are you sure you want to delete selected version?';

                    deleteAction.confirm = {
                        message: message,
                        yesLabel: 'Yes, Delete',
                        noLabel: 'Cancel',
                        type: 'nuclio_alert'
                    };
                }
            }
        }
    }
}());
