(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclCreateFunction', {
            templateUrl: 'nuclio/projects/project/functions/create-function/create-function.tpl.html',
            controller: CreateFunctionController
        });

    function CreateFunctionController($state, $stateParams, lodash, DialogsService, NuclioHeaderService, NuclioProjectsDataService) {
        var ctrl = this;
        var selectedFunctionType = 'from_scratch';

        ctrl.isSplashShowed = {
            value: true
        };
        ctrl.project = {};
        ctrl.scrollConfig = {
            axis: 'yx',
            advanced: {
                updateOnContentResize: true
            }
        };

        ctrl.$onInit = onInit;

        ctrl.toggleSplashScreen = toggleSplashScreen;
        ctrl.isTypeSelected = isTypeSelected;
        ctrl.selectFunctionType = selectFunctionType;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            NuclioProjectsDataService.getProject($stateParams.projectId)
                .then(function (project) {
                    ctrl.project = project;

                    // breadcrumbs config
                    var title = {
                        project: project,
                        projectName: project.spec.displayName,
                        function: 'Create function'
                    };

                    NuclioHeaderService.updateMainHeader('Projects', title, $state.current.name);
                })
                .catch(function (error) {
                    DialogsService.alert('Oops: Unknown error occurred while retrieving project');

                    $state.go('app.projects');
                })
                .finally(function () {
                    ctrl.isSplashShowed.value = false;
                });
        }

        //
        // Public methods
        //

        /**
         * Toggles splash screen.
         * If value is undefined then sets opposite itself's value, otherwise sets provided value.
         * @param {boolean} value - value to be set
         */
        function toggleSplashScreen(value) {
            ctrl.isSplashShowed.value = lodash.defaultTo(value, !ctrl.isSplashShowed.value);
        }

        /**
         * Checks which function type is visible.
         * Returns true if 'functionType' is equal to 'selectedFunctionType'. Which means that function with type from
         * argument 'functionType' should be visible.
         * @param {string} functionType
         * @returns {boolean}
         */
        function isTypeSelected(functionType) {
            return lodash.isEqual(selectedFunctionType, functionType);
        }

        /**
         * Sets selected function type
         * @param {string} functionType
         */
        function selectFunctionType(functionType) {
            if (!lodash.isEqual(functionType, selectedFunctionType)) {
                selectedFunctionType = functionType;
            }
        }
    }
}());
