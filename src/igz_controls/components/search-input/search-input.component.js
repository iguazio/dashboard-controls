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
        .component('igzSearchInput', {
            bindings: {
                dataSet: '<',
                initSearchQuery: '@?',
                isSearchHierarchically: '@?',
                liveSearch: '<?',
                multiSearchName: '@?',
                onSearchSubmit: '&?',
                placeholder: '@',
                ruleType: '@?',
                searchCallback: '&?',
                searchKeys: '<',
                searchStates: '<',
                searchType: '@?',
                type: '@?'
            },
            templateUrl: 'igz_controls/components/search-input/search-input.tpl.html',
            controller: IgzSearchInputController
        });

    function IgzSearchInputController($scope, $timeout, lodash, SearchHelperService) {
        var ctrl = this;

        ctrl.isInputFocused = false;
        ctrl.isSearchHierarchically = (String(ctrl.isSearchHierarchically) === 'true');
        ctrl.searchQuery = '';

        ctrl.$onInit = onInit;
        ctrl.onPressEnter = onPressEnter;
        ctrl.clearInputField = clearInputField;
        ctrl.toggleInputFocus = toggleInputFocus;

        //
        // Hook method
        //

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.searchStates.searchNotFound = false;
            ctrl.searchStates.searchInProgress = false;

            if (!lodash.isUndefined(ctrl.initSearchQuery)) {
                ctrl.searchQuery = ctrl.initSearchQuery;
            }

            if (angular.isUndefined(ctrl.searchType)) {
                ctrl.searchType = 'infoPage';
            }

            if (angular.isUndefined(ctrl.liveSearch) || ctrl.liveSearch) {
                $scope.$watch('$ctrl.searchQuery', onChangeSearchQuery);
            }

            $scope.$on('search-input_refresh-search', onDataChanged);
            $scope.$on('search-input_reset', resetSearch);
        }

        //
        // Public methods
        //

        /**
         * Initializes search and apply filters on press enter
         * @param {Event} e
         */
        function onPressEnter(e) {
            if (e.keyCode === 13) {
                makeSearch();

                if (angular.isFunction(ctrl.onSearchSubmit) && ctrl.isInputFocused) {
                    ctrl.onSearchSubmit();
                }
            }
        }

        /**
         * Clear search input field
         */
        function clearInputField() {
            ctrl.searchQuery = '';
        }

        /**
         * Toggles input focus
         */
        function toggleInputFocus() {
            ctrl.isInputFocused = !ctrl.isInputFocused;
        }

        //
        // Private methods
        //

        /**
         * Calls service method for search
         */
        function makeSearch() {
            if (angular.isFunction(ctrl.searchCallback)) {

                // call custom search method
                ctrl.searchCallback(lodash.pick(ctrl, [
                    'searchQuery',
                    'dataSet',
                    'searchKeys',
                    'isSearchHierarchically',
                    'ruleType',
                    'searchStates',
                    'multiSearchName'
                ]));
            }

            if (angular.isUndefined(ctrl.type)) {

                // default search functionality
                SearchHelperService.makeSearch(ctrl.searchQuery, ctrl.dataSet, ctrl.searchKeys,
                                               ctrl.isSearchHierarchically,ctrl.ruleType, ctrl.searchStates,
                                               ctrl.multiSearchName);
            }
        }

        /**
         * Tracks input changing and initializes search
         */
        function onChangeSearchQuery(newValue, oldValue) {
            if (angular.isDefined(newValue) && newValue !== oldValue) {
                makeSearch();
            }
        }

        /**
         * Initializes search when all html has been rendered
         */
        function onDataChanged() {
            $timeout(makeSearch);
        }

        /**
         * Resets search query and initializes search
         */
        function resetSearch() {
            ctrl.searchQuery = '';
            $timeout(makeSearch);
        }
    }
}());
