(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclVersion', {
            bindings: {
                project: '<',
                version: '<',
                onEditCallback: '&?'
            },
            templateUrl: 'nuclio/projects/project/functions/version/version.tpl.html',
            controller: NclVersionController
        });

    function NclVersionController($interval, $rootScope, $state, $stateParams, lodash, ConfigService, DialogsService, NuclioHeaderService,
                                  NuclioFunctionsDataService, NuclioProjectsDataService) {
        var ctrl = this;
        var interval = null;

        ctrl.actions = [
            {
                id: 'newVersion',
                name: 'Publish new version'
            },
            {
                id: 'createAlias',
                name: 'Create alias'
            },
            {
                id: 'deleteFunction',
                name: 'Delete function'
            },
            {
                id: 'exportFunction',
                name: 'Export function'
            }
        ];
        ctrl.isDemoMode = ConfigService.isDemoMode;
        ctrl.isTestResultShown = false;
        ctrl.isSplashShowed = {
            value: false
        };

        // TODO
        ctrl.selectedTestEvent = '';
        ctrl.testEvents = [
            {
                id: 'firstTestEvent',
                name: 'First test event'
            },
            {
                id: 'secondTestEvent',
                name: 'Second test event'
            },
            {
                id: 'otherTestEvent',
                name: 'Other test event'
            },
            {
                id: 'toBeContinued',
                name: 'To be continued ...'
            }
        ];

        ctrl.$onInit = onInit;

        ctrl.createTestEvent = createTestEvent;
        ctrl.deployVersion = deployVersion;
        ctrl.editTestEvent = editTestEvent;
        ctrl.onSelectTestEvent = onSelectTestEvent;
        ctrl.runVersionTest = runVersionTest;
        ctrl.toggleTestResult = toggleTestResult;

        //
        // Hook method
        //

        /**
         * Initialization method
         */
        function onInit() {
            if (lodash.isNil(ctrl.version) && !lodash.isEmpty($stateParams.functionData)) {
                ctrl.version = $stateParams.functionData;
            }

            ctrl.navigationTabsConfig = [
                {
                    tabName: 'Code',
                    uiRoute: 'app.project.function.edit.code',
                    isNewFunction: $stateParams.isNewFunction
                },
                {
                    tabName: 'Configuration',
                    uiRoute: 'app.project.function.edit.configuration',
                    isNewFunction: $stateParams.isNewFunction
                },
                {
                    tabName: 'Trigger',
                    uiRoute: 'app.project.function.edit.trigger',
                    isNewFunction: $stateParams.isNewFunction
                }
            ];

            if (ctrl.isDemoMode()) {
                ctrl.navigationTabsConfig.push({
                    tabName: 'Monitoring',
                    uiRoute: 'app.project.function.edit.monitoring',
                    isNewFunction: $stateParams.isNewFunction
                });
            }
            ctrl.testEvents = [];
            ctrl.selectedTestEvent = lodash.isEmpty(ctrl.testEvents) ? null : ctrl.testEvents[0].id;

            // delete when createTestEvent will be implemented
            ctrl.testEventNumber = 0;

            NuclioProjectsDataService.getProject($stateParams.projectId)
                .then(function (project) {
                    ctrl.project = project;

                    // breadcrumbs config
                    var title = {
                        project: ctrl.project.spec.displayName,
                        function: $stateParams.functionId,
                        version: '$LATEST'
                    };

                    NuclioHeaderService.updateMainHeader('Projects', title, $state.current.name);
                })
                .catch(function () {
                    DialogsService.alert('Oops: Unknown error occurred');
                });
        }

        //
        // Public methods
        //

        /**
         * Opens new test event dialog
         */
        function createTestEvent() {

            // delete when this function will be implemented
            ctrl.testEventNumber++;

            var newTestEvent = {
                id: 'EventId' + ctrl.testEventNumber,
                name: 'EventName ' + ctrl.testEventNumber
            };
            ctrl.testEvents.push(newTestEvent);
            ctrl.selectedTestEvent = newTestEvent.id;
        }

        /**
         * Deploys changed version
         */
        function deployVersion() {
            $rootScope.$broadcast('deploy-function-version');
            ctrl.isSplashShowed.value = true;

            if (!lodash.isEmpty($stateParams.functionData)) {
                ctrl.version = $stateParams.functionData;
            }

            NuclioFunctionsDataService.updateFunction(ctrl.version)
                .then(pullFunctionState);
        }

        /**
         * Opens edit test event dialog
         */
        function editTestEvent() {

            // TODO
            DialogsService.alert('This functionality is not implemented yet.');
        }

        /**
         * Called when a test event is selected
         * @param {Object} item - the new data
         */
        function onSelectTestEvent(item) {
            ctrl.selectedTestEvent = item.id;
        }

        /**
         * Calls version test
         */
        function runVersionTest() {

            // TODO
            ctrl.testResult = {
                status: {
                    state: 'Succeeded',
                    code: 'Lorem'
                },
                headers: {
                    'Access-control-allow-origin': '*',
                    'Date': '2018-02-05T17:07:48.509Z',
                    'x-nuclio-logs': [],
                    'Server': 'nuclio',
                    'Content-Length': 5,
                    'Content-Type': 'text/plain; charset=utf-8'
                },
                data: {
                    'metadata': {
                        'name': 'name',
                        'namespace': 'nuclio'
                    }
                }
            };
            ctrl.isTestResultShown = true;
        }

        /**
         * Shows/hides test version result
         */
        function toggleTestResult() {
            ctrl.isTestResultShown = !ctrl.isTestResultShown;
        }

        /**
         * Pulls function status.
         * Periodically sends request to get function's state, until state will not be 'ready' or 'error'
         */
        function pullFunctionState() {
            interval = $interval(function () {
                NuclioFunctionsDataService.getFunction(ctrl.version.metadata)
                    .then(function (response) {
                        if (response.status.state === 'ready') {
                            if (!lodash.isNil(interval)) {
                                $interval.cancel(interval);
                                interval = null;
                            }

                            ctrl.isSplashShowed.value = false;

                            $state.go('app.project.functions', {
                                projectId: ctrl.project.metadata.name
                            });
                        } else if (response.status.state === 'error') {
                            if (!lodash.isNil(interval)) {
                                $interval.cancel(interval);
                                interval = null;
                            }

                            ctrl.isSplashShowed.value = false;

                            DialogsService.alert('Failed to deploy function "' + ctrl.version.metadata.name + '".')
                                .then(function () {
                                    $state.go('app.project.functions', {
                                        projectId: ctrl.project.metadata.name
                                    });
                                });
                        }
                    })
                    .catch(function (error) {
                        if (error.status !== 404) {
                            if (!lodash.isNil(interval)) {
                                $interval.cancel(interval);
                                interval = null;
                            }

                            ctrl.isSplashShowed.value = false;
                        }
                    });
            }, 2000);
        }
    }
}());
