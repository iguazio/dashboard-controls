/* eslint max-statements: ["error", 100] */
(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclFunctionVersionRow', {
            bindings: {
                actionHandlerCallback: '&',
                project: '<',
                function: '<',
                version: '<',
                versionsList: '<'
            },
            templateUrl: 'nuclio/projects/project/functions/function-collapsing-row/function-version-row/function-version-row.tpl.html',
            controller: NclFunctionVersionRowController
        });

    function NclFunctionVersionRowController($state, lodash, ConfigService, NuclioHeaderService, FunctionsService) {
        var ctrl = this;

        ctrl.actions = [];
        ctrl.title = {
            project: ctrl.project,
            function: ctrl.function.metadata.name,
            version: ctrl.version.name
        };

        ctrl.$onInit = onInit;

        ctrl.isDemoMode = ConfigService.isDemoMode;
        ctrl.onFireAction = onFireAction;
        ctrl.showDetails = showDetails;
        ctrl.onSelectRow = onSelectRow;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            lodash.defaultsDeep(ctrl.version, {
                ui: {
                    checked: false,
                    delete: deleteVersion,
                    edit: editVersion
                }
            });

            ctrl.actions = FunctionsService.initVersionActions();

            var deleteAction = lodash.find(ctrl.actions, {'id': 'delete'});

            if (!lodash.isNil(deleteAction)) {
                deleteAction.confirm = {
                    message: 'Delete version “' + ctrl.version.name + '”?',
                    yesLabel: 'Yes, Delete',
                    noLabel: 'Cancel',
                    type: 'nuclio_alert'
                };
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
         * Handles mouse click on a version
         * Navigates to Code page
         * @param {MouseEvent} event
         * @param {string} state - absolute state name or relative state path
         */
        function showDetails(event, state) {
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
        }

        /**
         * Handles mouse click on a table row and navigates to Code page
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
                functionId: ctrl.function.metadata.name,
                projectNamespace: ctrl.project.metadata.namespace
            });
        }
    }
}());
