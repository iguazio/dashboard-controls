(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('igzBreadcrumbsDropdown', {
            bindings: {
                state: '<',
                title: '<'
            },
            templateUrl: 'breadcrumbs-dropdown/breadcrumbs-dropdown.tpl.html',
            controller: IgzBreadcrumbsDropdown
        });

    function IgzBreadcrumbsDropdown($document, $element, $rootScope, $scope, $state, lodash, ContainersDataService, ConfigService, ClustersDataService, StoragePoolsDataService, NuclioProjectsDataService) {
        var ctrl = this;

        ctrl.itemsList = [];
        ctrl.showDropdownList = false;
        ctrl.placeholder = 'Search...';

        ctrl.$onInit = onInit;
        ctrl.isStagingMode = ConfigService.isStagingMode;
        ctrl.showDropdown = showDropdown;
        ctrl.showDetails = showDetails;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            if (lodash.startsWith(ctrl.state, 'app.container')) {
                ContainersDataService.containers().then(setItemsList);
            } else if (lodash.startsWith(ctrl.state, 'app.cluster')) {
                ClustersDataService.clusters().then(setItemsList);
            } else if (lodash.startsWith(ctrl.state, 'app.storage-pool')) {
                StoragePoolsDataService.storagePools().then(setItemsList);
            } else if (lodash.startsWith(ctrl.state, 'app.project.functions')) {
                NuclioProjectsDataService.getProjects().then(setNuclioItemsList);
            }

            $document.on('click', unselectDropdown);
        }

        //
        // Public method
        //

        /**
         * Opens/closes dropdown
         */
        function showDropdown() {
            $document.on('click', unselectDropdown);
            ctrl.showDropdownList = !ctrl.showDropdownList;

            if (!ctrl.showDropdownList) {
                ctrl.searchText = '';

                $document.off('click', unselectDropdown);
            }
        }

        /**
         * Handles mouse click on a item's name
         * Navigates to selected page
         * @param {Event} event
         * @param {Object} item
         */
        function showDetails(event, item) {
            var params = {};
            lodash.set(params, !item.isNuclioState ? 'id' : 'projectId', item.id);

            ctrl.showDropdownList = !ctrl.showDropdownList;
            ctrl.searchText = '';

            $rootScope.$broadcast('statistics-data_abort-requests');

            $document.off('click', unselectDropdown);

            $state.go(ctrl.state, params);
        }

        //
        // Private method
        //

        /**
         * Handles promise
         * Sets items list for dropdown
         * @param {Object} data
         */
        function setItemsList(data) {
            ctrl.itemsList = lodash.map(data, function (item) {
                return {
                    id: item.id,
                    name: item.attr.name,
                    isNuclioState: false
                };
            });
        }

        /**
         * Handles promise
         * Sets items list for dropdown in Nuclio breadcrumbs
         * @param {Object} data
         */
        function setNuclioItemsList(data) {
            ctrl.itemsList = lodash.map(data, function (item) {
                return {
                    id: item.metadata.name,
                    name: item.spec.displayName,
                    isNuclioState: true
                };
            });
        }

        /**
         * Handle click on the document and not on the dropdown field and close the dropdown
         * @param {Object} e - event
         */
        function unselectDropdown(e) {
            if ($element.find(e.target).length === 0) {
                $scope.$evalAsync(function () {
                    ctrl.showDropdownList = false;
                    ctrl.searchText = '';

                    $document.off('click', unselectDropdown);
                });
            }
        }
    }
}());
