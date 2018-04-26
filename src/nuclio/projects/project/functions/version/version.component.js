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

    function NclVersionController($interval, $rootScope, $state, $stateParams, $timeout, lodash, ConfigService, DialogsService, NuclioHeaderService,
                                  NuclioFunctionsDataService, NuclioProjectsDataService) {
        var ctrl = this;
        var interval = null;

        ctrl.action = null;
        ctrl.isDemoMode = ConfigService.isDemoMode;
        ctrl.isTestResultShown = false;
        ctrl.scrollConfig = {
            axis: 'y',
            advanced: {
                updateOnContentResize: true
            }
        };
        ctrl.isSplashShowed = {
            value: false
        };
        ctrl.isStatusCodeCollapse = false;
        ctrl.isHeadersCollapsed = false;
        ctrl.isBodyCollapsed = false;
        ctrl.rowIsCollapsed = {
            statusCode: false,
            headers: true,
            body: false,
            deployBlock: false,
            deployBody: true
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
        ctrl.getDeployStatusState = getDeployStatusState;
        ctrl.onSelectTestEvent = onSelectTestEvent;
        ctrl.runVersionTest = runVersionTest;
        ctrl.toggleDeployResult = toggleDeployResult;
        ctrl.toggleTestResult = toggleTestResult;
        ctrl.onRowCollapse = onRowCollapse;
        ctrl.onSelectAction = onSelectAction;

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

            ctrl.deployResult = {
                status: {
                    state: 'ready'
                }
            };

            ctrl.actions = [
                {
                    id: 'deleteFunction',
                    name: 'Delete function',
                    dialog: {
                        message: {
                            message: 'Delete function “' + ctrl.version.metadata.name + '”?',
                            description: 'Deleted function cannot be restored.'
                        },
                        yesLabel: 'Yes, Delete',
                        noLabel: 'Cancel',
                        type: 'nuclio_alert'
                    }
                }
            ];

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
                    tabName: 'Triggers',
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

            ctrl.deployResult = {
                status: {
                    state: 'building'
                }
            };

            if (!lodash.isEmpty($stateParams.functionData)) {
                ctrl.version = $stateParams.functionData;
            }

            ctrl.version = lodash.omit(ctrl.version, 'status');

            ctrl.isDeployResultShown = true;
            ctrl.rowIsCollapsed.deployBlock = true;

            NuclioFunctionsDataService.updateFunction(ctrl.version, ctrl.project.metadata.name)
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
         * Gets current status state
         * @param {string} state
         * @returns {string}
         */
        function getDeployStatusState(state) {
            return state === 'ready'    ? 'Successfully deployed' :
                   state === 'error'    ? 'Failed to deploy'      :
                   state === 'building' ? 'Deploying...'          : '';
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

            $timeout(resizeVersionView);
        }

        /**
         * Shows/hides deploy version result
         */
        function toggleDeployResult() {
            ctrl.isDeployResultShown = !ctrl.isDeployResultShown;

            $timeout(resizeVersionView);
        }

        /**
         * Pulls function status.
         * Periodically sends request to get function's state, until state will not be 'ready' or 'error'
         */
        function pullFunctionState() {
            interval = $interval(function () {
                NuclioFunctionsDataService.getFunction(ctrl.version.metadata, ctrl.project.metadata.name)
                    .then(function (response) {
                        if (response.status.state === 'ready' || response.status.state === 'error') {
                            if (!lodash.isNil(interval)) {
                                $interval.cancel(interval);
                                interval = null;
                            }
                        }

                        ctrl.deployResult = response;
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

        /**
         * Called when row is collapsed/expanded
         * @param {string} row - name of expanded/collapsed row
         */
        function onRowCollapse(row) {
            ctrl.rowIsCollapsed[row] = !ctrl.rowIsCollapsed[row];

            $timeout(resizeVersionView);
        }

        /**
         * Called when action is selected
         * @param {Object} item - selected action
         */
        function onSelectAction(item) {
            ctrl.action = item.id;
            if (item.id === 'deleteFunction') {
                DialogsService.confirm(item.dialog.message, item.dialog.yesLabel, item.dialog.noLabel, item.dialog.type)
                    .then(function () {
                        ctrl.isSplashShowed.value = true;

                        NuclioFunctionsDataService.deleteFunction(ctrl.version.metadata).then(function () {
                            $state.go('app.project.functions');
                        });
                    })
                    .catch(function () {
                        ctrl.action = ctrl.actions[0].id;
                    });
            }
        }

        //
        // Private methods
        //

        /**
         * Resize view after test result is closed
         */
        function resizeVersionView() {
            var clientHeight = document.documentElement.clientHeight;
            var headerBottom = angular.element(document).find('.ncl-navigation-tabs')[0];
            var contentView = angular.element(document).find('.ncl-edit-version-view')[0];
            var contentBlock = angular.element(document).find('.ncl-version')[0];
            var headerRect = headerBottom.getBoundingClientRect();
            var contentBlockRect = contentBlock.getBoundingClientRect();
            var contentHeight = clientHeight - headerRect.bottom;
            var contentBlockHeight = contentBlockRect.bottom - contentBlockRect.top;

            contentView = angular.element(contentView);
            contentBlock = angular.element(contentBlock);

            if (contentBlockHeight < contentHeight) {
                contentView.css({'height': contentHeight + 'px'});
                contentBlock.css({'height': contentHeight + 'px'});
            }
        }
    }
}());
