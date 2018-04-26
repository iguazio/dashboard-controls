(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclBreadcrumbs', {
            templateUrl: 'nuclio/common/components/breadcrumbs/breadcrumbs.tpl.html',
            controller: NclBreadcrumbsController
        });

    function NclBreadcrumbsController($timeout, $element, $rootScope, $scope, $state, $stateParams, $window, lodash, NavigationTabsService, DialogsService) {
        var ctrl = this;

        ctrl.mainHeaderTitle = {};
        ctrl.dialogParams = {
            message: 'You have unsaved changes. Leaving this page will discard your changes.',
            yesLabel: 'Leave',
            noLabel: 'Don\'t leave'
        };

        ctrl.$onInit = onInit;
        ctrl.$postLink = postLink;

        ctrl.goToProjectsList = goToProjectsList;
        ctrl.goToFunctionsList = goToFunctionsList;

        //
        // Hook methods
        //

        /**
         * Initialization function
         */
        function onInit() {
            setMainHeaderTitle();

            $scope.$on('update-main-header-title', setMainHeaderTitle);
            $scope.$on('$stateChangeSuccess', onStateChangeSuccess);
        }

        /**
         * Post linking method
         */
        function postLink() {
            ctrl.navigationTabsConfig = NavigationTabsService.getNavigationTabsConfig($state.current.name);
        }

        //
        // Public methods
        //

        /**
         * Changes state when the main header title is clicked
         */
        function goToProjectsList() {
            if (lodash.includes(ctrl.mainHeaderTitle.state, 'app.project.function.edit') && $stateParams.isNewFunction) {
                DialogsService.confirm(ctrl.dialogParams.message, ctrl.dialogParams.yesLabel, ctrl.dialogParams.noLabel, ctrl.dialogParams.type)
                    .then(function () {
                        $state.go('app.projects');
                    });
            } else {
                $state.go('app.projects');
            }
        }

        /**
         * Changes state when the Project subtitle is clicked
         */
        function goToFunctionsList() {
            if (lodash.includes(ctrl.mainHeaderTitle.state, 'app.project.function.edit') && $stateParams.isNewFunction) {
                DialogsService.confirm(ctrl.dialogParams.message, ctrl.dialogParams.yesLabel, ctrl.dialogParams.noLabel, ctrl.dialogParams.type)
                    .then(function () {
                        $state.go('app.project.functions');
                    });
            } else {
                $state.go('app.project.functions');
            }
        }

        //
        // Private methods
        //

        /**
         * Dynamically set Main Header Title on broadcast and on initial page load
         * @param {Object} [event]
         * @param {Object} [data]
         */
        function setMainHeaderTitle(event, data) {
            if (!lodash.isNil(data)) {
                data = lodash.omitBy(data, lodash.isNil);

                lodash.assign(ctrl.mainHeaderTitle, data);
            } else {
                ctrl.mainHeaderTitle = { title: $state.current.data.mainHeaderTitle };
            }
        }

        /**
         * Dynamically pre-set Main Header Title on UI router state change, sets position of main wrapper and navigation
         * tabs config
         * Needed for better UX - header title changes correctly even before controller data resolved and broadcast
         * have been sent
         * @param {Object} event
         * @param {Object} toState
         */
        function onStateChangeSuccess(event, toState) {
            ctrl.navigationTabsConfig = NavigationTabsService.getNavigationTabsConfig(toState.name);

            // Check to exclude prototypical inheritance of the `mainHeaderTitle` property from parent router state
            if (toState.data.hasOwnProperty('mainHeaderTitle')) {

                ctrl.mainHeaderTitle = {
                    title: toState.data.mainHeaderTitle
                };
            }
        }
    }
}());
