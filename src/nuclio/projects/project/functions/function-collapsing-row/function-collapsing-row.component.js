(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclFunctionCollapsingRow', {
            bindings: {
                function: '<',
                project: '<',
                functionsList: '<',
                actionHandlerCallback: '&',
                externalAddress: '<',
                isSplashShowed: '<'
            },
            templateUrl: 'nuclio/projects/project/functions/function-collapsing-row/function-collapsing-row.tpl.html',
            controller: NclFunctionCollapsingRowController
        });

    function NclFunctionCollapsingRowController($state, lodash, NuclioClientService, NuclioFunctionsDataService, NuclioHeaderService, DialogsService, ConfigService) {
        var ctrl = this;

        ctrl.actions = [];
        ctrl.isCollapsed = true;
        ctrl.title = {
            project: ctrl.project,
            projectName: ctrl.project.spec.displayName,
            function: ctrl.function.metadata.name
        };
        ctrl.invocationURL = '';
        ctrl.runtimes = {
            'golang': 'Go',
            'python:2.7': 'Python 2.7',
            'python:3.6': 'Python 3.6',
            'pypy': 'Pypy',
            'dotnetcore': '.NET Core',
            'java': 'Java',
            'nodejs': 'NodeJS',
            'shell': 'Shell'
        };

        ctrl.scrollConfig = {
            axis: 'y',
            advanced: {
                updateOnContentResize: true
            }
        };

        ctrl.$onInit = onInit;

        ctrl.isFunctionShowed = isFunctionShowed;
        ctrl.handleAction = handleAction;
        ctrl.onFireAction = onFireAction;
        ctrl.onSelectRow = onSelectRow;
        ctrl.isDemoMode = ConfigService.isDemoMode;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            lodash.defaultsDeep(ctrl.function, {
                ui: {
                    delete: deleteFunction
                }
            });

            ctrl.convertedStatusState = lodash.chain(ctrl.function.status.state).lowerCase().upperFirst().value();

            ctrl.invocationURL = lodash.isNil(ctrl.function.status.httpPort) ? 'Not yet deployed' : 'http://' + ctrl.externalAddress + ':' + ctrl.function.status.httpPort;

            ctrl.actions = initActions();
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
            ctrl.actionHandlerCallback({actionType: actionType, checkedItems: checkedItems});
        }

        /**
         * Determines whether the current layer is showed
         * @returns {boolean}
         */
        function isFunctionShowed() {
            return ctrl.function.ui.isShowed;
        }

        /**
         * According to given action name calls proper action handler
         * @param {string} actionType - a type of action
         */
        function onFireAction(actionType) {
            ctrl.actionHandlerCallback({actionType: actionType, checkedItems: [ctrl.function]});
        }

        //
        // Private methods
        //

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
                }
            ];
        }

        /**
         * Deletes function from functions list
         * @returns {Promise}
         */
        function deleteFunction() {
            ctrl.isSplashShowed.value = true;

            return NuclioFunctionsDataService.deleteFunction(ctrl.function.metadata)
                .then(function () {
                    lodash.remove(ctrl.functionsList, ['metadata.name', ctrl.function.metadata.name]);
                })
                .catch(function (error) {
                    var errorMessages = {
                        403: 'You do not have permissions to delete this function.',
                        default: 'Unknown error occurred while deleting the function.'
                    };

                    return DialogsService.alert(lodash.get(errorMessages, error.status, errorMessages.default));
                });
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
    }
}());
