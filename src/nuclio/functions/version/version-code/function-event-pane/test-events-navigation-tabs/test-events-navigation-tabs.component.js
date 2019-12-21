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
