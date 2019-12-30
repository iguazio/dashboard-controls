/* eslint max-statements: ["error", 100] */
(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclFunctionVersionRow', {
            bindings: {
                actionHandlerCallback: '&',
                convertedStatusState: '<',
                function: '<',
                invocationUrl: '<',
                isFunctionCollapsed: '<',
                project: '<',
                statusIcon: '<',
                toggleFunctionState: '&',
                version: '<',
                versionsList: '<'
            },
            templateUrl: 'nuclio/functions/function-collapsing-row/function-version-row/function-version-row.tpl.html',
            controller: NclFunctionVersionRowController
        });

    function NclFunctionVersionRowController($state, $i18next, i18next, lodash, ActionCheckboxAllService,
                                             ConfigService, FunctionsService, NuclioHeaderService, TableSizeService) {
        var ctrl = this;
        var lng = i18next.language;

        ctrl.versionActions = [];
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
        ctrl.title = null;

        ctrl.$onInit = onInit;
        ctrl.$onDestroy = onDestroy;

        ctrl.onFireAction = onFireAction;
        ctrl.onSelectRow = onSelectRow;
        ctrl.onToggleFunctionState = onToggleFunctionState;

        ctrl.functionsService = FunctionsService;
        ctrl.getFunctionsTableColSize = TableSizeService.getFunctionsTableColSize;
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
                function: ctrl.function.metadata.name,
                version: ctrl.version.name
            };

            lodash.defaultsDeep(ctrl.version, {
                ui: {
                    checked: false,
                    delete: deleteVersion,
                    edit: editVersion
                }
            });

            initVersionActions();
        }

        /**
         * Destructor method
         */
        function onDestroy() {
            if (lodash.get(ctrl.version, 'ui.checked')) {
                lodash.set(ctrl.version, 'ui.checked', false);

                ActionCheckboxAllService.changeCheckedItemsCount(-1);
            }
        }

        //
        // Public methods
        //

        /**
         * According to given action name calls proper action handler
         * @param {string} actionType - a type of action
         */
        function onFireAction(actionType) {
            ctrl.actionHandlerCallback({actionType: actionType, checkedItems: [ctrl.version]});
        }

        /**
         * Handles mouse click on a table row and navigates to Code page
         * @param {MouseEvent} event
         * @param {string} state - absolute state name or relative state path
         */
        function onSelectRow(event, state) {
            if (lodash.isNil(event.target.closest('.igz-action-item'))) {
                if (!angular.isString(state)) {
                    state = 'app.project.function.edit.code';
                }

                event.preventDefault();
                event.stopPropagation();

                $state.go(state, {
                    id: ctrl.project.metadata.name,
                    projectId: ctrl.project.metadata.name,
                    functionId: ctrl.function.metadata.name,
                    projectNamespace: ctrl.project.metadata.namespace
                });

                NuclioHeaderService.updateMainHeader('common:PROJECTS', ctrl.title, $state.current.name);
            }
        }

        /**
         * Handles mouse click on toggle function state
         * @param {MouseEvent} event
         */
        function onToggleFunctionState(event) {
            ctrl.toggleFunctionState({event: event})
        }

        //
        // Private methods
        //

        /**
         * Deletes project from projects list
         */
        function deleteVersion() {
            // TODO no versions till now
        }

        /**
         * Opens `Edit project` dialog
         */
        function editVersion() {
            $state.go('app.project.function.edit.code', {
                projectId: ctrl.project.metadata.name,
                functionId: ctrl.function.metadata.name,
                projectNamespace: ctrl.project.metadata.namespace
            });
        }

        /**
         * Initializes version actions
         */
        function initVersionActions() {
            ctrl.versionActions = angular.copy(FunctionsService.initVersionActions());

            var deleteAction = lodash.find(ctrl.versionActions, {'id': 'delete'});

            if (!lodash.isNil(deleteAction)) {
                deleteAction.confirm.message = $i18next.t('functions:DELETE_VERSION', {lng: lng}) + ' “' + ctrl.version.name + '”?'
            }
        }
    }
}());
