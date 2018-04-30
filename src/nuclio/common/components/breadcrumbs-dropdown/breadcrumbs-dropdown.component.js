(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclBreadcrumbsDropdown', {
            bindings: {
                state: '<',
                title: '<',
                project: '<',
                type: '@'
            },
            templateUrl: 'nuclio/common/components/breadcrumbs-dropdown/breadcrumbs-dropdown.tpl.html',
            controller: NclBreadcrumbsDropdown
        });

    function NclBreadcrumbsDropdown($document, $element, $rootScope, $scope, $state, lodash, NuclioFunctionsDataService, NuclioProjectsDataService) {
        var ctrl = this;

        ctrl.itemsList = [];
        ctrl.showDropdownList = false;
        ctrl.placeholder = 'Search...';

        ctrl.$onInit = onInit;
        ctrl.showDropdown = showDropdown;
        ctrl.showDetails = showDetails;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            if (ctrl.type === 'projects') {
                NuclioProjectsDataService.getProjects().then(setNuclioItemsList);
            } else if (ctrl.type === 'functions') {
                NuclioFunctionsDataService.getFunctions(ctrl.project.metadata.namespace, ctrl.project.metadata.name).then(setNuclioItemsList)
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

            ctrl.showDropdownList = !ctrl.showDropdownList;
            ctrl.searchText = '';

            $document.off('click', unselectDropdown);

            if (ctrl.type === 'projects') {
                lodash.set(params, 'projectId', item.id);

                $state.go('app.project.functions', params);
            } else if (ctrl.type === 'functions') {
                params = {
                    isNewFunction: false,
                    id: ctrl.project.metadata.name,
                    functionId: item.id,
                    projectNamespace: ctrl.project.metadata.namespace
                };

                $state.go('app.project.function.edit.code', params);
            }
        }

        //
        // Private method
        //

        /**
         * Handles promise
         * Sets items list for dropdown in Nuclio breadcrumbs
         * @param {Object} data
         */
        function setNuclioItemsList(data) {
            if (ctrl.type === 'projects') {
                setProjectsItemList(data)
            } else if (ctrl.type === 'functions') {
                setFunctionsItemList(data.data)
            }
        }

        /**
         * Sets items projects list for dropdown in Nuclio breadcrumbs
         * @param {Object} data
         */
        function setProjectsItemList(data) {
            ctrl.itemsList = lodash.map(data, function (item) {
                return {
                    id: item.metadata.name,
                    name: item.spec.displayName,
                    isNuclioState: true
                };
            });
        }

        /**
         * Sets items functions list for dropdown in Nuclio breadcrumbs
         * @param {Object} data
         */
        function setFunctionsItemList(data) {
            ctrl.itemsList = lodash.map(data, function (item) {
                return {
                    id: item.metadata.name,
                    name: item.metadata.name,
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
