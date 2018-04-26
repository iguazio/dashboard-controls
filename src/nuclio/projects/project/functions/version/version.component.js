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

    function NclVersionController($interval, $scope, $rootScope, $state, $stateParams, $timeout, $q, lodash, ngDialog, ConfigService,
                                  DialogsService, NuclioEventService, NuclioHeaderService, NuclioFunctionsDataService,
                                  NuclioProjectsDataService) {
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
        ctrl.selectedFunctionEvent = null;
        ctrl.functionEvents = [];
        ctrl.rowIsCollapsed = {
            statusCode: false,
            headers: false,
            body: false,
            deployBlock: false,
            deployBody: true
        };


        ctrl.$onInit = onInit;

        ctrl.deleteFunctionEvent = deleteFunctionEvent;
        ctrl.openFunctionEventDialog = openFunctionEventDialog;
        ctrl.deployVersion = deployVersion;
        ctrl.onSelectFunctionEvent = onSelectFunctionEvent;
        ctrl.getDeployStatusState = getDeployStatusState;
        ctrl.invokeFunction = invokeFunction;
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

            setDeployResult('ready');

            ctrl.isFunctionDeployed = !$stateParams.isNewFunction;
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
                    uiRoute: 'app.project.function.edit.code'
                },
                {
                    tabName: 'Configuration',
                    uiRoute: 'app.project.function.edit.configuration'
                },
                {
                    tabName: 'Trigger',
                    uiRoute: 'app.project.function.edit.trigger'
                }
            ];

            if (ctrl.isDemoMode()) {
                ctrl.navigationTabsConfig.push({
                    tabName: 'Monitoring',
                    uiRoute: 'app.project.function.edit.monitoring'
                });
            }
            ctrl.functionEvents = [];
            ctrl.selectedFunctionEvent = lodash.isEmpty(ctrl.functionEvents) ? null : ctrl.functionEvents[0];

            $q.all({
                project: NuclioProjectsDataService.getProject($stateParams.projectId),
                events: NuclioEventService.getEvents(ctrl.version)
            }).then(function (response) {

                // set projects data
                ctrl.project = response.project;

                // sets function events data
                convertTestEventsData(response.events.data);

                // breadcrumbs config
                var title = {
                    project: ctrl.project.spec.displayName,
                    function: $stateParams.functionId,
                    version: '$LATEST'
                };

                NuclioHeaderService.updateMainHeader('Projects', title, $state.current.name);
            }).catch(function () {
                DialogsService.alert('Oops: Unknown error occurred');
            });
        }

        //
        // Public methods
        //

        /**
         * Deletes selected event
         */
        function deleteFunctionEvent() {
            var dialogConfig = {
                message: {
                    message: 'Delete event “' + ctrl.selectedFunctionEvent.name + '”?',
                    description: 'Deleted event cannot be restored.'
                },
                yesLabel: 'Yes, Delete',
                noLabel: 'Cancel',
                type: 'nuclio_alert'
            };

            DialogsService.confirm(dialogConfig.message, dialogConfig.yesLabel, dialogConfig.noLabel, dialogConfig.type)
                .then(function () {
                    var eventData = {
                        metadata: {
                            name: ctrl.selectedFunctionEvent.eventData.metadata.name,
                            namespace: ctrl.selectedFunctionEvent.eventData.metadata.namespace
                        }
                    };

                    ctrl.isSplashShowed.value = true;

                    NuclioEventService.deleteEvent(eventData)
                        .then(function () {

                            // update test events list
                            NuclioEventService.getEvents(ctrl.version)
                                .then(function (response) {
                                    convertTestEventsData(response.data)

                                    ctrl.isSplashShowed.value = false;
                                })
                        })
                        .catch(function () {
                            DialogsService.alert('Oops: Unknown error occurred while deleting event');

                            ctrl.isSplashShowed.value = false;
                        });
                })
        }

        /**
         * Opens a function event dialog
         * @param {boolean} createEvent - if value 'false' then open dialog to edit exisitng event, otherwise open dialog
         * to create new event.
         */
        function openFunctionEventDialog(createEvent) {
            ngDialog.open({
                template: '<ncl-function-event-dialog data-create-event="ngDialogData.createEvent" ' +
                'data-selected-event="ngDialogData.selectedEvent" data-version="ngDialogData.version" ' +
                'data-close-dialog="closeThisDialog(isEventDeployed)"></ncl-test-event-dialog>',
                plain: true,
                scope: $scope,
                data: {
                    createEvent: createEvent,
                    selectedEvent: createEvent ? {} : lodash.get(ctrl.selectedFunctionEvent, 'eventData', {}),
                    version: ctrl.version
                },
                className: 'ngdialog-theme-iguazio settings-dialog-wrapper'
            })
                .closePromise
                .then(function (data) {

                    // check if event was doployed or failed
                    // if yes, then push newest crwated event to events drop-down
                    if (data.value) {
                        ctrl.isSplashShowed.value = true;

                        // update test events list
                        NuclioEventService.getEvents(ctrl.version)
                            .then(function (response) {
                                convertTestEventsData(response.data);

                                ctrl.isSplashShowed.value = false;
                            })
                    }
                })

        }

        /**
         * Deploys changed version
         */
        function deployVersion() {
            $rootScope.$broadcast('deploy-function-version');

            setDeployResult('building');

            if (!lodash.isEmpty($stateParams.functionData)) {
                ctrl.version = $stateParams.functionData;
            }

            ctrl.version = lodash.omit(ctrl.version, 'status');

            ctrl.isDeployResultShown = true;
            lodash.assign(ctrl.rowIsCollapsed, {
                deployBlock: true,
                deployBody: false
            });

            NuclioFunctionsDataService.updateFunction(ctrl.version, ctrl.project.metadata.name)
                .then(pullFunctionState);
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
        function onSelectFunctionEvent(item) {
            ctrl.selectedFunctionEvent = item;
        }

        /**
         * Calls version test
         */
        function invokeFunction() {
            if (!lodash.isNil(ctrl.selectedFunctionEvent)) {
                NuclioEventService.invokeFunction(ctrl.selectedFunctionEvent.eventData)
                    .then(function (response) {

                        // TODO
                        ctrl.testResult = response.data
                    })
                    .catch(function () {

                        // TODO: replace with real data
                        lodash.defauldDeeps(ctrl.testResult, {
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
                            body: {
                                'metadata': {
                                    'name': 'name',
                                    'namespace': 'nuclio'
                                }
                            }
                        });

                        ctrl.isTestResultShown = true;
                    });
            }
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

                        ctrl.isFunctionDeployed = true;
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

        /**
         * Converts event to structure that needed for drop-down
         * @param {Array} events -  array of events
         */
        function convertTestEventsData(events) {
            ctrl.functionEvents = lodash.map(events, function (event) {
                return {
                    id: event.metadata.name,
                    name: event.spec.displayName,
                    eventData: event
                }
            });

            ctrl.selectedFunctionEvent = ctrl.functionEvents[0];
        }

        /**
         * Sets deploying results
         * @param {string} value
         */
        function setDeployResult(value) {
            ctrl.deployResult = {
                status: {
                    state: value
                }
            };
        }
    }
}());
