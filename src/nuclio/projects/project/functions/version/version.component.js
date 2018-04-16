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

    function NclVersionController($rootScope, $state, $stateParams, lodash, DialogsService, NuclioHeaderService, NuclioFunctionsDataService, NuclioProjectsDataService) {
        var ctrl = this;

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
        ctrl.isTestResultShown = false;

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
            ctrl.navigationTabsConfig = [
                {
                    tabName: 'Code',
                    uiRoute: 'app.project.function.edit.code'
                },
                {
                    tabName: 'Configuration',
                    uiRoute: 'app.project.function.edit.configuration'
                },
                {
                    tabName: 'Trigger',
                    uiRoute: 'app.project.function.edit.trigger'
                },
                {
                    tabName: 'Monitoring',
                    uiRoute: 'app.project.function.edit.monitoring'
                }
            ];
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
            NuclioFunctionsDataService.updateFunction(ctrl.version).then(function (response) {
                $state.go('app.project.functions');
            });
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
    }
}());
