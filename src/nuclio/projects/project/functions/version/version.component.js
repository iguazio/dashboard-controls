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
        ctrl.isInvocationSuccess = false;
        ctrl.scrollConfig = {
            axis: 'y',
            advanced: {
                updateOnContentResize: true
            }
        };
        ctrl.loggerScrollConfig = {
            advanced: {
                updateOnContentResize: true
            },
            theme: 'light-thin'
        };
        ctrl.deployResult = {};
        ctrl.isSplashShowed = {
            value: false
        };
        ctrl.selectedFunctionEvent = null;
        ctrl.testResult = {};
        ctrl.functionEvents = [];
        ctrl.rowIsCollapsed = {
            statusCode: false,
            headers: false,
            body: false,
            deployBlock: false
        };

        ctrl.isDeployDisabled = false;
        ctrl.isLayoutCollapsed = true;

        ctrl.$onInit = onInit;

        ctrl.deleteFunctionEvent = deleteFunctionEvent;
        ctrl.openFunctionEventDialog = openFunctionEventDialog;
        ctrl.deployVersion = deployVersion;
        ctrl.onSelectFunctionEvent = onSelectFunctionEvent;
        ctrl.getDeployStatusState = getDeployStatusState;
        ctrl.getLogLevel = getLogLevel;
        ctrl.getLogParams = getLogParams;
        ctrl.checkValidDeployState = checkValidDeployState;
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

            setDeployResult(lodash.get(ctrl.version, 'status.state', 'ready'));

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
                    tabName: 'Triggers',
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
            ctrl.requiredComponents = {};

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

            $scope.$on('change-state-deploy-button', changeStateDeployButton);

            if (ctrl.checkValidDeployState()) {
                ctrl.isFunctionDeployed = false;
                ctrl.isDeployResultShown = true;
                ctrl.rowIsCollapsed.deployBlock = true;

                pullFunctionState();
            }

            ctrl.isLayoutCollapsed = true;

            ctrl.version.ui = {
                deployedVersion: lodash.isNil(ctrl.version.status) ? null : getVersionCopy(),
                versionChanged: false
            };
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
                                    convertTestEventsData(response.data);

                                    ctrl.isSplashShowed.value = false;
                                });
                        })
                        .catch(function () {
                            DialogsService.alert('Oops: Unknown error occurred while deleting event');

                            ctrl.isSplashShowed.value = false;
                        });
                });
        }

        /**
         * Opens a function event dialog
         * @param {boolean} createEvent - if value 'false' then open dialog to edit existing event, otherwise open
         *     dialog to create new event.
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

                    // check if event was deployed or failed
                    // if yes, then push newest created event to events drop-down
                    if (data.value) {
                        ctrl.isSplashShowed.value = true;

                        // update test events list
                        NuclioEventService.getEvents(ctrl.version)
                            .then(function (response) {
                                convertTestEventsData(response.data);

                                ctrl.isSplashShowed.value = false;
                            })
                    }
                });
        }

        /**
         * Deploys changed version
         */
        function deployVersion() {
            if (!ctrl.isDeployDisabled) {
                ctrl.isFunctionDeployed = false;
                $rootScope.$broadcast('deploy-function-version');

                setDeployResult('building');

                if (!lodash.isEmpty($stateParams.functionData)) {
                    ctrl.version = $stateParams.functionData;
                }

                var versionCopy = lodash.omit(ctrl.version, ['status', 'spec.image', 'ui']);

                ctrl.isTestResultShown = false;
                ctrl.isDeployResultShown = true;
                ctrl.rowIsCollapsed.deployBlock = true;
                ctrl.isLayoutCollapsed = false;

                $timeout(resizeVersionView);

                NuclioFunctionsDataService.updateFunction(versionCopy, ctrl.project.metadata.name)
                    .then(pullFunctionState);
            }
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
         * Get log level display value
         * @param {string} level - the level model value (one of: 'debug', 'info', 'warn', 'error')
         * @returns {string} the log level display value
         */
        function getLogLevel(level) {
            return lodash.first(level).toUpperCase();
        }

        /**
         * Get log parameters display value
         * @param {string} logEntry - the log entry that includes the parameters
         * @returns {string} the log level display value
         */
        function getLogParams(logEntry) {
            var params = lodash.omit(logEntry, ['name', 'time', 'level', 'message', 'err']);
            return lodash.isEmpty(params) ? '' : '[' + lodash.map(params, function (value, key) {
                return key + ': ' + angular.toJson(value);
            }).join(', ').replace(/\\n/g, '\n').replace(/\\"/g, '"') + ']';
        }

        /**
         * Checks if state of deploy is valid
         * @returns {boolean}
         */
        function checkValidDeployState() {
            var validStates = ['building', 'waitingForResourceConfiguration', 'waitingForBuild', 'configuringResources'];

            return lodash.includes(validStates, ctrl.deployResult.status.state);
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
                ctrl.isTestResultShown = false;

                NuclioEventService.invokeFunction(ctrl.selectedFunctionEvent.eventData)
                    .then(function (response) {
                        return $q.reject(response);
                    })
                    .catch(function (invocationData) {
                        ctrl.testResult = {
                            status: {
                                state: invocationData.xhrStatus,
                                statusCode: invocationData.status,
                                statusText: invocationData.statusText
                            },
                            headers: invocationData.config.headers,
                            body: invocationData.data
                        };
                        ctrl.isDeployResultShown = false;
                        ctrl.isTestResultShown = true;
                        ctrl.isInvocationSuccess = lodash.startsWith(invocationData.status, '2');

                        ctrl.isTestResultShown = true;
                    });

                $timeout(resizeVersionView, 100);
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
         * Called when row is collapsed/expanded
         * @param {string} row - name of expanded/collapsed row
         */
        function onRowCollapse(row) {
            ctrl.rowIsCollapsed[row] = !ctrl.rowIsCollapsed[row];

            $timeout(resizeVersionView, 350);
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
         * Disable deploy button if forms invalid
         * @param {Object} event
         * @param {Object} args
         */
        function changeStateDeployButton(event, args) {
            if (args.component) {
                ctrl.requiredComponents[args.component] = args.isDisabled;
                ctrl.isDeployDisabled = false;

                ctrl.isDeployDisabled = lodash.some(ctrl.requiredComponents);
            } else {
                ctrl.isDeployDisabled = args.isDisabled;
            }
        }

        /**
         * Gets copy of ctrl.version without `ui` property
         */
        function getVersionCopy() {
            return angular.copy(lodash.omit(ctrl.version, 'ui'));
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

                            $rootScope.$broadcast('change-version-deployed-state', {component: 'version', isDeployed: true});

                            if (lodash.isNil(ctrl.version.status)) {
                                ctrl.version.status = response.status;
                            }
                            ctrl.version.ui = {
                                deployedVersion: getVersionCopy(),
                                versionChanged: false
                            };

                            ctrl.isFunctionDeployed = true;
                        }

                        ctrl.deployResult = response;

                        $timeout(function () {
                            angular.element('.log-panel').mCustomScrollbar('scrollTo', 'bottom');
                        });
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
         * Resize view after test result is closed
         */
        function resizeVersionView() {
            var clientHeight = document.documentElement.clientHeight;
            var navigationTabs = angular.element(document).find('.ncl-navigation-tabs')[0];
            var contentView = angular.element(document).find('.ncl-edit-version-view')[0];
            var contentBlock = angular.element(document).find('.ncl-version')[0];
            var navigationRect = navigationTabs.getBoundingClientRect();
            var contentHeight = clientHeight - navigationRect.bottom;

            contentView = angular.element(contentView);
            contentBlock = angular.element(contentBlock);

            contentView.css({'height': contentHeight + 'px'});
            contentBlock.css({'height': contentHeight + 'px'});

            $rootScope.$broadcast('igzWatchWindowResize::resize');
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
