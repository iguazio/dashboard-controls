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
        .component('nclBreadcrumbsDropdown', {
            bindings: {
                state: '<',
                title: '<',
                project: '<',
                type: '@',
                getFunctions: '&',
                getProjects: '&'
            },
            templateUrl: 'nuclio/common/components/breadcrumbs-dropdown/breadcrumbs-dropdown.tpl.html',
            controller: NclBreadcrumbsDropdown
        });

    function NclBreadcrumbsDropdown($document, $element, $scope, $state, $i18next, i18next, lodash, DialogsService) {
        var ctrl = this;
        var lng = i18next.language;

        ctrl.itemsList = [];
        ctrl.showDropdownList = false;
        ctrl.placeholder = $i18next.t('common:PLACEHOLDER.SEARCH', {lng: lng});

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
                ctrl.getProjects()
                    .then(setNuclioItemsList)
                    .catch(function (error) {
                        var defaultMsg = $i18next.t('functions:ERROR_MSG.GET_PROJECTS', {lng: lng});

                        DialogsService.alert(lodash.get(error, 'data.error', defaultMsg));
                    });
            } else if (ctrl.type === 'functions') {
                ctrl.getFunctions({ id: ctrl.project.metadata.name, enrichApiGateways: false })
                    .then(setNuclioItemsList)
                    .catch(function (error) {
                        var defaultMsg = $i18next.t('functions:ERROR_MSG.GET_FUNCTIONS', {lng: lng});

                        DialogsService.alert(lodash.get(error, 'data.error', defaultMsg));
                    });
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

            if (!ctrl.showDropdownList) {
                $element.find('.breadcrumb-arrow').css('background-color', '#c9c9cd');
            }

            ctrl.showDropdownList = !ctrl.showDropdownList;

            if (!ctrl.showDropdownList) {
                ctrl.searchText = '';

                $element.find('.breadcrumb-arrow').css('background-color', '');

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

            $element.find('.breadcrumb-arrow').css('background-color', '');

            if (ctrl.type === 'projects') {
                params.projectId = item.id;
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
         * Sets projects list for dropdown in Nuclio breadcrumbs
         * @param {Object} data
         */
        function setProjectsItemList(data) {
            ctrl.itemsList = lodash.map(data, function (item) {
                return {
                    id: item.metadata.name,
                    name: item.metadata.name,
                    isNuclioState: true
                };
            });
        }

        /**
         * Handles promise
         * Sets functions list for dropdown in Nuclio breadcrumbs
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
         * Checks what item list need to set for dropdown in Nuclio breadcrumbs
         * @param {Object} data
         */
        function setNuclioItemsList(data) {
            if (ctrl.type === 'projects') {
                setProjectsItemList(data);
            } else if (ctrl.type === 'functions') {
                setFunctionsItemList(lodash.defaultTo(data.data, data));
            }
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

                    $element.find('.breadcrumb-arrow').css('background-color', '');
                });
            }
        }
    }
}());
