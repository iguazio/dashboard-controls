/* eslint max-statements: ["error", 100] */
(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclVersion', {
            bindings: {
                project: '<',
                version: '<',
                createFunctionEvent: '&',
                getProject: '&',
                getFunction: '&',
                getFunctionEvents: '&',
                getExternalIpAddresses: '&',
                deployVersion: '&',
                deleteFunctionEvent: '&',
                deleteFunction: '&',
                invokeFunction: '&',
                onEditCallback: '&?'
            },
            templateUrl: 'nuclio/projects/project/functions/version/version.tpl.html',
            controller: NclVersionController
        });

    function NclVersionController($filter, $interval, $scope, $rootScope, $state, $stateParams, $timeout, $q, lodash,
                                  ngDialog, YAML, ConfigService, DialogsService, NuclioHeaderService) {
        var ctrl = this;
        var deregisterFunction = null;
        var interval = null;
        var eventContentType = '';

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
        ctrl.versionDeployed = true;

        ctrl.$onInit = onInit;

        ctrl.handleDeleteFunctionEvent = handleDeleteFunctionEvent;
        ctrl.openFunctionEventDialog = openFunctionEventDialog;
        ctrl.deployButtonClick = deployButtonClick;
        ctrl.onSelectFunctionEvent = onSelectFunctionEvent;
        ctrl.getDeployStatusState = getDeployStatusState;
        ctrl.checkValidDeployState = checkValidDeployState;
        ctrl.checkEventContentType = checkEventContentType;
        ctrl.handleInvokeFunction = handleInvokeFunction;
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
            setDeployResult(lodash.get(ctrl.version, 'status.state', 'ready'));

            ctrl.isFunctionDeployed = !$stateParams.isNewFunction;
            ctrl.actions = [
                {
                    id: 'exportFunction',
                    name: 'Export function'
                },
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
                },
                {
                    tabName: 'Status',
                    uiRoute: 'app.project.function.edit.monitoring',
                    status: lodash.isNil(ctrl.version.status) ? 'not yet deployed' : lodash.get(ctrl.version, 'status.state')
                }
            ];

            ctrl.functionEvents = [];
            ctrl.functionEvents = $filter('orderBy')(ctrl.functionEvents, 'name');
            ctrl.selectedFunctionEvent = lodash.isEmpty(ctrl.functionEvents) ? null : ctrl.functionEvents[0];
            ctrl.requiredComponents = {};

            $q.all({
                project: ctrl.getProject({id: $stateParams.projectId}),
                events: ctrl.getFunctionEvents({functionData: ctrl.version})
            }).then(function (response) {

                // set projects data
                ctrl.project = response.project;

                // sets function events data
                convertTestEventsData(response.events.data);

                // breadcrumbs config
                var title = {
                    project: ctrl.project,
                    projectName: ctrl.project.spec.displayName,
                    function: $stateParams.functionId,
                    version: '$LATEST'
                };

                NuclioHeaderService.updateMainHeader('Projects', title, $state.current.name);
            }).catch(function (error) {
                var msg = 'Oops: Unknown error occurred while retrieving project or events';

                if (!lodash.isEmpty(error.errors)) {
                    msg = error.errors[0].detail;
                }

                DialogsService.alert(msg);
            });

            $scope.$on('change-state-deploy-button', changeStateDeployButton);
            $scope.$on('change-version-deployed-state', setVersionDeployed);
            deregisterFunction = $scope.$on('$stateChangeStart', stateChangeStart);

            if (ctrl.checkValidDeployState()) {
                ctrl.isFunctionDeployed = false;
                ctrl.isDeployResultShown = true;
                ctrl.rowIsCollapsed.deployBlock = true;

                pullFunctionState();
            }

            ctrl.isLayoutCollapsed = true;

            lodash.merge(ctrl.version, {
                ui: {
                    deployedVersion: lodash.isNil(ctrl.version.status) ? null : getVersionCopy(),
                    versionChanged: false
                }
            });
            ctrl.version.ui.versionCode = lodash.defaultTo(ctrl.version.ui.versionCode, '');

            ctrl.getExternalIpAddresses()
                .then(function (address) {
                    ctrl.version.ui.invocationURL = lodash.has(ctrl.version, 'status.httpPort') ?
                        'http://' + address.data.externalIPAddresses.addresses[0] + ':' + ctrl.version.status.httpPort : '';
                })
                .catch(function (error) {
                    var msg = 'Oops: Unknown error occurred while retrieving external IP address\'';

                    if (!lodash.isEmpty(error.data.errors)) {
                        msg = error.data.errors[0].detail;
                    }

                    DialogsService.alert(msg);
                });
        }

        //
        // Public methods
        //

        /**
         * Deletes selected event
         */
        function handleDeleteFunctionEvent() {
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

                    ctrl.deleteFunctionEvent({eventData: eventData})
                        .then(function () {

                            // update test events list
                            ctrl.getFunctionEvents({functionData: ctrl.version})
                                .then(function (response) {
                                    convertTestEventsData(response.data);

                                    ctrl.isSplashShowed.value = false;
                                })
                                .catch(function (error) {
                                    ctrl.isSplashShowed.value = false;
                                    var msg = 'Oops: Unknown error occurred while retrieving events';

                                    if (!lodash.isEmpty(error.data.errors)) {
                                        msg = error.data.errors[0].detail;
                                    }

                                    DialogsService.alert(msg);
                                });
                        })
                        .catch(function (error) {
                            ctrl.isSplashShowed.value = false;
                            var msg = 'Oops: Unknown error occurred while deleting event';

                            if (!lodash.isEmpty(error.data.errors)) {
                                msg = error.data.errors[0].detail;
                            }

                            DialogsService.alert(msg);
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
                'data-close-dialog="closeThisDialog(result)"' +
                'data-create-function-event="ngDialogData.createFunctionEvent({eventData: eventData, isNewEvent: isNewEvent})">' +
                '</ncl-test-event-dialog>',
                plain: true,
                scope: $scope,
                data: {
                    createEvent: createEvent,
                    createFunctionEvent: ctrl.createFunctionEvent,
                    selectedEvent: createEvent ? {} : lodash.get(ctrl.selectedFunctionEvent, 'eventData', {}),
                    version: ctrl.version
                },
                className: 'ngdialog-theme-iguazio settings-dialog-wrapper'
            })
                .closePromise
                .then(function (data) {

                    // check if event was deployed or failed
                    // if yes, then push newest created event to events drop-down
                    if (data.value.isEventDeployed) {
                        ctrl.isSplashShowed.value = true;

                        // update test events list
                        ctrl.getFunctionEvents({functionData: ctrl.version})
                            .then(function (response) {
                                convertTestEventsData(response.data);

                                if (!lodash.isNil(data.value.selectedEvent)) {
                                    setEventAsSelected(data.value.selectedEvent.spec.displayName);
                                }

                                ctrl.isSplashShowed.value = false;
                            })
                            .catch(function (error) {
                                ctrl.isSplashShowed.value = false;
                                var msg = 'Oops: Unknown error occurred while retrieving events';

                                if (!lodash.isEmpty(error.data.errors)) {
                                    msg = error.data.errors[0].detail;
                                }

                                DialogsService.alert(msg);
                            });
                    }
                });
        }

        /**
         * Deploys changed version
         */
        function deployButtonClick() {
            if (!ctrl.isDeployDisabled) {
                ctrl.isFunctionDeployed = false;
                $rootScope.$broadcast('deploy-function-version');

                setDeployResult('building');

                var versionCopy = lodash.omit(ctrl.version, ['status', 'ui']);

                ctrl.isTestResultShown = false;
                ctrl.isDeployResultShown = true;
                ctrl.rowIsCollapsed.deployBlock = true;
                ctrl.isLayoutCollapsed = false;

                $timeout(function () {
                    $rootScope.$broadcast('igzWatchWindowResize::resize');
                });

                ctrl.deployVersion({version: versionCopy, projectID: ctrl.project.metadata.name})
                    .then(pullFunctionState)
                    .catch(function (error) {
                        var logs = [{
                            err: error.data.error
                        }];

                        lodash.set(ctrl.deployResult, 'status.state', 'error');
                        lodash.set(ctrl.deployResult, 'status.logs', logs);
                    });
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
                    'Deploying...'          ;
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
         * Checks event's content type
         * @param {string} type - type of content-type
         * @returns {boolean}
         */
        function checkEventContentType(type) {
            return eventContentType === type;
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
        function handleInvokeFunction() {
            if (!lodash.isNil(ctrl.selectedFunctionEvent)) {
                ctrl.isTestResultShown = false;


                ctrl.invokeFunction({eventData: ctrl.selectedFunctionEvent.eventData})
                    .then(function (response) {
                        return $q.reject(response);
                    })
                    .catch(function (invocationData) {
                        if (invocationData.config.headers['Content-Type'] === 'application/json' && lodash.isObject(invocationData.data)) {
                            eventContentType = 'json';
                            invocationData.data = angular.toJson(angular.fromJson(invocationData.data), ' ', 4);
                        } else if (lodash.startsWith(invocationData.config.headers['Content-Type'], 'image/')) {
                            eventContentType = 'image';
                        }

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
                        ctrl.isInvocationSuccess = lodash.startsWith(invocationData.status, '2');
                        ctrl.isTestResultShown = true;
                    });

                $timeout(function () {
                    $rootScope.$broadcast('igzWatchWindowResize::resize');
                }, 100);
            }
        }

        /**
         * Shows/hides test version result
         */
        function toggleTestResult() {
            ctrl.isTestResultShown = !ctrl.isTestResultShown;

            $timeout(function () {
                $rootScope.$broadcast('igzWatchWindowResize::resize');
            });
        }

        /**
         * Shows/hides deploy version result
         */
        function toggleDeployResult() {
            ctrl.isDeployResultShown = !ctrl.isDeployResultShown;

            $timeout(function () {
                $rootScope.$broadcast('igzWatchWindowResize::resize');
            });
        }

        /**
         * Called when row is collapsed/expanded
         * @param {string} row - name of expanded/collapsed row
         */
        function onRowCollapse(row) {
            ctrl.rowIsCollapsed[row] = !ctrl.rowIsCollapsed[row];

            $timeout(function () {
                $rootScope.$broadcast('igzWatchWindowResize::resize');
            }, 350);
        }

        /**
         * Called when action is selected
         * @param {Object} item - selected action
         */
        function onSelectAction(item) {
            if (item.id === 'deleteFunction') {
                DialogsService.confirm(item.dialog.message, item.dialog.yesLabel, item.dialog.noLabel, item.dialog.type)
                    .then(function () {
                        ctrl.isSplashShowed.value = true;

                        ctrl.deleteFunction({functionData: ctrl.version.metadata})
                            .then(function () {
                                $state.go('app.project.functions');
                            })
                            .catch(function (error) {
                                ctrl.isSplashShowed.value = false;
                                var msg = 'Oops: Unknown error occurred while deleting function';

                                if (!lodash.isEmpty(error.errors)) {
                                    msg = error.errors[0].detail;
                                }

                                DialogsService.alert(msg);
                            });
                    });
            } else if (item.id === 'exportFunction') {
                var versionYaml = {
                    metadata: lodash.omit(ctrl.version.metadata, 'namespace'),
                    spec: lodash.omit(ctrl.version.spec, ['build.noBaseImagesPull', 'loggerSinks'])
                };

                var parsedVersion = YAML.stringify(versionYaml, Infinity, 2);

                parsedVersion = getValidYaml(parsedVersion);

                var blob = new Blob([parsedVersion], {
                    type: 'application/json'
                });

                downloadExportedFunction(blob);
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
                };
            });

            ctrl.functionEvents = $filter('orderBy')(ctrl.functionEvents, 'name');
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
            lodash.set(lodash.find(ctrl.navigationTabsConfig, 'status'), 'status', 'building');

            interval = $interval(function () {
                ctrl.getFunction({metadata: ctrl.version.metadata, projectID: ctrl.project.metadata.name})
                    .then(function (response) {
                        if (response.status.state === 'ready' || response.status.state === 'error') {
                            if (!lodash.isNil(interval)) {
                                $interval.cancel(interval);
                                interval = null;
                            }

                            ctrl.versionDeployed = true;

                            if (lodash.isNil(ctrl.version.status)) {
                                ctrl.version.status = response.status;
                            }
                            ctrl.version.ui = {
                                deployedVersion: getVersionCopy(),
                                versionChanged: false
                            };

                            ctrl.getExternalIpAddresses()
                                .then(function (address) {
                                    ctrl.version.ui.invocationURL = 'http://' + address.data.externalIPAddresses.addresses[0] + ':' + ctrl.version.status.httpPort;
                                })
                                .catch(function (error) {
                                    var msg = 'Oops: Unknown error occurred while retrieving external IP address';

                                    if (!lodash.isEmpty(error.errors)) {
                                        msg = error.errors[0].detail;
                                    }

                                    DialogsService.alert(msg);
                                });

                            ctrl.isFunctionDeployed = true;
                        }

                        ctrl.version.ui.deployResult = response;

                        ctrl.deployResult = response;

                        lodash.set(lodash.find(ctrl.navigationTabsConfig, 'status'), 'status', response.status.state);

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

        /**
         * Sets function event as selected by name
         * @param name - name of function event to be set as selected
         */
        function setEventAsSelected(name) {
            ctrl.selectedFunctionEvent = lodash.find(ctrl.functionEvents, ['name', name]);
        }

        /**
         * Dynamically set version deployed state
         * @param {Object} [event]
         * @param {Object} data
         */
        function setVersionDeployed(event, data) {
            ctrl.versionDeployed = data.isDeployed;
        }

        /**
         * Prevents change state if there are unsaved data
         * @param {Event} event
         * @param {Object} toState
         * @param {Object} params
         */
        function stateChangeStart(event, toState, params) {
            if (lodash.get($state, 'params.functionId') !== params.functionId && !ctrl.versionDeployed) {
                event.preventDefault();
                DialogsService.confirm('Leaving this page will discard your changes.', 'Leave', 'Don\'t leave')
                    .then(function () {

                        // unsubscribe from broadcast event
                        deregisterFunction();
                        $state.go(toState.name, params);
                    });
            }
        }

        /**
         * Returns valid YAML-string.
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
         * will parsed by yaml.js package in sting with pair of single quotes.
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
         * Creates artificial link and starts downloading of exported function.
         * Downloaded .yaml file will be saved in user's default folder for downloads.
         * @param {string} data - exported function config parsed to YAML
         */
        function downloadExportedFunction(data) {
            var url = URL.createObjectURL(data);
            var link = document.createElement('a');

            link.href = url;
            link.download = ctrl.version.metadata.name + '.yaml';
            document.body.appendChild(link);
            link.click();

            $timeout(function () {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            });
        }
    }
}());
