(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclFunctionFromScratch', {
            bindings: {
                project: '<',
                toggleSplashScreen: '&'
            },
            templateUrl: 'nuclio/projects/project/functions/create-function/function-from-scratch/function-from-scratch.tpl.html',
            controller: FunctionFromScratchController
        });

    function FunctionFromScratchController($interval, $state, $stateParams, lodash, DialogsService, FunctionsService,
                                           NuclioFunctionsDataService, NuclioProjectsDataService, ValidatingPatternsService) {
        var ctrl = this;
        var interval = null;

        ctrl.functionData = {};
        ctrl.runtimes = [];
        ctrl.selectedRuntime = null;

        ctrl.$onInit = onInit;

        ctrl.validationPatterns = ValidatingPatternsService;

        ctrl.cancelCreating = cancelCreating;
        ctrl.createFunction = createFunction;
        ctrl.inputValueCallback = inputValueCallback;
        ctrl.onDropdownDataChange = onDropdownDataChange;

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.runtimes = getRuntimes();
            ctrl.selectedRuntime = getDefaultRuntime();

            initFunctionData();
        }

        //
        // Public methods
        //

        /**
         * Cancels creating a function
         */
        function cancelCreating(event) {
            event.preventDefault();

            DialogsService.confirm('Leaving this page will discard your changes.',
                'Leave', 'Don\'t leave')
                .then(function () {
                    $state.go('app.projects');
                });
        }

        /**
         * Callback handler for 'create function' button
         * Creates function with defined data.
         */
        function createFunction() {
            ctrl.toggleSplashScreen({value: true});

            // create function only when form is valid
            if (ctrl.functionFromScratchForm.$valid) {
                lodash.set(ctrl, 'functionData.metadata.namespace', ctrl.project.metadata.namespace);

                NuclioFunctionsDataService.createFunction(ctrl.functionData)
                    .then(function () {
                        ctrl.toggleSplashScreen({value: true});

                        pullFunctionState();
                    })
                    .catch(function () {
                        DialogsService.alert('Oops: Unknown error occurred');
                    });
            }
        }

        /**
         * Set data returned by validating input component
         * @param {string} data - data to be set
         * @param {string} field - field which should be filled
         */
        function inputValueCallback(data, field) {
            if (!lodash.isNil(data)) {
                lodash.set(ctrl, 'functionData.metadata.' + field, data);
            }
        }

        /**
         * Set data returned by default dropdown component
         * @param {Object} item - the new data
         * @param {boolean} isItemChanged - was value changed or not
         */
        function onDropdownDataChange(item, isItemChanged) {
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
                    id: 'python:2.7',
                    name: 'Python 2.7',
                    sourceCode: 'ZGVmIGhhbmRsZXIoY29udGV4dCwgZXZlbnQpOg0KICAgIHJldHVybiAiIg==', // source code in base64
                    visible: true
                },
                {
                    id: 'python:3.6',
                    name: 'Python 3.6',
                    sourceCode: 'ZGVmIGhhbmRsZXIoY29udGV4dCwgZXZlbnQpOg0KICAgIHJldHVybiAiIg==', // source code in base64
                    visible: true
                },
                {
                    id: 'pypy',
                    name: 'PyPy',
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
                    sourceCode: '',
                    visible: true
                }
            ];
        }

        /**
         * Gets default runtime
         * @returns {object} default runtime
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
                    timeoutSeconds: 0,
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
                    },
                    minReplicas: 0,
                    maxReplicas: 1
                }
            };
        }

        /**
         * Pulls function status.
         * Periodically sends request to get function's state, until state will not be 'ready' or 'error'
         */
        function pullFunctionState() {
            interval = $interval(function () {
                NuclioFunctionsDataService.getFunction(ctrl.functionData.metadata)
                    .then(function (response) {
                        if (lodash.includes(['ready', 'error'], response.status.state)) {
                            if (!lodash.isNil(interval)) {
                                $interval.cancel(interval);
                                interval = null;
                            }

                            ctrl.toggleSplashScreen({value: false});

                            $state.go('app.project.function.edit.code', {
                                isNewFunction: false,
                                id: ctrl.project.metadata.name,
                                functionId: ctrl.functionData.metadata.name,
                                projectNamespace: ctrl.project.metadata.namespace,
                                functionData: ctrl.functionData
                            });
                        }
                    })
                    .catch(function (error) {
                        if (error.status !== 404) {
                            if (!lodash.isNil(interval)) {
                                $interval.cancel(interval);
                                interval = null;
                            }

                            ctrl.toggleSplashScreen({value: false});
                        }
                    });
            }, 2000);
        }
    }
}());
