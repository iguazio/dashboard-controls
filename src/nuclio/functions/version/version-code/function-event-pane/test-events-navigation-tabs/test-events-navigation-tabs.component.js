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
        .component('nclTestEventsNavigationTabs', {
            bindings: {
                activeTab: '<',
                tabItems: '<',
                selectedLogLevel: '<?',
                onChangeActiveTab: '&',
                onChangeLogLevel: '&?'
            },
            templateUrl: 'nuclio/functions/version/version-code/function-event-pane/test-events-navigation-tabs/test-events-navigation-tabs.tpl.html',
            controller: NclTestEventsNavigationTabsController
        });

    function NclTestEventsNavigationTabsController($i18next, i18next) {
        var ctrl = this;
        var lng = i18next.language;

        ctrl.logLevelValues = [
            {
                id: 'error',
                name: $i18next.t('common:ERROR', {lng: lng}),
                visible: true
            },
            {
                id: 'warn',
                name: $i18next.t('common:WARNING', {lng: lng}),
                visible: true
            },
            {
                id: 'info',
                name: $i18next.t('common:INFO', {lng: lng}),
                visible: true
            },
            {
                id: 'debug',
                name: $i18next.t('common:DEBUG', {lng: lng}),
                visible: true
            }
        ];

        ctrl.changeActiveTab = changeActiveTab;
        ctrl.isActiveTab = isActiveTab;

        //
        // Public methods
        //

        /**
         * Changes active nav tab
         * @param {Object} item - current status
         */
        function changeActiveTab(item) {
            ctrl.activeTab = item;

            ctrl.onChangeActiveTab({activeTab: item});
        }

        /**
         * Checks if it is an active tab
         * @param {Object} item - current tab
         */
        function isActiveTab(item) {
            return ctrl.activeTab.id === item.id;
        }
    }
}());
