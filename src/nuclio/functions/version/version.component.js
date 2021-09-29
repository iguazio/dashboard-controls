/* eslint max-statements: ["error", 100] */
(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclVersion', {
            bindings: {
                project: '<',
                version: '<',
                containers: '<',
                createVersion: '&',
                deleteFunction: '&',
                getFunction: '&',
                getFunctions: '&',
                onEditCallback: '&?',
                updateVersion: '&'
            },
            templateUrl: 'nuclio/functions/version/version.tpl.html',
            controller: NclVersionController
        });

    function NclVersionController($i18next, $interval, $rootScope, $scope, $state, $stateParams, $transitions, $timeout,
                                  i18next, lodash, ngDialog, ConfigService, DialogsService, ExportService,
                                  FunctionsService, NuclioHeaderService, VersionHelperService) {
        var ctrl = this;
        var deregisterFunction = null;
        var interval = null;
        var lng = i18next.language;
        var steadyStates = FunctionsService.getSteadyStates();

        var FUNCTION_STATE_POLLING_DELAY = 3000;

        ctrl.action = null;
        ctrl.isDemoMode = ConfigService.isDemoMode;
        ctrl.scrollConfig = {
            axis: 'y',
            advanced: {
                updateOnContentResize: true
            }
        };
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

        ctrl.$onDestroy = onDestroy;
        ctrl.$onInit = onInit;

        ctrl.deployButtonClick = deployButtonClick;
        ctrl.getCurrentStateName = getCurrentStateName;
        ctrl.getDeployStatusState = getDeployStatusState;
        ctrl.isDeployButtonDisabled = isDeployButtonDisabled;
        ctrl.isInValidDeployState = isInValidDeployState;
        ctrl.onRowCollapse = onRowCollapse;
        ctrl.onSelectAction = onSelectAction;
        ctrl.refreshFunction = refreshFunction;
        ctrl.toggleDeployResult = toggleDeployResult;

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
            ctrl.isFunctionDeployed = !$stateParams.isNewFunction;
            ctrl.actions = [
                {
                    id: 'exportFunction',
                    name: $i18next.t('functions:EXPORT_FUNCTION', { lng: lng })
                },
                {
                    id: 'deleteFunction',
                    name: $i18next.t('functions:DELETE_FUNCTION', { lng: lng }),
                    dialog: {
                        message: {
                            message: $i18next.t('functions:DELETE_FUNCTION', { lng: lng }) + ' “' + ctrl.version.metadata.name + '”?',
                            description: $i18next.t('functions:DELETE_FUNCTION_DESCRIPTION', { lng: lng })
                        },
                        yesLabel: $i18next.t('common:YES_DELETE', { lng: lng }),
                        noLabel: $i18next.t('common:CANCEL', { lng: lng }),
                        type: 'nuclio_alert'
                    }
                },
                {
                    id: 'duplicateFunction',
                    name: $i18next.t('functions:DUPLICATE_FUNCTION', { lng: lng })
                },
                {
                    id: 'viewConfig',
                    name: $i18next.t('functions:VIEW_YAML', { lng: lng })
                }
            ];

            ctrl.navigationTabsConfig = [
                {
                    tabName: $i18next.t('common:CODE', { lng: lng }),
                    id: 'code',
                    uiRoute: 'app.project.function.edit.code'
                },
                {
                    tabName: $i18next.t('common:CONFIGURATION', { lng: lng }),
                    id: 'configuration',
                    uiRoute: 'app.project.function.edit.configuration'
                },
                {
                    tabName: $i18next.t('common:TRIGGERS', { lng: lng }),
                    id: 'triggers',
                    uiRoute: 'app.project.function.edit.triggers'
                },
                {
                    tabName: $i18next.t('common:STATUS', { lng: lng }),
                    id: 'status',
                    uiRoute: 'app.project.function.edit.monitoring',
                    indicator: {
                        lightClass: '',
                        tooltipClass: '',
                        tooltipIconClass: '',
                        tooltipText: ''
                    }
                }
            ];

            setDeployResult(lodash.get(ctrl.version, 'status.state', ''));

            ctrl.requiredComponents = {};

            $timeout(function () {
                // update breadcrumbs
                var title = {
                    project: ctrl.project,
                    function: $stateParams.functionId,
                    version: '$LATEST'
                };

                NuclioHeaderService.updateMainHeader('common:PROJECTS', title, $state.current.name);
            });

            $scope.$on('change-state-deploy-button', changeStateDeployButton);

            deregisterFunction = $transitions.onStart({}, stateChangeStart);

            if (ctrl.isInValidDeployState()) {
                ctrl.isFunctionDeployed = false;
                ctrl.isDeployResultShown = true;
                ctrl.rowIsCollapsed.deployBlock = true;

                pollFunctionState();
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
                    versionCode: '',
                    isTriggersChanged: false,
                    isVolumesChanged: false
                }
            });

            if (FunctionsService.isKubePlatform()) {
                lodash.defaults(ctrl.version.spec, {
                    waitReadinessTimeoutBeforeFailure: false
                });
            }

            lodash.merge(ctrl.version, {
                ui: {
                    deployedVersion: VersionHelperService.isVersionDeployed(ctrl.version) ? getVersionCopy() : null,
                    versionChanged: false
                }
            });

            setImageNamePrefixTemplate();
            setIngressHost();
        }

        //
        // Public methods
        //

        /**
         * Deploys changed version
         * @param {MouseEvent} event
         * @param {Object} [version] - version of existing function
         */
        function deployButtonClick(event, version) {
            if (!ctrl.isDeployDisabled) {
                ctrl.isFunctionDeployed = false;
                $rootScope.$broadcast('deploy-function-version', { event: event });

                var versionCopy = lodash.omit(angular.isDefined(version) ? version : ctrl.version, ['status', 'ui']);

                // set `nuclio.io/project-name` label to relate this function to its project
                lodash.set(versionCopy, ['metadata', 'labels', 'nuclio.io/project-name'], ctrl.project.metadata.name);
                lodash.set(versionCopy, 'spec.build.mode', 'alwaysBuild');

                ctrl.isTestResultShown = false;
                ctrl.isDeployResultShown = false;
                ctrl.rowIsCollapsed.deployBlock = true;
                ctrl.isLayoutCollapsed = false;
                ctrl.isSplashShowed.value = true;

                var isVersionDeployed = VersionHelperService.isVersionDeployed(ctrl.version);
                var method = isVersionDeployed || ctrl.version.ui.overwrite ? ctrl.updateVersion : ctrl.createVersion;

                method({ version: versionCopy, projectId: ctrl.project.metadata.name })
                    .then(function () {
                        pollFunctionState();

                        $timeout(function () {
                            $rootScope.$broadcast('igzWatchWindowResize::resize');
                        });
                    })
                    .catch(function (error) {
                        var defaultMsg = $i18next.t('common:ERROR_MSG.UNKNOWN_ERROR', { lng: lng });

                        if (error.status === 409 && isVersionDeployed) {
                            return FunctionsService.openVersionOverwriteDialog()
                                .then(function () {
                                    deployButtonClick(event, lodash.omit(ctrl.version, 'metadata.resourceVersion'));
                                })
                                .catch(function () {
                                    ctrl.isFunctionDeployed = true;
                                });
                        } else if (error.status === 404 && method === ctrl.updateVersion) {
                            // if this function no longer exists attempt to create it rather than update it
                            lodash.merge(ctrl.version, {
                                status: {
                                    state: '' // if it was considered deployed before - now it is not
                                },
                                ui: {
                                    overwrite: false // if it was considered an overwrite - now it is not
                                }
                            });
                            return deployButtonClick(event, version);
                        } else {
                            return DialogsService.alert(lodash.get(error, 'data.error', defaultMsg)).then(function () {
                                ctrl.isFunctionDeployed = true;
                            });
                        }
                    })
                    .finally(function () {
                        ctrl.isSplashShowed.value = false;
                    });
            }
        }

        /**
         * Returns current UI router state name.
         * @returns {string} the current state name.
         */
        function getCurrentStateName() {
            return $state.current.name;
        }

        /**
         * Gets current status state
         * @param {string} state
         * @returns {string}
         */
        function getDeployStatusState(state) {
            return state === 'ready' ? $i18next.t('functions:SUCCESSFULLY_DEPLOYED', { lng: lng }) :
                   state === 'error' ? $i18next.t('functions:FAILED_TO_DEPLOY', { lng: lng })      :
                   /* else */          $i18next.t('functions:DEPLOYING', { lng: lng });
        }

        /**
         * Checks if "Deploy" button is disabled
         * @returns {boolean}
         */
        function isDeployButtonDisabled() {
            return ctrl.isInValidDeployState() || lodash.get(ctrl.version, 'ui.isTriggersChanged', false) ||
                lodash.get(ctrl.version, 'ui.isVolumesChanged', false) || ctrl.isDeployDisabled;
        }

        /**
         * Checks if state of deploy is valid
         * @returns {boolean}
         */
        function isInValidDeployState() {
            var validStates = [
                'building',
                'waitingForResourceConfiguration',
                'waitingForBuild',
                'configuringResources'
            ];

            return lodash.includes(validStates, ctrl.version.status.state);
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
                var apiGateways = lodash.get(ctrl.version, 'status.apiGateways', []);

                if (lodash.isEmpty(apiGateways)) {
                    DialogsService.confirm(item.dialog.message, item.dialog.yesLabel, item.dialog.noLabel, item.dialog.type)
                        .then(function () {
                            deleteFunction();
                        });
                } else {
                    DialogsService.alert($i18next.t('functions:ERROR_MSG.DELETE_API_GW_FUNCTION',
                                                    { lng: lng, apiGatewayName: apiGateways[0] }));
                }
            } else if (item.id === 'exportFunction') {
                ExportService.exportFunction(ctrl.version);
            } else if (item.id === 'viewConfig') {
                ngDialog.open({
                    template: '<ncl-function-config-dialog data-close-dialog="closeThisDialog()" ' +
                        'data-function="ngDialogData.function"></ncl-function-config-dialog>',
                    plain: true,
                    data: {
                        function: ctrl.version
                    },
                    className: 'ngdialog-theme-iguazio view-yaml-dialog-wrapper'
                });
            } else if (item.id === 'duplicateFunction') {
                ngDialog.open({
                    template: '<ncl-duplicate-function-dialog data-close-dialog="closeThisDialog()" ' +
                                  'data-get-function="ngDialogData.getFunction({metadata: metadata})" ' +
                                  'data-project="ngDialogData.project" data-version="ngDialogData.version">' +
                              '</ncl-duplicate-function-dialog>',
                    plain: true,
                    data: {
                        getFunctions: ctrl.getFunctions,
                        getFunction: ctrl.getFunction,
                        project: ctrl.project,
                        version: ctrl.version
                    },
                    className: 'ngdialog-theme-iguazio duplicate-function-dialog-wrapper'
                });
            }
        }

        /**
         * Refreshes function data
         */
        function refreshFunction() {
            ctrl.isSplashShowed.value = true;

            ctrl.getFunction({ metadata: ctrl.version.metadata, enrichApiGateways: true })
                .then(function (response) {
                    var versionUi = ctrl.version.ui;
                    ctrl.version = response;
                    ctrl.version.ui = versionUi;

                    setImageNamePrefixTemplate();
                    setIngressHost();
                })
                .catch(function (error) {
                    var defaultMsg = $i18next.t('functions:ERROR_MSG.GET_FUNCTION', { lng: lng });

                    DialogsService.alert(lodash.get(error, 'data.error', defaultMsg));
                })
                .finally(function () {
                    ctrl.isSplashShowed.value = false;
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

        //
        // Private methods
        //

        /**
         * Disable deploy button if forms invalid
         * @param {Object} event
         * @param {Object} args
         * @param {string} args.component
         * @param {boolean} args.isDisabled
         */
        function changeStateDeployButton(event, args) {
            if (lodash.isString(args.component)) {
                ctrl.requiredComponents[args.component] = args.isDisabled;

                // disable the "Deploy" button if at least one component is invalid
                // enable the "Deploy" button if all components are valid
                ctrl.isDeployDisabled = lodash.some(ctrl.requiredComponents);
            } else {
                ctrl.isDeployDisabled = args.isDisabled;
            }
        }

        /**
         * Deletes function item
         * @param {Object} [version]
         * @param {Boolean} [ignoreValidation] - determines whether to forcibly remove the function
         */
        function deleteFunction(version, ignoreValidation) {
            ctrl.isSplashShowed.value = true;

            ctrl.deleteFunction({
                functionData: lodash.defaultTo(version, ctrl.version).metadata,
                ignoreValidation: ignoreValidation
            })
                .then(function () {
                    $state.go('app.project.functions');
                })
                .catch(function (error) {
                    var defaultMsg = $i18next.t('functions:ERROR_MSG.DELETE_FUNCTION', { lng: lng });

                    if (error.status === 409) {
                        FunctionsService.openVersionDeleteDialog()
                            .then(function () {
                                deleteFunction(lodash.omit(ctrl.version, ['metadata.resourceVersion']));
                            });
                    } else if (
                        error.status === 412 &&
                        error.data.error.includes('Function is being provisioned and cannot be deleted')
                    ) {
                        FunctionsService.openVersionDeleteDialog(true)
                            .then(function () {
                                deleteFunction(lodash.omit(ctrl.version, ['metadata.resourceVersion']), true);
                            });
                    } else {
                        DialogsService.alert(lodash.get(error, 'data.error', defaultMsg));
                    }
                })
                .finally(function () {
                    ctrl.isSplashShowed.value = false;
                });
        }

        /**
         * Fills template parameters with actual values.
         * @param {string} template - The template with parameters to fill.
         * @param {Object.<string, string>} parameters - An object with parameter name as keys and their corresponding
         *     replacements as values.
         * @returns {string} the resulting string of replacing each template parameter with its corresponding value (if
         *     any).
         * @example
         * fillTemplate({ '{{what}}': 'JS', '{{how}}': 'awesome' }, '{{what}} is {{how}}!');
         * // => 'JS is awesome!'
         */
        function fillTemplate(template, parameters) {
            return lodash.reduce(parameters, function (result, value, key) {
                return lodash.isEmpty(value) ? result : result.replace(key, value);
            }, template);
        }

        /**
         * Gets copy of ctrl.version without `ui` property
         */
        function getVersionCopy() {
            return angular.copy(lodash.omit(ctrl.version, 'ui'));
        }

        /**
         * Polls function status.
         * Periodically sends request to get function's state, until state is steady.
         */
        function pollFunctionState() {
            ctrl.isDeployResultShown = true;
            lodash.set(ctrl.version, 'status.logs', []);
            setDeployResult('building');

            interval = $interval(function () {
                ctrl.getFunction({ metadata: ctrl.version.metadata, enrichApiGateways: true })
                    .then(function (aFunction) {
                        ctrl.version.status = aFunction.status;

                        if (lodash.includes(steadyStates, lodash.get(aFunction, 'status.state'))) {
                            terminateInterval();

                            ctrl.versionDeployed = true;

                            var versionUi = ctrl.version.ui;
                            ctrl.version = aFunction;
                            ctrl.version.ui = versionUi;

                            lodash.assign(ctrl.version.ui, {
                                deployedVersion: getVersionCopy(),
                                versionChanged: false
                            });

                            setImageNamePrefixTemplate();
                            setIngressHost();

                            ctrl.isFunctionDeployed = true;
                        }

                        updateStatusTabIndicator();

                        $timeout(function () {
                            angular.element('.log-panel').mCustomScrollbar('scrollTo', 'bottom');
                        });
                    })
                    .catch(function (error) {
                        if (error.status !== 404) {
                            ctrl.isSplashShowed.value = false;
                        }
                    });
            }, FUNCTION_STATE_POLLING_DELAY);
        }

        /**
         * Sets deploying results
         * @param {string} value
         */
        function setDeployResult(value) {
            lodash.set(ctrl.version, 'status.state', value);
            updateStatusTabIndicator();
        }

        /**
         * Sets image name prefix and default image name based on template
         */
        function setImageNamePrefixTemplate() {
            var functionName = lodash.get(ctrl.version, 'metadata.name');
            var imageNamePrefixTemplate = lodash.get(ConfigService, 'nuclio.imageNamePrefixTemplate', '');
            var parameters = {
                '{{ .FunctionName }}': functionName,
                '{{ .ProjectName }}': lodash.get(ctrl.project, 'metadata.name')
            };
            var imageNamePrefix = fillTemplate(imageNamePrefixTemplate, parameters);
            var defaultImageName = lodash.isEmpty(imageNamePrefixTemplate) ?
                'processor-' + functionName :
                imageNamePrefix + 'processor';

            lodash.assign(ctrl.version.ui, {
                defaultImageName: defaultImageName,
                imageNamePrefix: imageNamePrefix
            });
        }

        /**
         * Sets ingress host based on template
         */
        function setIngressHost() {
            var ingressHostTemplate = lodash.get(ConfigService, 'nuclio.ingressHostTemplate', '');
            var parameters = {
                '{{ .ResourceName }}': lodash.get(ctrl.version, 'metadata.name'),
                '{{ .ProjectName }}': lodash.get(ctrl.project, 'metadata.name'),
                '{{ .Namespace }}': lodash.get(ctrl.project, 'metadata.namespace')
            };

            ctrl.version.ui.ingressHost = fillTemplate(ingressHostTemplate, parameters);
        }

        /**
         * Prevents change state if there are unsaved data
         * @param {Event} transition
         */
        function stateChangeStart(transition) {
            var toState = transition.$to();
            if (
                lodash.get($state, 'params.functionId') !== transition.params('to').functionId &&
                !VersionHelperService.isVersionDeployed(ctrl.version)
            ) {
                transition.abort();

                DialogsService.confirm($i18next.t('common:LEAVE_PAGE_CONFIRM', { lng: lng }),
                                       $i18next.t('common:LEAVE', { lng: lng }),
                                       $i18next.t('common:DONT_LEAVE', { lng: lng }))
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

        /**
         * Updates the status tab header's indicator color and tooltip text and color to reflect ths function's state.
         */
        function updateStatusTabIndicator() {
            var state = lodash.get(ctrl.version, 'status.state');
            var disabled = lodash.get(ctrl.version, 'spec.disable');

            var deployedStateToKind = {
                ready: disabled ? '' : 'ready',
                error: 'error',
                unhealthy: 'error',
                imported: '',
                scaledToZero: ''
            };
            var kind = VersionHelperService.isVersionDeployed(ctrl.version) ?
                lodash.defaultTo(deployedStateToKind[state], 'building') :
                '';

            var statusTab = lodash.find(ctrl.navigationTabsConfig, { id: 'status' });
            statusTab.indicator = {
                lightClass: kind === '' ? '' : 'ncl-status-' + kind,
                tooltipClass: kind === '' ? '' : 'ncl-status-tooltip-' + kind,
                tooltipIconClass: kind === '' ? '' : 'ncl-icon-' + kind,
                tooltipText: FunctionsService.getDisplayStatus(ctrl.version)
            };
        }
    }
}());
