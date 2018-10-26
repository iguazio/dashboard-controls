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
            templateUrl: 'nuclio/projects/project/functions/version/version-code/function-event-pane/test-events-navigation-tabs/test-events-navigation-tabs.tpl.html',
            controller: NclTestEventsNavigationTabsController
        });

    function NclTestEventsNavigationTabsController(lodash) {
        var ctrl = this;

        ctrl.logLevelValues = [
            {
                id: 'error',
                name: 'Error',
                visible: true
            },
            {
                id: 'warn',
                name: 'Warning',
                visible: true
            },
            {
                id: 'info',
                name: 'Info',
                visible: true
            },
            {
                id: 'debug',
                name: 'Debug',
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
