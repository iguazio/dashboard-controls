(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclCreateFunction', {
            bindings: {
                createProject: '&',
                getProject: '&',
                getProjects: '&',
                getTemplates: '&',
                renderTemplate: '&',
                templates: '<'
            },
            templateUrl: 'nuclio/common/screens/create-function/create-function.tpl.html',
            controller: CreateFunctionController
        });

    function CreateFunctionController($element, $rootScope, $scope, $state, $stateParams, ngDialog, lodash, DialogsService, NuclioHeaderService) {
        var ctrl = this;
        var selectedFunctionType = 'from_template';

        ctrl.isSplashShowed = {
            value: true
        };
        ctrl.project = {};
        ctrl.projects = [];
        ctrl.scrollConfig = {
            axis: 'y',
            advanced: {
                updateOnContentResize: true
            },
            callbacks: {
                onUpdate: onContainerResize
            }
        };
        ctrl.selectedProject = null;
        ctrl.horizontalScrollConfig = {
            axis: 'x',
            advanced: {
                updateOnContentResize: true
            }
        };

        ctrl.$onInit = onInit;

        ctrl.createNewProject = createNewProject;
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

            // get all projects, only if project wasn't selected before. In other words:
            // whether New Function screen was opened from Projects or Functions screen.
            if (lodash.includes(['projects', 'home-page', ''], $stateParams.navigatedFrom)) {
                ctrl.getProjects()
                    .then(function (response) {
                        ctrl.projects = response;

                        // breadcrumbs config
                        var title = {
                            function: 'Create function'
                        };

                        if (!lodash.isEmpty(ctrl.projects)) {

                            // get first project
                            var project = lodash.find(ctrl.projects);

                            ctrl.selectedProject = {
                                id: project.metadata.name,
                                name: project.spec.displayName
                            };
                        }

                        $rootScope.$broadcast('update-main-header-title', title);
                    })
                    .catch(function (error) {
                        var msg = 'Oops: Unknown error occurred while retrieving projects';

                        DialogsService.alert(lodash.get(error, 'data.error', msg));

                        $state.go($stateParams.navigatedFrom === 'home-page' ? 'app.home' : 'app.projects');
                    })
                    .finally(function () {
                        ctrl.isSplashShowed.value = false;
                    });
            } else {
                ctrl.getProject({id: $stateParams.projectId})
                    .then(function (project) {
                        ctrl.project = project;

                        // breadcrumbs config
                        var title = {
                            project: project,
                            function: 'Create function'
                        };

                        NuclioHeaderService.updateMainHeader('Projects', title, $state.current.name);
                    })
                    .catch(function (error) {
                        var msg = 'Oops: Unknown error occurred while retrieving project';

                        DialogsService.alert(lodash.get(error, 'data.error', msg));

                        $state.go('app.projects');
                    })
                    .finally(function () {
                        ctrl.isSplashShowed.value = false;
                    });
            }
        }

        //
        // Public methods
        //

        /**
         * New project dialog
         */
        function createNewProject() {
            ngDialog.open({
                template: '<ncl-new-project-dialog data-close-dialog="closeThisDialog(project)" ' +
                          'data-create-project-callback="ngDialogData.createProject({project: project})"></ncl-new-project-dialog>',
                plain: true,
                scope: $scope,
                data: {
                    createProject: ctrl.createProject
                },
                className: 'ngdialog-theme-nuclio'
            })
                .closePromise
                .then(function (data) {
                    if (!lodash.isNil(data.value)) {
                        ctrl.isSplashShowed.value = true;

                        ctrl.getProjects()
                            .then(function (response) {
                                ctrl.projects = response;
                                var createdProject = lodash.find(ctrl.projects, ['spec.displayName', data.value.spec.displayName]);

                                ctrl.selectedProject = {
                                    id: createdProject.metadata.name,
                                    name: createdProject.spec.displayName
                                };
                            })
                            .catch(function (error) {
                                var msg = 'Oops: Unknown error occurred while retrieving projects';

                                DialogsService.alert(lodash.get(error, 'data.error', msg));
                            })
                            .finally(function () {
                                ctrl.isSplashShowed.value = false;
                            });

                        $rootScope.$broadcast('close-drop-down');
                    }
                });
        }

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
