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
        .component('igzInfoPageActionsBar', {
            bindings: {
                watchId: '@?'
            },
            templateUrl: 'igz_controls/components/info-page/info-page-actions-bar/info-page-actions-bar.tpl.html',
            transclude: true,
            controller: IgzInfoPageActionsBarController
        });

    function IgzInfoPageActionsBarController($scope) {
        var ctrl = this;

        ctrl.isUpperPaneShowed = false;
        ctrl.isFiltersShowed = false;
        ctrl.isInfoPaneShowed = false;

        ctrl.$onInit = onInit;

        //
        // Hook methods
        //

        /**
         * Init method
         */
        function onInit() {
            var watchId = angular.isDefined(ctrl.watchId) ? '-' + ctrl.watchId : '';

            $scope.$on('info-page-upper-pane_toggle-start' + watchId, onUpperPaneToggleStart);
            $scope.$on('info-page-filters_toggle-start' + watchId, onFiltersPaneToggleStart);
            $scope.$on('info-page-pane_toggle-start' + watchId, onInfoPaneToggleStart);
        }

        //
        // Private methods
        //

        /**
         * Upper pane toggle start $broadcast listener
         * @param {Object} e - broadcast event
         * @param {boolean} isShown - represents upper pane state
         */
        function onUpperPaneToggleStart(e, isShown) {
            ctrl.isUpperPaneShowed = isShown;
        }

        /**
         * Filters pane toggle start $broadcast listener
         * @param {Object} e - broadcast event
         * @param {boolean} isShown - represents filters pane state
         */
        function onFiltersPaneToggleStart(e, isShown) {
            ctrl.isFiltersShowed = isShown;
        }

        /**
         * Info pane toggle start $broadcast listener
         * @param {Object} e - broadcast event
         * @param {boolean} isShown - represents info pane state
         */
        function onInfoPaneToggleStart(e, isShown) {
            ctrl.isInfoPaneShowed = isShown;
        }

    }
}());
