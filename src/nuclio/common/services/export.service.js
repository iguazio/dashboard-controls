(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .factory('ExportService', ExportService);

    function ExportService($q, $timeout, DialogsService, lodash, YAML) {
        return {
            exportFunction: exportFunction,
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
            var functionToExport = {
                metadata: lodash.omit(version.metadata, 'namespace'),
                spec: lodash.omit(version.spec, ['build.noBaseImagesPull', 'loggerSinks'])
            };

            var blob = prepareBlobObject(functionToExport);

            downloadExportedFunction(blob, version.metadata.name);
        }

        /**
         * Exports the project
         * @param {Object} project
         * @param {Function} getFunctions
         */
        function exportProject(project, getFunctions) {
            getFunctions({id: project.metadata.name})
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
                                name: project.spec.displayName
                            },
                            spec: {
                                functions: functionsList
                            }
                        }
                    };

                    var blob = prepareBlobObject(projectToExport);

                    downloadExportedFunction(blob, project.spec.displayName);
                })
                .catch(function (error) {
                    var msg = 'Oops: Unknown error occurred while exporting the project';
                    DialogsService.alert(lodash.get(error, 'data.error', msg));
                });

        }

        /**
         * Exports projects
         * @param {Object} projects
         * @param {Function} getFunctions
         */
        function exportProjects(projects, getFunctions) {
            var promises = lodash.map(projects, function (project) {
                return getFunctions({id: project.metadata.name})
                    .then(function (functions) {
                        var functionsList = lodash.map(functions, function (functionItem) {
                            return lodash.chain(functionItem)
                                .set('spec.version', 1)
                                .omit(['status', 'metadata.namespace'])
                                .value();
                        });

                        return {
                            metadata: {
                                name: project.spec.displayName
                            },
                            spec: {
                                functions: functionsList
                            }
                        };
                    })
                    .catch(angular.noop);
            });

            $q.all(promises)
                .then(function (projectsToExport) {
                    var blob = prepareBlobObject({
                        projects: projectsToExport
                    });

                    downloadExportedFunction(blob, 'projects');
                })
                .catch(function (error) {
                    var msg = 'Oops: Unknown error occurred while exporting projects';
                    DialogsService.alert(lodash.get(error, 'data.error', msg));
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
            var url = URL.createObjectURL(data);
            var link = document.createElement('a');

            link.href = url;
            link.download = fileName + '.yaml';
            document.body.appendChild(link);

            $timeout(function () {
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
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
         * Second and Third RegExp replaces all single quotes on double quotes.
         * Example:
         * 'key': 'value' -> "key": "value"
         * Fourth RegExp replaces all pairs of single quotes on one single quote.
         * It needs because property name or property value is a sting which contains single quote
         * will parsed by yaml.js package in string with pair of single quotes.
         * Example:
         * "ke'y": "val'ue"
         * After will parse will be -> "ke''y": "val''ue"
         * This RegExp will transform it to normal view -> "ke'y": "val'ue"
         * @param {string} data - incoming YAML-string
         * @returns {string}
         */
        function getValidYaml(data) {
            return data.replace(/(\s+\-)\s*\n\s+/g, '$1 ')
                .replace(/'(.+)'(:)/g, '\"$1\"$2')
                .replace(/(:\s)'(.+)'/g, '$1\"$2\"')
                .replace(/'{2}/g, '\'');
        }

        /**
         * Prepare blob object for downloading
         * @param {Object} objectToParse
         * @returns {Blob} Blob object
         */
        function prepareBlobObject(objectToParse) {
            var parsedObject = YAML.stringify(objectToParse, Infinity, 2);

            parsedObject = getValidYaml(parsedObject);

            return new Blob([parsedObject], {
                type: 'application/json'
            });
        }
    }
}());
