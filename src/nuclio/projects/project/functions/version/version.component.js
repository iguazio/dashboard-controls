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
        ctrl.isSplashShowed = {
            value: false
        };
        ctrl.selectedTestEvent = null;
        ctrl.testEvents = [];


        ctrl.$onInit = onInit;

        ctrl.deleteEvent = deleteEvent;
        ctrl.openTestEventDialog = openTestEventDialog;
        ctrl.deployVersion = deployVersion;
        ctrl.onSelectTestEvent = onSelectTestEvent;
        ctrl.invokeFunction = invokeFunction;
        ctrl.toggleTestResult = toggleTestResult;
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
            ctrl.testEvents = [];
            ctrl.selectedTestEvent = lodash.isEmpty(ctrl.testEvents) ? null : ctrl.testEvents[0].id;

            $q.all([NuclioProjectsDataService.getProject($stateParams.projectId), NuclioEventService.getEvents(ctrl.version)])
                .then(function (response) {

                    // set projects data
                    ctrl.project = response[0];

                    // sets test events data
                    convertTestEventsData(response[1].data)

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
         * Deletes selected event
         */
        function deleteEvent() {
            DialogsService.confirm('Delete event ' + ctrl.selectedTestEvent.name + '?', 'Yes, Delete', 'Cancel')
                .then(function () {
                    var eventData = {
                        metadata: {
                            name: ctrl.selectedTestEvent.eventData.metadata.name,
                            namespace: ctrl.selectedTestEvent.eventData.metadata.namespace
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
         * Opens a test event dialog
         * @param {boolean} createEvent - if vule 'false' then open dilog to edit exisitng event, otherwise open dialog
         * to create new event.
         */
        function openTestEventDialog(createEvent) {
            ngDialog.open({
                template: '<ncl-test-event-dialog data-create-event="ngDialogData.createEvent" ' +
                'data-selected-event="ngDialogData.selectedEvent" data-version="ngDialogData.version" ' +
                'data-close-dialog="closeThisDialog(isEventDeployed)"></ncl-test-event-dialog>',
                plain: true,
                scope: $scope,
                data: {
                    createEvent: createEvent,
                    selectedEvent: ctrl.selectedTestEvent.eventData,
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
                                convertTestEventsData(response.data)

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

            ctrl.isSplashShowed.value = true;

            if (!lodash.isEmpty($stateParams.functionData)) {
                ctrl.version = $stateParams.functionData;
            }

            ctrl.version = lodash.omit(ctrl.version, 'status');

            NuclioFunctionsDataService.updateFunction(ctrl.version, ctrl.project.metadata.name)
                .then(pullFunctionState);
        }

        /**
         * Called when a test event is selected
         * @param {Object} item - the new data
         */
        function onSelectTestEvent(item) {
            ctrl.selectedTestEvent = item;
        }

        /**
         * Calls version test
         */
        function invokeFunction() {
            if (!lodash.isNil(ctrl.selectedTestEvent)) {

                NuclioEventService.invokeFunction(ctrl.selectedTestEvent.eventData)
                    .then(function (response) {

                        // TODO
                        ctrl.testResult = response.data
                    })
                    .catch(function () {
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
                        })
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
         * Pulls function status.
         * Periodically sends request to get function's state, until state will not be 'ready' or 'error'
         */
        function pullFunctionState() {
            interval = $interval(function () {
                NuclioFunctionsDataService.getFunction(ctrl.version.metadata, ctrl.project.metadata.name)
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

        /**
         * Converts event to structure that needed for drop-down
         * @param {Array} events -  array of events
         */
        function convertTestEventsData(events) {
            ctrl.testEvents = lodash.map(events, function (event) {
                return {
                    id: event.metadata.name,
                    name: event.spec.displayName,
                    eventData: event
                }
            });

            ctrl.selectedTestEvent = ctrl.testEvents[0];
        }
    }
}());
