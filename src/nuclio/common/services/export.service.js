/*
Copyright 2018 Iguazio Systems Ltd.
Licensed under the Apache License, Version 2.0 (the "License") with
an addition restriction as set forth herein. You may not use this
file except in compliance with the License. You may obtain a copy of
the License at http://www.apache.org/licenses/LICENSE-2.0.
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. See the License for the specific language governing
permissions and limitations under the License.
In addition, you may not use the software for any purposes that are
illegal under applicable law, and the grant of the foregoing license
under the Apache 2.0 license is conditioned upon your compliance with
such restriction.
*/
(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .factory('ExportService', ExportService);

    function ExportService($i18next, $q, $timeout, $window, i18next, lodash, DialogsService, YamlService) {
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

            return YamlService.prepareYamlObject(functionConfig);
        }

        /**
         * Exports the project
         * @param {Object} project
         * @param {Function} getFunctions
         */
        function exportProject(project, getFunctions) {
            getFunctions(project.metadata.name, false)
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
                                name: project.metadata.name
                            },
                            spec: {
                                functions: functionsList
                            }
                        }
                    };

                    var blob = prepareBlobObject(projectToExport);

                    downloadExportedFunction(blob, project.metadata.name);
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
                return getFunctions(project.metadata.name, false)
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
                                name: project.metadata.name
                            },
                            spec: {
                                functions: lodash.defaultTo(functionsList, [])
                            }
                        };
                    });
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
         * Prepare blob object for downloading
         * @param {Object} objectToParse
         * @returns {Blob} Blob object
         */
        function prepareBlobObject(objectToParse) {
            var parsedObject = YamlService.prepareYamlObject(objectToParse);

            return new Blob([parsedObject], {
                type: 'application/json'
            });
        }
    }
}());
