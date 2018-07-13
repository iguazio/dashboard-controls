(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclCreateFunction', {
            bindings: {
                getProjectCallback: '&',
                getTemplatesCallback: '&',
                templates: '<'
            },
            templateUrl: 'nuclio/projects/project/functions/create-function/create-function.tpl.html',
            controller: CreateFunctionController
        });

    function CreateFunctionController($element, $state, $stateParams, $timeout, lodash, DialogsService, NuclioHeaderService) {
        var ctrl = this;
        var selectedFunctionType = 'from_scratch';

        ctrl.isSplashShowed = {
            value: true
        };
        ctrl.project = {};
        ctrl.scrollConfig = {
            axis: 'y',
            advanced: {
                updateOnContentResize: true
            },
            callbacks: {
                onUpdate: onContainerResize
            }
        };
        ctrl.horizontalScrollConfig = {
            axis: 'x',
            advanced: {
                updateOnContentResize: true
            }
        };

        ctrl.$onInit = onInit;

        ctrl.toggleSplashScreen = toggleSplashScreen;
        ctrl.isTypeSelected = isTypeSelected;
        ctrl.selectFunctionType = selectFunctionType;
        ctrl.getFunctionTemplates = getFunctionTemplates;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.getProjectCallback({id: $stateParams.projectId})
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
                    var msg = 'Oops: Unknown error occurred while retrieving project';

                    if (!lodash.isEmpty(error.errors)) {
                        msg = error.errors[0].detail
                    }

                    DialogsService.alert(msg);

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

        /**
         * Gets list of function templates
         * @returns {Promise}
         */
        function getFunctionTemplates() {
            return ctrl.getTemplatesCallback();
        }

        /**
         * Scrollbar callback.
         * If we create function from template, then resize templates wrapper according to inner content.
         * Needed to place 'Create function' button on right position.
         */
        function onContainerResize() {
            var templatesWrapper = $element.find('.templates-wrapper');

            // width of one template
            var templateWidth = 416;

            if (selectedFunctionType === 'from_template') {
                templatesWrapper.css('width', '100%');

                // count amount of templates in one line
                var elementsPerLine = Math.floor(parseInt(templatesWrapper.css('width')) / templateWidth);

                // find last template in first line
                var template = $element.find('.function-template-wrapper:eq(' + (elementsPerLine - 1) + ')');

                if (template.length !== 0) {

                    // calculate needed width for current amount of templates
                    var neededWidth = template.offset().left - templatesWrapper.offset().left + templateWidth;

                    // set width of templates wrapper corresponding to amount of templates
                    templatesWrapper.css('width', neededWidth + 'px');
                }
            }
        }
    }
}());
