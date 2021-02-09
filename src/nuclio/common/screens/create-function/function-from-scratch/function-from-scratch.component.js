(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclFunctionFromScratch', {
            bindings: {
                project: '<',
                projects: '<',
                getFunction: '&',
                toggleSplashScreen: '&',
                createNewProject: '<',
                selectedProject: '<'
            },
            templateUrl: 'nuclio/common/screens/create-function/function-from-scratch/function-from-scratch.tpl.html',
            controller: FunctionFromScratchController
        });

    function FunctionFromScratchController($document, $state, $timeout, lodash, ConfigService, EventHelperService,
                                           FunctionsService, ValidationService) {
        var ctrl = this;

        ctrl.functionData = {};
        ctrl.functionFromScratchForm = {};
        ctrl.inputModelOptions = {
            debounce: {
                'default': 0
            }
        };
        ctrl.maxLengths = {
            functionName: ValidationService.getMaxLength('function.name')
        };
        ctrl.runtimes = [];
        ctrl.selectedRuntime = null;
        ctrl.validationRules = {
            functionName: ValidationService.getValidationRules('function.name')
        };

        ctrl.$onInit = onInit;
        ctrl.$onChanges = onChanges;
        ctrl.$onDestroy = onDestroy;

        ctrl.createFunction = createFunction;
        ctrl.inputValueCallback = inputValueCallback;
        ctrl.isCreateFunctionAllowed = isCreateFunctionAllowed;
        ctrl.isProjectsDropDownVisible = isProjectsDropDownVisible;
        ctrl.onRuntimeChange = onRuntimeChange;
        ctrl.onProjectChange = onProjectChange;

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.runtimes = getRuntimes();
            ctrl.selectedRuntime = getDefaultRuntime();

            $document.on('keypress', createFunction);

            initFunctionData();
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
         * Creates function with defined data.
         */
        function createFunction(event) {
            $timeout(function () {
                if ((angular.isUndefined(event) || event.keyCode === EventHelperService.ENTER) && ctrl.isCreateFunctionAllowed()) {

                    // create function only when form is valid
                    if (ctrl.functionFromScratchForm.$valid) {
                        ctrl.toggleSplashScreen({ value: true });

                        ctrl.getFunction({metadata: {name: ctrl.functionData.metadata.name}})
                            .then(function (existingFunction) {
                                ctrl.toggleSplashScreen({ value: false });
                                FunctionsService.openFunctionConflictDialog(ctrl.project,
                                                                            ctrl.functionData,
                                                                            existingFunction);
                            })
                            .catch(function (error) {
                                if (error.status === 404) {
                                    ctrl.toggleSplashScreen({ value: true });

                                    lodash.defaultsDeep(ctrl, {
                                        functionData: {
                                            metadata: {}
                                        }
                                    });

                                    if (lodash.isEmpty(ctrl.project) && ctrl.selectedProject.id !== 'new_project') {
                                        ctrl.project = lodash.find(ctrl.projects, ['metadata.name', ctrl.selectedProject.id]);
                                    }

                                    $state.go('app.project.function.edit.code', {
                                        isNewFunction: true,
                                        id: ctrl.project.metadata.name,
                                        projectId: ctrl.project.metadata.name,
                                        projectNamespace: ctrl.project.metadata.namespace,
                                        functionId: ctrl.functionData.metadata.name,
                                        functionData: ctrl.functionData
                                    });
                                }
                            });
                    }
                }
            }, 100);
        }

        /**
         * Set data returned by validating input component
         * @param {string} data - data to be set
         * @param {string} field - field which should be filled
         */
        function inputValueCallback(data, field) {
            $timeout(function () {
                if (!lodash.isNil(data)) {
                    lodash.set(ctrl, 'functionData.metadata.' + field, data);
                }
            });
        }

        /**
         * Checks permissibility creation of new function.
         * @returns {boolean}
         */
        function isCreateFunctionAllowed() {
            return lodash.isEmpty(ctrl.functionFromScratchForm.$error);
        }

        /**
         * Hides or shows projects drop-down.
         * Show drop-down if 'Create Function' screen was reached from 'Projects' screen. Otherwise - hide drop-down
         * @returns {boolean}
         */
        function isProjectsDropDownVisible() {
            return $state.current.name === 'app.create-function';
        }

        /**
         * Set data returned by default drop-down component
         * @param {Object} item - the new data
         * @param {boolean} isItemChanged - was value changed or not
         */
        function onRuntimeChange(item, isItemChanged) {
            if (!lodash.isNil(item) && isItemChanged) {
                lodash.assign(ctrl.functionData.spec, {
                    runtime: item.id,
                    handler: FunctionsService.getHandler(item.id),
                    build: {
                        functionSourceCode: item.sourceCode
                    }
                });
            }
        }

        /**
         * Projects drop-down callback.
         * Sets selected project to function.
         * @param {Object} item - new selected project
         */
        function onProjectChange(item) {
            ctrl.project = lodash.find(ctrl.projects, ['metadata.name', item.id]);
        }

        //
        // Private methods
        //

        /**
         * Gets all runtimes
         * @returns {Array}
         */
        function getRuntimes() {
            return [
                {
                    id: 'golang',
                    name: 'Go',
                    sourceCode: 'cGFja2FnZSBtYWluDQoNCmltcG9ydCAoDQogICAgImdpdGh1Yi5jb20vbnVjbGlvL251Y2xpby1zZGstZ28iDQo' +
                    'pDQoNCmZ1bmMgSGFuZGxlcihjb250ZXh0ICpudWNsaW8uQ29udGV4dCwgZXZlbnQgbnVjbGlvLkV2ZW50KSAoaW50ZXJmYWNle3' +
                    '0sIGVycm9yKSB7DQogICAgcmV0dXJuIG5pbCwgbmlsDQp9', // source code in base64
                    visible: true
                },
                {
                    id: 'python:3.6',
                    name: 'Python 3.6',
                    sourceCode: 'ZGVmIGhhbmRsZXIoY29udGV4dCwgZXZlbnQpOg0KICAgIHJldHVybiAiIg==', // source code in base64
                    visible: true
                },
                {
                    id: 'python:3.7',
                    name: 'Python 3.7',
                    sourceCode: 'ZGVmIGhhbmRsZXIoY29udGV4dCwgZXZlbnQpOg0KICAgIHJldHVybiAiIg==', // source code in base64
                    visible: true
                },
                {
                    id: 'python:3.8',
                    name: 'Python 3.8',
                    sourceCode: 'ZGVmIGhhbmRsZXIoY29udGV4dCwgZXZlbnQpOg0KICAgIHJldHVybiAiIg==', // source code in base64
                    visible: true
                },
                {
                    id: 'dotnetcore',
                    name: '.NET Core',
                    sourceCode: 'dXNpbmcgU3lzdGVtOw0KdXNpbmcgTnVjbGlvLlNkazsNCg0KcHVibGljIGNsYXNzIG1haW4NCnsNCiAgICBwdWJ' +
                    'saWMgb2JqZWN0IGhhbmRsZXIoQ29udGV4dCBjb250ZXh0LCBFdmVudCBldmVudEJhc2UpDQogICAgew0KICAgICAgICByZXR1cm' +
                    '4gbmV3IFJlc3BvbnNlKCkNCiAgICAgICAgew0KICAgICAgICAgICAgU3RhdHVzQ29kZSA9IDIwMCwNCiAgICAgICAgICAgIENvb' +
                    'nRlbnRUeXBlID0gImFwcGxpY2F0aW9uL3RleHQiLA0KICAgICAgICAgICAgQm9keSA9ICIiDQogICAgICAgIH07DQogICAgfQ0K' +
                    'fQ==', // source code in base64
                    visible: true
                },
                {
                    id: 'java',
                    name: 'Java',
                    sourceCode: 'aW1wb3J0IGlvLm51Y2xpby5Db250ZXh0Ow0KaW1wb3J0IGlvLm51Y2xpby5FdmVudDsNCmltcG9ydCBpby5udWN' +
                    'saW8uRXZlbnRIYW5kbGVyOw0KaW1wb3J0IGlvLm51Y2xpby5SZXNwb25zZTsNCg0KcHVibGljIGNsYXNzIEhhbmRsZXIgaW1wbG' +
                    'VtZW50cyBFdmVudEhhbmRsZXIgew0KDQogICAgQE92ZXJyaWRlDQogICAgcHVibGljIFJlc3BvbnNlIGhhbmRsZUV2ZW50KENvb' +
                    'nRleHQgY29udGV4dCwgRXZlbnQgZXZlbnQpIHsNCiAgICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKCkuc2V0Qm9keSgiIik7DQog' +
                    'ICAgfQ0KfQ==',
                    visible: true
                },
                {
                    id: 'nodejs',
                    sourceCode: 'ZXhwb3J0cy5oYW5kbGVyID0gZnVuY3Rpb24oY29udGV4dCwgZXZlbnQpIHsNCiAgICBjb250ZXh0LmNhbGxiYWN' +
                    'rKCcnKTsNCn07', // source code in base64
                    name: 'NodeJS',
                    visible: true
                },
                {
                    id: 'shell',
                    name: 'Shell',
                    sourceCode: 'ZWNobyAiSGVsbG8gZnJvbSBOdWNsaW8i',
                    visible: true
                },
                {
                    id: 'ruby',
                    name: 'Ruby',
                    sourceCode: 'ZGVmIGhhbmRsZXIoY29udGV4dCwgZXZlbnQpDQplbmQ=', // source code in base64
                    visible: true
                }
            ];
        }

        /**
         * Gets default runtime
         * @returns {Object} default runtime
         */
        function getDefaultRuntime() {
            return lodash.find(ctrl.runtimes, ['id', 'golang']);
        }

        /**
         * Initialize object for function from scratch
         */
        function initFunctionData() {
            ctrl.functionData = {
                metadata: {
                    name: '',
                    namespace: '',
                    labels: {},
                    annotations: {}
                },
                spec: {
                    description: '',
                    disable: false,
                    triggers: {},
                    env: [],
                    loggerSinks: [{
                        level: 'debug',
                        sink: ''
                    }],
                    handler: FunctionsService.getHandler(ctrl.selectedRuntime.id),
                    runtime: ctrl.selectedRuntime.id,
                    build: {
                        functionSourceCode: ctrl.selectedRuntime.sourceCode
                    }
                }
            };

            if (ConfigService.isDemoMode()) {
                ctrl.functionData.spec.timeoutSeconds = 0;
            }
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
                        name: lodash.defaultTo(project.spec.displayName, project.metadata.name)
                    };
                })
                .sortBy(['name'])
                .value();

            ctrl.selectedProject = lodash.isEmpty(ctrl.projectsList)         ? newProject                      :
                                   ctrl.selectedProject.id === 'new_project' ? lodash.first(ctrl.projectsList) :
                                   /* else */                                  ctrl.selectedProject;
        }
    }
}());
