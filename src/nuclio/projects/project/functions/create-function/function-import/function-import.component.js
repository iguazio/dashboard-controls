(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclFunctionImport', {
            bindings: {
                project: '<',
                toggleSplashScreen: '&'
            },
            templateUrl: 'nuclio/projects/project/functions/create-function/function-import/function-import.tpl.html',
            controller: FunctionImportController
        });

    function FunctionImportController($rootScope, $state, lodash, YAML) {
        var ctrl = this;

        var importedFunction = null;
        var file = null;

        ctrl.sourceCode = null;
        ctrl.editorTheme = {
            id: 'vs',
            name: 'Light',
            visible: true
        };

        ctrl.$onInit = onInit;

        ctrl.cancelCreating = cancelCreating;
        ctrl.createFunction = createFunction;
        ctrl.importFunction = importFunction;
        ctrl.isSourceCodeExists = isSourceCodeExists;

        //
        // Hook methods
        //

        /**
         * Initialization function
         * Adds event listener on file input and when some file is loaded call importFunction()
         */
        function onInit() {
            angular.element(document).find('.function-import-input').on('change', importFunction);
        }

        //
        // Public methods
        //

        /**
         * Cancels creating a function
         */
        function cancelCreating(event) {
            event.preventDefault();

            $state.go('app.project.functions', {
                projectId: ctrl.project.metadata.name,
                createCancelled: true
            });
        }

        /**
         * Callback handler for 'create function' button
         * Creates function with imported data.
         */
        function createFunction() {

            // create function only when imported file is .yml
            if (isYamlFile(file.name)) {
                ctrl.toggleSplashScreen({value: true});

                lodash.set(importedFunction, 'metadata.namespace', ctrl.project.metadata.namespace);

                $state.go('app.project.function.edit.code', {
                    isNewFunction: true,
                    id: ctrl.project.metadata.name,
                    functionId: importedFunction.metadata.name,
                    projectNamespace: ctrl.project.metadata.namespace,
                    functionData: importedFunction
                });
            }
        }

        /**
         * Import of selected YAML file from file system and parse it to JS object
         * @param event
         */
        function importFunction(event) {
            file = event.target.files[0];

            var reader = new FileReader();

            reader.onload = function () {
                ctrl.sourceCode = {
                    language: 'yaml',
                    code: reader.result
                };

                $rootScope.$broadcast('monaco_on-change-content', ctrl.sourceCode);

                importedFunction = YAML.parse(reader.result);
            };

            reader.readAsText(file);
        }

        /**
         * Checks if source code of function exists into ctrl.sourceCode
         * @return {boolean}
         */
        function isSourceCodeExists() {
            return !lodash.isNil(ctrl.sourceCode);
        }

        //
        // Private methods
        //

        /**
         * Checks if file imported from file system is YAML extension.
         * Example: 'filename.yml'
         * @return {boolean}
         */
        function isYamlFile(filename) {
            return lodash.includes(filename, '.yml') || lodash.includes(filename, '.yaml');
        }
    }
}());
