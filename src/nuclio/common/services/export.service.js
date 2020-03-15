(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .factory('ExportService', ExportService);

    function ExportService($i18next, $q, $timeout, $window, i18next, lodash, YAML, DialogsService) {
        return {
            exportFunction: exportFunction,
            getFunctionConfig: getFunctionConfig,
            exportProject: exportProject,
            exportProjects: exportProjects
        };

        //
        // Public methods
        //

        /**
         * Exports the function
         * @param {Object} version
         */
        function exportFunction(version) {
            var functionToExport = prepareFunctionData(version);
            var blob = prepareBlobObject(functionToExport);

            downloadExportedFunction(blob, version.metadata.name);
        }

        /**
         * Returns function config
         * @param {Object} version
         * @returns {string} YAML object
         */
        function getFunctionConfig(version) {
            var functionConfig = prepareFunctionData(version);

            return prepareYamlObject(functionConfig);
        }

        /**
         * Exports the project
         * @param {Object} project
         * @param {Function} getFunctions
         */
        function exportProject(project, getFunctions) {
            getFunctions(project.metadata.name)
                .then(function (functions) {
                    var functionsList = lodash.map(functions, function (functionItem) {
                        return lodash.chain(functionItem)
                            .set('spec.version', 1)
                            .omit(['status', 'metadata.namespace'])
                            .value();
                    });

                    var projectToExport = {
                        project: {
                            metadata: {
                                name: lodash.defaultTo(project.spec.displayName, project.metadata.name)
                            },
                            spec: {
                                functions: functionsList
                            }
                        }
                    };

                    var blob = prepareBlobObject(projectToExport);

                    downloadExportedFunction(blob, lodash.defaultTo(project.spec.displayName, project.metadata.name));
                })
                .catch(function (error) {
                    var defaultMsg = $i18next.t('functions:ERROR_MSG.EXPORT_PROJECT', {lng: i18next.language});

                    DialogsService.alert(lodash.get(error, 'data.error', defaultMsg));
                });

        }

        /**
         * Exports projects
         * @param {Object} projects
         * @param {Function} getFunctions
         */
        function exportProjects(projects, getFunctions) {
            var promises = lodash.map(projects, function (project) {
                return getFunctions(project.metadata.name)
                    .then(function (functions) {
                        return lodash.map(functions, function (functionItem) {
                            return lodash.chain(functionItem)
                                .set('spec.version', 1)
                                .omit(['status', 'metadata.namespace'])
                                .value();
                        });
                    })
                    .catch(angular.noop)
                    .then(function (functionsList) {
                        return {
                            metadata: {
                                name: lodash.defaultTo(project.spec.displayName, project.metadata.name)
                            },
                            spec: {
                                functions: lodash.defaultTo(functionsList, [])
                            }
                        };
                    })
            });

            $q.all(promises)
                .then(function (projectsToExport) {
                    var blob = prepareBlobObject({
                        projects: lodash.compact(projectsToExport)
                    });

                    downloadExportedFunction(blob, 'projects');
                })
                .catch(function (error) {
                    var defaultMsg = $i18next.t('functions:ERROR_MSG.EXPORT_PROJECTS', {lng: i18next.language});

                    DialogsService.alert(lodash.get(error, 'data.error', defaultMsg));
                });
        }

        //
        // Private methods
        //

        /**
         * Creates artificial link and starts downloading of exported function.
         * Downloaded .yaml file will be saved in user's default folder for downloads.
         * @param {Blob} data - exported function config parsed to YAML
         * @param {string} fileName - name of the file
         */
        function downloadExportedFunction(data, fileName) {
            var url = $window.URL.createObjectURL(data);
            var link = document.createElement('a');

            link.href = url;
            link.download = fileName + '.yaml';
            document.body.appendChild(link);

            $timeout(function () {
                link.click();
                document.body.removeChild(link);
                $window.URL.revokeObjectURL(url);
            });
        }

        /**
         * Returns valid YAML string.
         * First RegExp deletes all excess lines in YAML string created by issue in yaml.js package.
         * It is necessary to generate valid YAML.
         * Example:
         * -
         *   name: name
         *   value: value
         * -
         *   name: name
         *   value: value
         * Will transform in:
         * - name: name
         *   value: value
         * - name: name
         *   value: value
         * Second and Third RegExp replaces all double quotes with single quotes outside the value.
         * Example:
         * 'key': "" -> 'key': ''
         * 'key': "some "string" value" -> 'key': 'some "string" value'
         * Fourth RegExp transform all double quotes to escaped double quotes inside the value.
         * Example:
         * 'key': 'some "string" value' -> 'key': 'some \"string\" value'
         * Fifth, Sixth and Seventh replaces all single quotes with double quotes outside the value.
         * Example:
         * 'key': 'value' -> "key": "value"
         * Eighth RegExp replaces all pairs of single quotes with one single quote.
         * It needs because property name or property value is a string which contains single quote
         * will parsed by yaml.js package in string with pair of single quotes.
         * Example:
         * "ke'y": "val'ue"
         * After will parse will be -> "ke''y": "val''ue"
         * This RegExp will transform it to normal view -> "ke'y": "val'ue"
         * @param {string} data - incoming YAML-string
         * @returns {string}
         */
        function getValidYaml(data) {
            function replacer(match, captureGroup1, captureGroup2) {
                return captureGroup1 + captureGroup2.replace(/"/g, '\\"')
            }

            return data.replace(/(\s+-)\s*\n\s+/g, '$1 ')
                .replace(/(:\s)"(.+)"/g, '$1\'$2\'')
                .replace(/(:\s)"{2}/g, '$1\'\'')
                .replace(/([^\\"])("+)/g, replacer)
                .replace(/'(.+)'(:)/g, '"$1"$2')
                .replace(/(:\s)'(.+)'/g, '$1"$2"')
                .replace(/(:\s)'{2}/g, '$1""')
                .replace(/'{2}/g, '\'');
        }

        /**
         * Prepare function data
         * @param {Object} version
         * @returns {Object} data for export
         */
        function prepareFunctionData(version) {
            var versionCopy = angular.copy(version);

            if (lodash.has(versionCopy, 'spec.build.commands')) {
                lodash.forEach(versionCopy.spec.build.commands, function (command, index) {
                    versionCopy.spec.build.commands[index] = command.replace(/'/g, '\'\'');
                });
            }

            // using `angular.fromJson` & `angular.toJson` to easily get rid of `$$hashKey` property in all levels
            return angular.fromJson(angular.toJson({
                metadata: lodash.omit(versionCopy.metadata, 'namespace'),
                spec: lodash.omit(versionCopy.spec, 'build.noBaseImagesPull')
            }));
        }

        /**
         * Prepare YAML object
         * @param {Object} objectToParse
         * @returns {string} YAML object
         */
        function prepareYamlObject(objectToParse) {
            var parsedObject = YAML.stringify(objectToParse, Infinity, 2);

            return getValidYaml(parsedObject);
        }
        /**
         * Prepare blob object for downloading
         * @param {Object} objectToParse
         * @returns {Blob} Blob object
         */
        function prepareBlobObject(objectToParse) {
            var parsedObject = prepareYamlObject(objectToParse);

            return new Blob([parsedObject], {
                type: 'application/json'
            });
        }
    }
}());
