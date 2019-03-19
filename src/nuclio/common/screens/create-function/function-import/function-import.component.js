(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclFunctionImport', {
            bindings: {
                project: '<',
                projects: '<',
                toggleSplashScreen: '&',
                createNewProject: '<',
                selectedProject: '<'
            },
            templateUrl: 'nuclio/common/screens/create-function/function-import/function-import.tpl.html',
            controller: FunctionImportController
        });

    function FunctionImportController($document, $rootScope, $scope, $state, $timeout, YAML, lodash,
                                      EventHelperService) {
        var ctrl = this;

        var importedFunction = null;
        var file = null;

        ctrl.functionImportForm = {};
        ctrl.sourceCode = null;
        ctrl.editorTheme = {
            id: 'vs',
            name: 'Light',
            visible: true
        };

        ctrl.$onInit = onInit;
        ctrl.$onChanges = onChanges;
        ctrl.$onDestroy = onDestroy;

        ctrl.cancelCreating = cancelCreating;
        ctrl.createFunction = createFunction;
        ctrl.importFunction = importFunction;
        ctrl.isCreateFunctionAllowed = isCreateFunctionAllowed;
        ctrl.isProjectsDropDownVisible = isProjectsDropDownVisible;
        ctrl.onProjectChange = onProjectChange;

        //
        // Hook methods
        //

        /**
         * Initialization function
         * Adds event listener on file input and when some file is loaded call importFunction()
         */
        function onInit() {
            $document.on('keypress', createFunction);
            angular.element(document).find('.function-import-input').on('change', importFunction);
        }

        /**
         * Bindings changes hook
         * @param {Object} changes - changed bindings
         */
        function onChanges(changes) {
            if (angular.isDefined(changes.projects)) {
                prepareProjects();
            }
        }

        /**
         * Destructor method
         */
        function onDestroy() {
            $document.off('keypress', createFunction);
        }

        //
        // Public methods
        //

        /**
         * Cancels creating a function
         */
        function cancelCreating(event) {
            event.preventDefault();

            if (!lodash.isEmpty(ctrl.project)) {
                $state.go('app.project.functions', {
                    projectId: ctrl.project.metadata.name,
                    createCancelled: true
                });
            } else {
                $state.go('app.projects');
            }
        }

        /**
         * Callback handler for 'create function' button
         * Creates function with imported data.
         */
        function createFunction(event) {
            $timeout(function () {
                if ((angular.isUndefined(event) || event.keyCode === EventHelperService.ENTER) &&
                    ctrl.isCreateFunctionAllowed()) {

                    // create function only when imported file is .yml
                    if (isYamlFile(file.name)) {
                        ctrl.toggleSplashScreen({ value: true });

                        lodash.defaults(importedFunction, {
                            metadata: {}
                        });

                        if (lodash.isEmpty(ctrl.project) && ctrl.selectedProject.id !== 'new_project') {
                            ctrl.project = lodash.find(ctrl.projects, ['metadata.name', ctrl.selectedProject.id]);
                        }

                        if (lodash.has(importedFunction, 'spec.build.commands')) {
                            lodash.forEach(importedFunction.spec.build.commands, function (command, index) {
                                importedFunction.spec.build.commands[index] = command.replace(/'/g, '\'\'');
                            })
                        }

                        $state.go('app.project.function.edit.code', {
                            isNewFunction: true,
                            id: ctrl.project.metadata.name,
                            functionId: importedFunction.metadata.name,
                            projectNamespace: ctrl.project.metadata.namespace,
                            functionData: importedFunction
                        });
                    }
                }
            }, 100);
        }

        /**
         * Checks permissibility creation of new function.
         * Checks if source code of function exists into ctrl.sourceCode, and if function import form is valid
         * @returns {boolean}
         */
        function isCreateFunctionAllowed() {
            return !lodash.isNil(ctrl.sourceCode) && lodash.isEmpty(ctrl.functionImportForm.$error);
        }

        /**
         * Import of selected YAML file from file system and parse it to JS object
         * @param event
         */
        function importFunction(event) {
            file = event.target.files[0];

            var reader = new FileReader();

            reader.onload = function () {
                ctrl.sourceCode = reader.result;
                $scope.$apply();
                $rootScope.$broadcast('function-import-source-code', ctrl.sourceCode);

                importedFunction = YAML.parse(reader.result);
            };

            reader.readAsText(file);
        }

        /**
         * Projects drop-down callback.
         * Sets selected project to function.
         * @param {Object} item - new selected project
         */
        function onProjectChange(item) {
            ctrl.project = lodash.find(ctrl.projects, ['metadata.name', item.id]);
        }

        /**
         * Hides or shows projects drop-down.
         * Show drop-down if 'Create Function' screen was reached from 'Projects' screen. Otherwise - hide drop-down
         * @returns {boolean}
         */
        function isProjectsDropDownVisible() {
            return $state.current.name === 'app.create-function';
        }

        //
        // Private methods
        //

        /**
         * Checks if file imported from file system is YAML extension.
         * Example: 'filename.yml'
         * @returns {boolean}
         */
        function isYamlFile(filename) {
            return lodash.includes(filename, '.yml') || lodash.includes(filename, '.yaml');
        }

        /**
         * Converts projects for project drop-down.
         */
        function prepareProjects() {
            var newProject = {
                id: 'new_project',
                name: 'New project'
            };

            ctrl.selectedProject = lodash.isNil(ctrl.selectedProject) ? newProject : ctrl.selectedProject;

            ctrl.projectsList = lodash.chain(ctrl.projects)
                .map(function (project) {
                    return {
                        id: project.metadata.name,
                        name: project.spec.displayName
                    };
                })
                .sortBy(['name'])
                .value();

            ctrl.selectedProject = lodash.isEmpty(ctrl.projectsList)         ? newProject                     :
                                   ctrl.selectedProject.id !== 'new_project' ? ctrl.selectedProject           :
                                   /* else */                                  lodash.first(ctrl.projectsList);
        }
    }
}());
