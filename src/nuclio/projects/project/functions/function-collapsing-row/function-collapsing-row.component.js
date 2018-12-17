(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclFunctionCollapsingRow', {
            bindings: {
                function: '<',
                project: '<',
                functionsList: '<',
                actionHandlerCallback: '&',
                handleDeleteFunction: '&',
                getFunction: '&',
                onUpdateFunction: '&',
                externalAddress: '<',
                isSplashShowed: '<'
            },
            templateUrl: 'nuclio/projects/project/functions/function-collapsing-row/function-collapsing-row.tpl.html',
            controller: NclFunctionCollapsingRowController
        });

    function NclFunctionCollapsingRowController($state, $interval, lodash, ngDialog, ConfigService, DialogsService,
                                                ExportService, NuclioHeaderService) {
        var ctrl = this;
        var tempFunctionCopy = null;
        var interval = null;

        ctrl.actions = [];
        ctrl.isCollapsed = true;
        ctrl.title = null;
        ctrl.invocationURL = '';
        ctrl.runtimes = {
            'golang': 'Go',
            'python:2.7': 'Python 2.7',
            'python:3.6': 'Python 3.6',
            'dotnetcore': '.NET Core',
            'java': 'Java',
            'nodejs': 'NodeJS',
            'shell': 'Shell',
            'ruby': 'Ruby'
        };

        ctrl.scrollConfig = {
            axis: 'y',
            advanced: {
                updateOnContentResize: true
            }
        };
        ctrl.statusIcon = null;

        ctrl.$onInit = onInit;
        ctrl.$onDestroy = onDestroy;

        ctrl.isFunctionShowed = isFunctionShowed;
        ctrl.getTooltip = getTooltip;
        ctrl.handleAction = handleAction;
        ctrl.onFireAction = onFireAction;
        ctrl.onSelectRow = onSelectRow;
        ctrl.toggleFunctionState = toggleFunctionState;
        ctrl.isDemoMode = ConfigService.isDemoMode;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.title = {
                project: ctrl.project,
                projectName: ctrl.project.spec.displayName,
                function: ctrl.function.metadata.name
            };

            lodash.defaultsDeep(ctrl.function, {
                ui: {
                    delete: deleteFunction,
                    export: exportFunction,
                    viewConfig: viewConfig
                }
            });

            convertStatusState();
            setStatusIcon();

            ctrl.invocationURL =
                lodash.isNil(ctrl.function.status.httpPort) ? 'Not yet deployed' :
                lodash.isEmpty(ctrl.externalAddress)        ? 'N/A'              :
                                                              'http://' + ctrl.externalAddress + ':' +
                                                              ctrl.function.status.httpPort;

            ctrl.actions = initActions();
        }

        /**
         * Destructor method
         */
        function onDestroy() {
            terminateInterval();
        }

        //
        // Public methods
        //

        /**
         * According to given action name calls proper action handler
         * @param {string} actionType
         * @param {Array} checkedItems
         * @returns {Promise}
         */
        function handleAction(actionType, checkedItems) {
            ctrl.actionHandlerCallback({ actionType: actionType, checkedItems: checkedItems });
        }

        /**
         * Determines whether the current layer is showed
         * @returns {boolean}
         */
        function isFunctionShowed() {
            return ctrl.function.ui.isShowed;
        }

        /**
         * Returns appropriate tooltip for functions status.
         * @returns {string} - tooltip
         */
        function getTooltip() {
            return ctrl.function.spec.disable ? 'Run function' : 'Stop function';
        }

        /**
         * According to given action name calls proper action handler
         * @param {string} actionType - a type of action
         */
        function onFireAction(actionType) {
            ctrl.actionHandlerCallback({ actionType: actionType, checkedItems: [ctrl.function] });
        }

        //
        // Private methods
        //

        /**
         * Converts function status state.
         */
        function convertStatusState() {
            var status = lodash.chain(ctrl.function.status.state).lowerCase().upperFirst().value();

            ctrl.convertedStatusState = status === 'Error'                                ? 'Error'          :
                                        status === 'Scaled to zero'                       ? 'Scaled to zero' :
                                        status === 'Ready' && ctrl.function.spec.disable  ? 'Standby'        :
                                        status === 'Ready' && !ctrl.function.spec.disable ? 'Running'        :
                                        /* else */                                          'Building';
        }

        /**
         * Disables function.
         * Sends request to change `spec.disable` property
         */
        function disableFunction() {

            // in case failed request, modified function object will be restored from that copy
            tempFunctionCopy = lodash.cloneDeep(ctrl.function);

            var propertiesToDisableFunction = {
                spec: {
                    disable: true,
                    build: {
                        mode: 'neverBuild'
                    }
                }
            };

            lodash.merge(ctrl.function, propertiesToDisableFunction);

            updateFunction('Disabling…');
        }

        /**
         * Enables function.
         * Sends request to change `spec.disable` property
         */
        function enableFunction() {

            // in case failed request, modified function object will be restored from that copy
            tempFunctionCopy = lodash.cloneDeep(ctrl.function);

            var propertiesToEnableFunction = {
                spec: {
                    disable: false,
                    build: {
                        mode: 'neverBuild'
                    }
                }
            };

            lodash.merge(ctrl.function, propertiesToEnableFunction);

            updateFunction('Enabling…');
        }

        /**
         * Initializes actions
         * @returns {Object[]} - list of actions
         */
        function initActions() {
            return [
                {
                    label: 'Delete',
                    id: 'delete',
                    icon: 'igz-icon-trash',
                    active: true,
                    confirm: {
                        message: 'Delete Function “' + ctrl.function.metadata.name + '”?',
                        description: 'Deleted function cannot be restored.',
                        yesLabel: 'Yes, Delete',
                        noLabel: 'Cancel',
                        type: 'nuclio_alert'
                    }
                },
                {
                    label: 'Export',
                    id: 'export',
                    icon: 'igz-icon-export-yml',
                    active: true
                },
                {
                    label: 'View YAML',
                    id: 'viewConfig',
                    active: true
                }
            ];
        }

        /**
         * Deletes function from functions list
         * @returns {Promise}
         */
        function deleteFunction() {
            ctrl.isSplashShowed.value = true;

            return ctrl.handleDeleteFunction({ functionData: ctrl.function.metadata })
                .then(function () {
                    lodash.remove(ctrl.functionsList, ['metadata.name', ctrl.function.metadata.name]);
                })
                .catch(function (error) {
                    ctrl.isSplashShowed.value = false;
                    var msg = 'Unknown error occurred while deleting the function.';

                    return DialogsService.alert(lodash.get(error, 'data.error', msg));
                });
        }

        /**
         * Exports the function
         */
        function exportFunction() {
            ExportService.exportFunction(ctrl.function);
        }

        /**
         * Handles mouse click on a table row and navigates to Code page of latest version
         * @param {MouseEvent} event
         * @param {string} state - absolute state name or relative state path
         */
        function onSelectRow(event, state) {
            if (!angular.isString(state)) {
                state = 'app.project.function.edit.code';
            }

            event.preventDefault();
            event.stopPropagation();

            $state.go(state, {
                id: ctrl.project.metadata.name,
                functionId: ctrl.function.metadata.name,
                projectNamespace: ctrl.project.metadata.namespace
            });

            NuclioHeaderService.updateMainHeader('Projects', ctrl.title, $state.current.name);
        }

        /**
         * Pulls function status.
         * Periodically sends request to get function's state, until state will not be 'ready' or 'error'.
         * @param {string} [status='Building'] - The text to display in "Status" cell of the function while polling.
         */
        function pullFunctionState(status) {
            ctrl.convertedStatusState = lodash.defaultTo(status, 'Building');
            setStatusIcon();

            interval = $interval(function () {
                ctrl.getFunction({ metadata: ctrl.function.metadata, projectID: ctrl.project.metadata.name })
                    .then(function (response) {
                        if (response.status.state === 'ready' || response.status.state === 'error') {
                            terminateInterval();
                            convertStatusState();
                            setStatusIcon();
                        }
                    })
                    .catch(function (error) {
                        var msg = 'Unknown error occurred while updating the function.';

                        terminateInterval();
                        convertStatusState();
                        setStatusIcon();

                        return DialogsService.alert(lodash.get(error, 'data.error', msg));
                    });
            }, 2000);
        }

        /**
         * Returns appropriate css icon class for functions status.
         * @returns {string} - icon class
         */
        function setStatusIcon() {
            ctrl.statusIcon = ctrl.convertedStatusState === 'Running' ? 'igz-icon-pause' :
                              ctrl.convertedStatusState === 'Standby' ? 'igz-icon-play'  :
                              /* else */                                '';
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
         * Toggles function 'disabled' property and updates it on back-end
         * @param {MouseEvent} event
         */
        function toggleFunctionState(event) {
            event.preventDefault();
            event.stopPropagation();

            if (ctrl.function.spec.disable) {
                enableFunction();
            } else {
                disableFunction();
            }
        }

        /**
         * Show dialog with YAML function config
         */
        function viewConfig() {
            ngDialog.open({
                template: '<ncl-function-config-dialog data-close-dialog="closeThisDialog()" ' +
                          '                            data-function="ngDialogData.function">' +
                          '</ncl-function-config-dialog>',
                plain: true,
                data: {
                    function: ctrl.function
                },
                className: 'ngdialog-theme-iguazio view-yaml-dialog-wrapper'
            });
        }

        /**
         * Sends request to update function state
         * @param {string} [status='Building'] - The text to display in "Status" cell of the function while polling.
         */
        function updateFunction(status) {
            ctrl.isSplashShowed.value = true;

            var pathsToExcludeOnDeploy = ['status', 'ui', 'versions'];
            var functionCopy = lodash.omit(ctrl.function, pathsToExcludeOnDeploy);

            // set `nuclio.io/project-name` label to relate this function to its project
            lodash.set(functionCopy, ['metadata', 'labels', 'nuclio.io/project-name'], ctrl.project.metadata.name);

            ctrl.onUpdateFunction({ 'function': functionCopy, projectID: ctrl.project.metadata.name })
                .then(function () {
                    tempFunctionCopy = null;

                    pullFunctionState(status);
                })
                .catch(function (error) {
                    ctrl.function = tempFunctionCopy;

                    var msg = 'Unknown error occurred while updating the function.';

                    return DialogsService.alert(lodash.get(error, 'data.error', msg));
                })
                .finally(function () {
                    ctrl.isSplashShowed.value = false;
                })
        }
    }
}());
