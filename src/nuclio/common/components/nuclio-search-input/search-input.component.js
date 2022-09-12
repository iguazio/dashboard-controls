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
        .component('nclSearchInput', {
            bindings: {
                dataSet: '<',
                searchKeys: '<',
                searchStates: '<',
                searchCallback: '&?',
                isSearchHierarchically: '@?',
                placeholder: '@',
                type: '@?',
                ruleType: '@?',
                searchType: '@?'
            },
            templateUrl: 'nuclio/common/components/nuclio-search-input/search-input.tpl.html',
            controller: SearchInputController
        });

    function SearchInputController($scope, $timeout) {
        var ctrl = this;

        ctrl.searchQuery = '';

        ctrl.$onInit = onInit;
        ctrl.onPressEnter = onPressEnter;
        ctrl.clearInputField = clearInputField;

        //
        // Hook method
        //

        /**
         * Initialization method
         */
        function onInit() {
            $scope.$watch('$ctrl.searchQuery', onChangeSearchQuery);
        }

        //
        // Public methods
        //

        /**
         * Initializes search on press enter
         * @param {Event} e
         */
        function onPressEnter(e) {
            if (e.keyCode === 13) {
                makeSearch();
            }
        }

        /**
         * Clear search input field
         */
        function clearInputField() {
            ctrl.searchQuery = '';
        }

        //
        // Private methods
        //

        /**
         * Calls service method for search
         */
        function makeSearch() {
            // TODO
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
