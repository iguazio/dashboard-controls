(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclFunctionImport', {
            bindings: {
                project: '<',
                projects: '<',
                getFunction: '&',
                toggleSplashScreen: '&',
                createNewProject: '<',
                selectedProject: '<'
            },
            templateUrl: 'nuclio/common/screens/create-function/function-import/function-import.tpl.html',
            controller: FunctionImportController
        });

    function FunctionImportController($document, $rootScope, $scope, $state, $timeout, $i18next, i18next, YAML, lodash,
                                      DialogsService, EventHelperService, FunctionsService) {
        var ctrl = this;

        var importedFunction = null;
        var file = null;
        var lng = i18next.language;

        ctrl.functionImportForm = {};
        ctrl.sourceCode = null;

        ctrl.$onInit = onInit;
        ctrl.$onChanges = onChanges;
        ctrl.$onDestroy = onDestroy;

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
            $document.find('.function-import-input').on('change', importFunction);
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

                        ctrl.getFunction({metadata: {name: importedFunction.metadata.name}})
                            .then(function (existingFunction) {
                                ctrl.toggleSplashScreen({value: false});
                                FunctionsService.openFunctionConflictDialog(ctrl.project,
                                                                            importedFunction,
                                                                            existingFunction,
                                                                            true);
                            })
                            .catch(function (error) {
                                if (error.status === 404) {
                                    ctrl.toggleSplashScreen({value: true});

                                    lodash.defaults(importedFunction, {
                                        metadata: {}
                                    });

                                    if (lodash.isEmpty(ctrl.project) && ctrl.selectedProject.id !== 'new_project') {
                                        ctrl.project = lodash.find(ctrl.projects, ['metadata.name', ctrl.selectedProject.id]);
                                    }

                                    $state.go('app.project.function.edit.code', {
                                        isNewFunction: true,
                                        id: ctrl.project.metadata.name,
                                        projectId: ctrl.project.metadata.name,
                                        projectNamespace: ctrl.project.metadata.namespace,
                                        functionId: importedFunction.metadata.name,
                                        functionData: importedFunction
                                    });
                                }
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
                try {
                    importedFunction = YAML.parse(reader.result);

                    if (lodash.has(importedFunction, 'metadata.name')) {
                        ctrl.sourceCode = reader.result;

                        $scope.$apply();
                        $rootScope.$broadcast('function-import-source-code', ctrl.sourceCode);
                    } else {
                        throw new Error('invalid yaml')
                    }
                } catch (error) {
                    DialogsService.alert($i18next.t('common:ERROR_MSG.IMPORT_YAML_FILE', {lng: lng}));
                }
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
                name: $i18next.t('functions:NEW_PROJECT', {lng: lng})
            };

            ctrl.selectedProject = lodash.isNil(ctrl.selectedProject) ? newProject : ctrl.selectedProject;

            ctrl.projectsList = lodash.chain(ctrl.projects)
                .map(function (project) {
                    return {
                        id: project.metadata.name,
                        name: lodash.defaultTo(project.spec.displayName, project.metadata.name)
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
