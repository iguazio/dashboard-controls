/* eslint max-statements: ["error", 100] */
(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclVersion', {
            bindings: {
                project: '<',
                version: '<',
                getProject: '&',
                getFunction: '&',
                getExternalIpAddresses: '&',
                deployVersion: '&',
                deleteFunction: '&',
                onEditCallback: '&?'
            },
            templateUrl: 'nuclio/projects/project/functions/version/version.tpl.html',
            controller: NclVersionController
        });

    function NclVersionController($interval, $scope, $rootScope, $state, $stateParams, $transitions, $timeout, lodash,
                                  ngDialog, ConfigService, DialogsService, ExportService, NuclioHeaderService) {
        var ctrl = this;
        var deregisterFunction = null;
        var interval = null;

        ctrl.action = null;
        ctrl.isDemoMode = ConfigService.isDemoMode;
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
        ctrl.rowIsCollapsed = {
            statusCode: false,
            headers: false,
            body: false,
            deployBlock: false
        };

        ctrl.isDeployDisabled = false;
        ctrl.isLayoutCollapsed = true;
        ctrl.versionDeployed = true;

        ctrl.$onDestroy = onDestroy;
        ctrl.$onInit = onInit;

        ctrl.deployButtonClick = deployButtonClick;
        ctrl.getDeployStatusState = getDeployStatusState;
        ctrl.checkValidDeployState = checkValidDeployState;
        ctrl.toggleDeployResult = toggleDeployResult;
        ctrl.onRowCollapse = onRowCollapse;
        ctrl.onSelectAction = onSelectAction;

        //
        // Hook method
        //

        /**
         * Destructor method
         */
        function onDestroy() {
            terminateInterval();
        }

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
                },
                {
                    id: 'viewConfig',
                    name: 'View YAML'
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
                    uiRoute: 'app.project.function.edit.triggers'
                },
                {
                    tabName: 'Status',
                    uiRoute: 'app.project.function.edit.monitoring',
                    status: lodash.isNil(ctrl.version.status) ? 'not yet deployed' : lodash.get(ctrl.version, 'status.state')
                }
            ];

            ctrl.requiredComponents = {};

            ctrl.getProject({id: $stateParams.projectId}).then(function (response) {

                // set projects data
                ctrl.project = response;

                // breadcrumbs config
                var title = {
                    project: ctrl.project,
                    projectName: ctrl.project.spec.displayName,
                    function: $stateParams.functionId,
                    version: '$LATEST'
                };

                NuclioHeaderService.updateMainHeader('Projects', title, $state.current.name);
            }).catch(function (error) {
                var msg = 'Oops: Unknown error occurred while retrieving project';
                DialogsService.alert(lodash.get(error, 'data.error', msg));
            });

            $scope.$on('change-state-deploy-button', changeStateDeployButton);
            $scope.$on('change-version-deployed-state', setVersionDeployed);

            deregisterFunction = $transitions.onStart({}, stateChangeStart);

            if (ctrl.checkValidDeployState()) {
                ctrl.isFunctionDeployed = false;
                ctrl.isDeployResultShown = true;
                ctrl.rowIsCollapsed.deployBlock = true;

                pullFunctionState();
            }

            ctrl.isLayoutCollapsed = true;

            lodash.defaultsDeep(ctrl.version, {
                spec: {
                    build: {
                        image: '',
                        noCache: false,
                        offline: false,
                        dependencies: [],
                        runtimeAttributes: {
                            repositories: []
                        }
                    }
                },
                ui: {
                    versionCode: ''
                }
            });

            lodash.merge(ctrl.version, {
                ui: {
                    deployedVersion: lodash.isNil(ctrl.version.status) ? null : getVersionCopy(),
                    versionChanged: false
                }
            });

            ctrl.getExternalIpAddresses()
                .then(setInvocationUrl)
                .catch(function () {
                    ctrl.version.ui.invocationURL = '';
                });
        }

        //
        // Public methods
        //

        /**
         * Deploys changed version
         */
        function deployButtonClick() {
            if (!ctrl.isDeployDisabled) {
                ctrl.isFunctionDeployed = false;
                $rootScope.$broadcast('deploy-function-version');

                setDeployResult('building');

                var versionCopy = lodash.omit(ctrl.version, ['status', 'ui']);

                // set `nuclio.io/project-name` label to relate this function to its project
                lodash.set(versionCopy, ['metadata', 'labels', 'nuclio.io/project-name'], ctrl.project.metadata.name);
                lodash.set(versionCopy, 'spec.build.mode', 'alwaysBuild');

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
            return state === 'ready' ? 'Successfully deployed' :
                   state === 'error' ? 'Failed to deploy'      :
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
                                DialogsService.alert(lodash.get(error, 'data.error', msg));
                            });
                    });
            } else if (item.id === 'exportFunction') {
                ExportService.exportFunction(ctrl.version);
            } else if (item.id === 'viewConfig') {
                ngDialog.open({
                    template: '<ncl-function-config-dialog data-close-dialog="closeThisDialog()" ' +
                        'data-function="ngDialogData.function"></ncl-function-config-dialog>',
                    plain: true,
                    data: {
                        function: ctrl.version,
                    },
                    className: 'ngdialog-theme-iguazio view-yaml-dialog-wrapper'
                });
            }
        }

        //
        // Private methods
        //

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
         * Sets the invocation URL of the function
         * @param {{externalIPAddresses: {addresses: Array.<string>}}} result - the response body from
         *     `getExternalIpAddresses`
         */
        function setInvocationUrl(result) {
            var ip = lodash.get(result, 'externalIPAddresses.addresses[0]', '');
            var port = lodash.defaultTo(
                lodash.get(ctrl.version, 'ui.deployResult.status.httpPort'),
                lodash.get(ctrl.version, 'status.httpPort')
            );

            ctrl.version.ui.invocationURL =
                lodash.isEmpty(ip) || !lodash.isNumber(port) ? '' : 'http://' + ip + ':' + port;
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
                            terminateInterval();

                            ctrl.versionDeployed = true;

                            if (lodash.isNil(ctrl.version.status)) {
                                ctrl.version.status = response.status;
                            }
                            ctrl.version.ui = {
                                deployedVersion: getVersionCopy(),
                                versionChanged: false
                            };

                            ctrl.getExternalIpAddresses()
                                .then(setInvocationUrl)
                                .catch(function () {
                                    ctrl.version.ui.invocationURL = '';
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
         * Dynamically set version deployed state
         * @param {Object} [event]
         * @param {Object} data
         */
        function setVersionDeployed(event, data) {
            ctrl.versionDeployed = data.isDeployed;
        }

        /**
         * Prevents change state if there are unsaved data
         * @param {Event} transition
         */
        function stateChangeStart(transition) {
            var toState = transition.$to();
            if (lodash.get($state, 'params.functionId') !== transition.params('to').functionId && !ctrl.versionDeployed) {
                transition.abort();
                DialogsService.confirm('Leaving this page will discard your changes.', 'Leave', 'Don\'t leave')
                    .then(function () {

                        // unsubscribe from broadcast event
                        deregisterFunction();
                        $state.go(toState.name, transition.params('to'));
                    });
            }
        }

        /**
         * Terminates the interval of function state polling.
         */
        function terminateInterval() {
            if (!lodash.isNil(interval)) {
                $interval.cancel(interval);
                interval = null;
            }
        }
    }
}());
