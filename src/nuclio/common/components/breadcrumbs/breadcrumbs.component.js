(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclBreadcrumbs', {
            bindings: {
                getProjects: '&',
                getFunctions: '&'
            },
            templateUrl: 'nuclio/common/components/breadcrumbs/breadcrumbs.tpl.html',
            controller: NclBreadcrumbsController
        });

    function NclBreadcrumbsController($scope, $state, $stateParams, $transitions, lodash) {
        var ctrl = this;
        var siteOrigin = '';

        ctrl.mainHeaderTitle = {};

        ctrl.$onInit = onInit;

        ctrl.goToProjectsList = goToProjectsList;
        ctrl.goToProjectScreen = goToProjectScreen;
        ctrl.goToFunctionScreen = goToFunctionScreen;

        //
        // Hook methods
        //

        /**
         * Initialization function
         */
        function onInit() {
            var origin = sessionStorage.getItem('origin')

            if (origin) {
                siteOrigin = origin
            }

            setMainHeaderTitle();

            $scope.$on('update-main-header-title', setMainHeaderTitle);

            $transitions.onSuccess({}, onStateChangeSuccess);
        }

        //
        // Public methods
        //

        /**
         * Redirects to the projects screen
         */
        function goToProjectsList() {
            if (siteOrigin) {
                window.location.href = siteOrigin + '/mlrun/projects'
            } else {
                $state.go('app.projects');
            }
        }

        /**
         * Redirects to the project screen
         */
        function goToProjectScreen() {
            $state.go('app.project', {
                projectId: $stateParams.projectId
            });
        }

        /**
         * Redirects to the function screen
         */
        function goToFunctionScreen() {
            $state.go('app.project.function.edit.code');
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
         * @param {Object} transition
         */
        function onStateChangeSuccess(transition) {
            var toState = transition.$to();

            // Check to exclude prototypical inheritance of the `mainHeaderTitle` property from parent router state
            if (lodash.has(toState.data, 'mainHeaderTitle')) {

                ctrl.mainHeaderTitle = {
                    title: toState.data.mainHeaderTitle
                };
            }
        }
    }
}());
